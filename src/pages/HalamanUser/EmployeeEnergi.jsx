import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle } from 'lucide-react'; 
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig"; 

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
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                            Yakin Update
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};


export default function EmployeeEnergi() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [modal, setModal] = useState({
        isOpen: false,
        type: '', 
        title: '',
        message: '',
        user: null, 
        showConfirmButton: false,
    });
    
    const AREA_KERJA = "Power Plant"; 
    const UNIT_TITLE = "Unit 1: Energi Power Plant";

    // --- Ambil data karyawan dari Firestore ---
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
                
                const kompetensiSekarang = docData.kompetensiSekarang || { teknikal: false, safety: false, legal: false, softSkill: false };
                const kompetensiBaru = docData.kompetensiBaru || { teknikal: false, safety: false, legal: false, softSkill: false };
                
                return {
                    no: index + 1,
                    id: doc.id,
                    nama: docData.name,
                    posisiSekarang: docData.position || 'N/A',
                    posisiBaru: docData.nextPosition || docData.position, 
                    kompetensiSekarang: kompetensiSekarang,
                    kompetensiBaru: kompetensiBaru,
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


    // --- FUNGSI FINAL: UPDATE POSISI SEBENARNYA DI FIRESTORE ---
    const executeFinalPositionUpdate = async () => {
        const userToUpdate = modal.user;
        const targetPosition = userToUpdate.posisiBaru; 

        if (targetPosition === userToUpdate.posisiSekarang) {
            console.error("Target posisi tidak valid atau sama dengan posisi sekarang.");
            setModal({ isOpen: false, type: '', title: '', message: '', user: null });
            return;
        }

        try {
            const userDocRef = doc(db, "users", userToUpdate.id);
            
            await updateDoc(userDocRef, {
                position: targetPosition, // Posisi saat ini diubah ke posisi target
                nextPosition: targetPosition === "Manager" ? "Manager" : 'T/A', // Reset target promosi
                // Reset status kompetensi
                kompetensiBaru: { teknikal: false, safety: false, legal: false, softSkill: false },
                kompetensiSekarang: { teknikal: false, safety: false, legal: false, softSkill: false },
            });
            
            setModal({ isOpen: false, type: '', title: '', message: '', user: null });
            fetchData(); // Refresh data

            console.log(`✅ Posisi ${userToUpdate.nama} berhasil DIPROMOSIKAN ke ${targetPosition}.`);

        } catch (error) {
            console.error("Error updating position:", error);
            console.error("❌ Gagal melakukan promosi di database.");
        }
    };


    // --- HANDLE KLIK UNTUK KONFIRMASI UPDATE FINAL ---
    const handleFinalUpdateClick = (user) => {
        const targetPos = user.posisiBaru;
        
        // Cek apakah target posisi sama dengan posisi sekarang (berarti tidak ada promosi yang ditetapkan/sudah Manager)
        if (targetPos === user.posisiSekarang) {
             setModal({
                isOpen: true,
                title: 'Aksi Gagal',
                message: `${user.nama}: Tidak ada promosi baru yang ditetapkan oleh Administrator atau sudah Manager.`,
                showConfirmButton: false,
                user: null,
            });
            return;
        }

        setModal({
            isOpen: true,
            type: 'final_update',
            title: 'Konfirmasi Promosi Final',
            message: `Yakin mempromosikan ${user.nama} secara permanen dari ${user.posisiSekarang} ke ${user.posisiBaru}?`,
            user: user,
            showConfirmButton: true,
        });
    };

    // --- FUNGSI LOGIKA Checkbox ---
    const handleCheckboxChange = async (index, tipe, field) => {
        const updatedData = [...data];
        const userToUpdate = updatedData[index];
        const currentStatus = userToUpdate[tipe][field];
        
        // Update state lokal
        updatedData[index][tipe][field] = !currentStatus;
        setData(updatedData);

        // Simpan perubahan ke Firestore
        try {
            const userDocRef = doc(db, "users", userToUpdate.id);
            await updateDoc(userDocRef, {
                [tipe]: updatedData[index][tipe], // Simpan seluruh objek kompetensi
            });
            console.log(`Checkbox ${field} updated for ${userToUpdate.nama} in Firestore.`);

        } catch (error) {
            console.error("Error saving checkbox state:", error);
            // Rollback state lokal jika gagal
            updatedData[index][tipe][field] = currentStatus;
            setData(updatedData);
        }
    };

    const handleCloseModal = () => {
        setModal({ isOpen: false, type: '', title: '', message: '', user: null });
    };

    // Fungsi dasar yang dibutuhkan
    const handleConfirmDelete = (index) => { 
        setModal({
            isOpen: true,
            type: 'delete',
            title: 'Konfirmasi Penghapusan',
            message: `Apakah Anda yakin ingin menghapus data peserta ${data[index].nama}?`, 
            index: index,
            showConfirmButton: true,
        });
    };
    const executeDelete = () => { 
         // Implementasi delete ke Firestore harus dilakukan di sini
        setModal({ isOpen: false, type: '', title: '', message: '', user: null });
        fetchData(); // Refresh data
    };


    if (loading) {
        return (
            <div className="p-6 pt-20 text-center text-gray-500 min-h-screen">
                Memuat data kompetensi karyawan dari database...
            </div>
        );
    }

    // --- RENDER TAMPILAN ---
    return (
        <div className="p-6 pt-20 bg-gray-50 min-h-screen"> 
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-7xl mx-auto">
                
                <h2 className="text-3xl font-extrabold mb-2 text-blue-800 border-b pb-2">Kompetensi</h2>
                <p className="mb-6 text-xl font-semibold text-gray-700">{UNIT_TITLE}</p>

                <div className="overflow-x-auto shadow-xl rounded-lg border border-gray-100 mb-12">
                    <table className="min-w-full bg-white table-auto">
                        <thead>
                            <tr className="bg-blue-800 text-white shadow-lg">
                                <th className="border-r border-blue-700 px-3 py-3 w-12 text-sm uppercase">No</th>
                                <th className="border-r border-blue-700 px-3 py-3 w-64 text-sm uppercase">Nama / Posisi</th>
                                <th className="border-r border-blue-700 px-3 py-3 text-sm uppercase">Teknikal</th>
                                <th className="border-r border-blue-700 px-3 py-3 text-sm uppercase">Safety</th>
                                <th className="border-r border-blue-700 px-3 py-3 text-sm uppercase">Legal</th>
                                <th className="border-r border-blue-700 px-3 py-3 text-sm uppercase">Soft Skill</th>
                                <th className="px-3 py-3 w-48 text-sm uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, index) => (
                                <React.Fragment key={row.id}> 
                                    {/* Baris 1: Nama */}
                                    <tr className="border-t border-gray-300 hover:bg-gray-50 transition duration-200">
                                        <td
                                            className="border-r border-b px-3 py-2 text-center bg-gray-50 font-extrabold text-lg text-blue-800"
                                            rowSpan={3}
                                        >
                                            {row.no}
                                        </td>
                                        <td className="border-r border-b px-3 py-3 font-bold text-gray-800 text-base">{row.nama}</td>
                                        <td className="border-b" colSpan={4}></td> 
                                        <td
                                            className="border-b px-3 py-2 text-center bg-gray-50"
                                            rowSpan={3}
                                        >
                                            <div className="flex flex-col gap-2 items-center">
                                                {/* ⭐️ TOMBOL UPDATE POSISI (Hanya muncul jika ada target promosi) */}
                                                <button
                                                    onClick={() => handleFinalUpdateClick(row)}
                                                    className={`flex items-center gap-1 text-white px-3 py-1.5 rounded-full text-xs w-full justify-center font-semibold shadow-md transition transform hover:scale-[1.02] mt-1 
                                                                ${(row.posisiBaru === row.posisiSekarang) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                                                    disabled={(row.posisiBaru === row.posisiSekarang)}
                                                >
                                                    <CheckCircle size={14} /> Update Posisi
                                                </button>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Baris 2: Posisi Sekarang - Kompetensi Sekarang */}
                                    <tr className="border-b border-gray-200 hover:bg-blue-50 transition duration-200 text-sm">
                                        <td className="border-r border-b px-3 py-2 text-xs text-gray-700 bg-blue-100/50 font-medium">
                                            Posisi Sekarang: <span className="font-semibold">{row.posisiSekarang}</span>
                                        </td>
                                        {Object.keys(row.kompetensiSekarang).map((field) => (
                                            <td key={field} 
                                                className={`border-r border-b px-3 py-2 text-center ${row.kompetensiSekarang[field] ? 'bg-green-50/50' : 'bg-red-50/50'}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={row.kompetensiSekarang[field]}
                                                    onChange={() => handleCheckboxChange(index, "kompetensiSekarang", field)}
                                                    className={`form-checkbox h-4 w-4 rounded transition duration-150 ${row.kompetensiSekarang[field] ? 'text-green-600 border-green-600' : 'text-gray-400 border-gray-400'}`}
                                                />
                                            </td>
                                        ))}
                                    </tr>

                                    {/* 3. Baris Posisi Baru - Kompetensi Baru (Assessment) */}
                                    <tr className="border-b-2 border-gray-300 hover:bg-green-100 transition duration-200 text-sm bg-green-50/80">
                                        <td className="border-r border-b px-3 py-2 text-xs text-blue-800 font-bold bg-green-200/70">
                                            Posisi Baru: <span className="font-extrabold">{row.posisiBaru}</span>
                                        </td>
                                        {Object.keys(row.kompetensiBaru).map((field) => (
                                            <td key={field} 
                                                className={`border-r border-b px-3 py-2 text-center ${row.kompetensiBaru[field] ? 'bg-green-100' : 'bg-red-100/50'}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={row.kompetensiBaru[field]}
                                                    onChange={() => handleCheckboxChange(index, "kompetensiBaru", field)}
                                                    className={`form-checkbox h-4 w-4 rounded transition duration-150 ${row.kompetensiBaru[field] ? 'text-green-600 border-green-600' : 'text-gray-400 border-gray-400'}`}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Modal untuk menggantikan alert/confirm bawaan browser */}
            {modal.isOpen && (
                 <CustomModal
                    isOpen={modal.isOpen}
                    onClose={handleCloseModal}
                    title={modal.title}
                    message={modal.message}
                    // Menentukan fungsi onConfirm berdasarkan type modal
                    onConfirm={modal.type === 'final_update' ? executeFinalPositionUpdate : handleCloseModal}
                    showConfirmButton={modal.showConfirmButton}
                />
            )}
        </div>
    );
}