import { useState, useEffect, useCallback } from "react";
import { Edit } from "lucide-react";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

// --- LOGIKA PROMOSI OTOMATIS ---
const getNextPosition = (currentPosition) => {
    // Memperbaiki logika agar SL mengarah ke Manager
    const positionMap = {
        "FO": "DO",
        "DO": "SL/SPV",
        "SL": "Manager",
        "SL/SPV": "Manager", // Menambah SL/SPV jika data Anda menggunakan format ini
        "Manager": "Manager", 
    };
    return positionMap[currentPosition] || currentPosition; 
};

// --- Komponen Modal Kustom (Wajib) ---
const CustomModal = ({ isOpen, onClose, title, message, onConfirm, showConfirmButton }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
            <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-sm transform transition-all">
                <h3 className={`text-xl font-bold mb-3 ${showConfirmButton ? 'text-red-600' : 'text-blue-600'}`}>{title}</h3>
                <p className="text-gray-700 mb-6">{message}</p>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                    >
                        {showConfirmButton ? 'Batal' : 'Tutup'}
                    </button>
                    {showConfirmButton && (
                        <button
                            onClick={onConfirm}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                        >
                            Yakin Tetapkan
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};


export default function EnergiPower() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ isOpen: false, data: null, title: '', message: '' }); 
    
    const AREA_KERJA = "Power Plant"; 

    // 🔥 Ambil data karyawan dari Firestore
    const fetchData = useCallback(async () => {
        setLoading(true);

        try {
            const usersQuery = query(
                collection(db, "users"),
                where("areaKerja", "==", AREA_KERJA)
            );

            const snapshot = await getDocs(usersQuery);

            const employees = snapshot.docs.map((doc, index) => {
                const docData = doc.data();
                
                // Jika nextPosition sudah ada di DB, gunakan itu. Jika belum, hitung posisi baru secara otomatis untuk tampilan UI.
                const calculatedNextPos = getNextPosition(docData.position);

                // 🔥 PERBAIKAN LOGIKA KRITIS DI SINI 🔥
                const dbNextPosition = docData.nextPosition;
                
                let finalNextPosition;

                // Cek apakah nilai dari database adalah T/A atau string kosong.
                if (dbNextPosition && dbNextPosition !== 'T/A' && dbNextPosition !== '') {
                    // Jika ada nilai valid (misal: DO, SL/SPV), gunakan nilai dari DB (yang sudah ditetapkan admin).
                    finalNextPosition = dbNextPosition;
                } else {
                    // Jika nilai dari DB adalah T/A, kosong, null, atau undefined, gunakan perhitungan otomatis.
                    finalNextPosition = calculatedNextPos;
                }

                return {
                    no: index + 1,
                    id: doc.id,
                    nama: doc.data().name,
                    nik: doc.data().nik,
                    posisiSekarang: doc.data().position,
                    // ⭐️ Tampilkan target promosi dari DB (docData.nextPosition) atau hitung yang baru (calculatedNextPos).
                    posisiBaru: finalNextPosition, 
                    areaKerja: doc.data().areaKerja,
                };
            });

            setData(employees);

        } catch (err) {
            console.error("Error fetching data:", err);
            console.error("Gagal memuat data dari database!"); 
        }

        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);


    // --- FUNGSI UPDATE FIRESTORE YANG SEBENARNYA (HANYA MENGATUR TARGET) ---
    const executeUbahPosisi = async () => {
        const userToUpdate = modal.data;
        // Hitung target posisi BARU berdasarkan posisi saat ini
        const targetPosition = getNextPosition(userToUpdate.posisiSekarang);
        
        setModal({ isOpen: false, data: null, title: '', message: '' });

        if (targetPosition === userToUpdate.posisiSekarang && targetPosition === "Manager") {
             console.log(`Posisi ${userToUpdate.nama} sudah Manager.`);
             return;
        }

        try {
            const userDocRef = doc(db, "users", userToUpdate.id);
            
            // ⭐️ PERUBAHAN: HANYA UPDATE nextPosition
            await updateDoc(userDocRef, {
                nextPosition: targetPosition, // Menetapkan target promosi untuk HR
                isAssessmentReady: true // Memberi sinyal ke halaman HR
            });

            fetchData(); // Refresh data

            console.log(`✅ Target promosi ${userToUpdate.nama} ditetapkan ke ${targetPosition}.`);
            
        } catch (error) {
            console.error("Error updating target position:", error);
            console.error("❌ Gagal menetapkan posisi target di database.");
        }
    };
    
    // --- HANDLE KLIK DI TABEL (MEMBUKA MODAL KONFIRMASI) ---
    const handleUbahPosisi = (user) => {
        const nextPos = getNextPosition(user.posisiSekarang);
        
        if (nextPos === user.posisiSekarang && nextPos === "Manager") {
             setModal({
                 isOpen: true,
                 data: user,
                 title: 'Promosi Gagal',
                 message: `Posisi ${user.nama} sudah Manager dan tidak bisa dipromosikan lagi.`,
                 showConfirmButton: false, 
             });
             return;
        }

        setModal({
            isOpen: true,
            data: user,
            title: 'Konfirmasi Penetapan Posisi',
            message: `Yakin ingin menetapkan target promosi ${user.nama} dari ${user.posisiSekarang} menjadi ${nextPos}? Data akan muncul di halaman HR untuk Assessment.`,
            showConfirmButton: true,
        });
    };

    if (loading) {
        return (
            <div className="p-6 text-center text-gray-500">
                Memuat data karyawan...
            </div>
        );
    }

    // --- RENDER TAMPILAN ---
    return (
        <div className="p-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-2xl font-bold mb-2 text-blue-700">Kompetensi Karyawan</h2>
                <p className="mb-6 font-medium text-gray-600">Unit 1 : Energi Power Plant</p>

                <div className="overflow-x-auto shadow-lg rounded-lg">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead>
                            <tr className="bg-blue-600 text-white text-sm uppercase tracking-wider">
                                <th className="border px-3 py-3 w-12 text-center">No</th>
                                <th className="border px-3 py-3 w-48 text-left">Nama Peserta</th>
                                <th className="border px-3 py-3 w-32 text-left">NIK</th>
                                <th className="border px-3 py-3 w-40 text-left">Posisi Sekarang</th>
                                <th className="border px-3 py-3 w-32 text-center">Posisi Baru</th>
                                <th className="border px-3 py-3 w-32 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row) => {
                                // Tampilkan target posisi (sudah dihitung di fetchData atau diambil dari DB)
                                const targetPos = row.posisiBaru; 
                                const isFinalPosition = row.posisiSekarang === "Manager";
                                
                                return (
                                <tr key={row.id} className="border-b hover:bg-blue-50 transition duration-150">
                                    <td className="border px-3 py-2 text-center">{row.no}</td>
                                    <td className="border px-3 py-2 font-medium text-gray-800">{row.nama}</td>
                                    <td className="border px-3 py-2">{row.nik}</td>
                                    <td className="border px-3 py-2">
                                        <span className="inline-block px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                                            {row.posisiSekarang}
                                        </span>
                                    </td>
                                    {/* Kolom Posisi Baru */}
                                    <td className="border px-3 py-2 text-center">
                                        <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${isFinalPosition ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-800'}`}>
                                            {targetPos}
                                        </span>
                                    </td>
                                    <td className="border px-3 py-2 text-center">
                                        <button
                                            onClick={() => handleUbahPosisi(row)}
                                            className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 text-sm flex items-center justify-center space-x-1 mx-auto disabled:opacity-50"
                                            disabled={isFinalPosition}
                                        >
                                            <Edit className="w-4 h-4" />
                                            <span>Ubah Posisi</span>
                                        </button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Konfirmasi Ubah Posisi */}
            {modal.isOpen && (
                <CustomModal
                    isOpen={modal.isOpen}
                    onClose={() => setModal({ isOpen: false, data: null, title: '', message: '' })}
                    title={modal.title}
                    message={modal.message}
                    onConfirm={executeUbahPosisi}
                    showConfirmButton={modal.showConfirmButton}
                />
            )}
        </div>
    );
}
