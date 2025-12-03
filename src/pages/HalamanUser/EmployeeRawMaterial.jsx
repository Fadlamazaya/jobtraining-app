import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle } from 'lucide-react'; 
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

// --- Komponen Modal Kustom ---
const CustomModal = ({ isOpen, onClose, title, message, onConfirm, showConfirmButton }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
            <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-sm transform transition-all">
                {/* Warna judul modal disesuaikan (Amber/Kuning Kecoklatan) */}
                <h3 className={`text-xl font-bold mb-3 ${showConfirmButton ? 'text-red-600' : 'text-amber-700'}`}>{title}</h3>
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
                            // Warna tombol konfirmasi disesuaikan (Amber/Kuning Kecoklatan)
                            className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition"
                        >
                            Yakin Update
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function EmployeeRawMaterial() { 
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
    
    // ⭐️ KONFIGURASI UNTUK RAW MATERIAL ⭐️
    const AREA_KERJA = "Raw Material Plant"; // Mengikuti format "X Plant" dari halaman sebelumnya
    const UNIT_TITLE = "Unit 4: Bahan Baku / Raw Material Plant"; // Menyesuaikan judul

    const fetchData = useCallback(async () => {
        setLoading(true);

        try {
            const usersQuery = query(
                collection(db, "users"),
                where("areaKerja", "==", AREA_KERJA)
            );

            const snapshot = await getDocs(usersQuery);
            const employees = snapshot.docs.map((docSnap, index) => {
                const docData = docSnap.data();

                const kompetensiSekarang = docData.kompetensiSekarang || { teknikal: false, safety: false, legal: false, softSkill: false };
                const kompetensiBaru = docData.kompetensiBaru || { teknikal: false, safety: false, legal: false, softSkill: false };

                const isPromosiTertunda =
                    docData.nextPosition &&
                    docData.nextPosition !== docData.position &&
                    docData.nextPosition !== "T/A" &&
                    docData.nextPosition !== "-";

                const posisiBaru = isPromosiTertunda ? docData.nextPosition : "-";

                return {
                    no: index + 1,
                    id: docSnap.id,
                    nama: docData.name,
                    posisiSekarang: docData.position || "-",
                    posisiBaru,
                    kompetensiSekarang,
                    kompetensiBaru,
                };
            });

            setData(employees);

        } catch (err) {
            console.error("Error fetching data:", err);
        }

        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);


    const handleCheckboxChange = async (index, tipe, field) => {
        const updatedData = [...data];
        const userToUpdate = updatedData[index];
        const currentStatus = userToUpdate[tipe][field];
        
        updatedData[index][tipe][field] = !currentStatus;
        setData(updatedData);

        try {
            const userDocRef = doc(db, "users", userToUpdate.id);
            await updateDoc(userDocRef, {
                [tipe]: updatedData[index][tipe],
            });

        } catch (error) {
            console.error("Error saving checkbox state:", error);
            updatedData[index][tipe][field] = currentStatus;
            setData(updatedData);
            setModal({
                isOpen: true,
                title: 'Gagal Menyimpan',
                message: `Gagal memperbarui status ${field} untuk ${userToUpdate.nama} di database.`,
                showConfirmButton: false,
                user: null,
            });
        }
    };


    const executeFinalPositionUpdate = async () => {
        const userToUpdate = modal.user; // Menggunakan modal.user
        const targetPosition = userToUpdate.posisiBaru;

        if (targetPosition === "-") {
            setModal({ isOpen: false, type: "", title: "", message: "", user: null });
            return;
        }

        try {
            const userDocRef = doc(db, "users", userToUpdate.id);

            const kompetensiFinal = userToUpdate.kompetensiBaru;
            const resetKompetensi = { teknikal: false, safety: false, legal: false, softSkill: false };

            await updateDoc(userDocRef, {
                position: targetPosition,
                nextPosition: "-",
                kompetensiSekarang: kompetensiFinal, // pindah kompetensi baru ke kompetensi sekarang
                kompetensiBaru: resetKompetensi,     // reset kompetensi baru ke false
            });

            setModal({ isOpen: false, type: "", title: "", message: "", user: null });
            fetchData();

        } catch (error) {
            console.error("Error updating position:", error);
            setModal({
                isOpen: true,
                title: "Gagal Promosi",
                message: `Gagal memperbarui posisi: ${error.message}`,
                showConfirmButton: false,
                user: null,
            });
        }
    };


    const handleFinalUpdateClick = (user) => {
        const isUpdatable = user.posisiBaru !== "-";

        if (!isUpdatable) {
            setModal({
                isOpen: true,
                title: "Aksi Tidak Dapat Dilakukan",
                message: `${user.nama} tidak memiliki target promosi.`,
                showConfirmButton: false,
                user: null,
            });
            return;
        }

        setModal({
            isOpen: true,
            type: "final_update",
            title: "Konfirmasi Promosi Final",
            message: `Yakin mempromosikan ${user.nama} dari ${user.posisiSekarang} ke ${user.posisiBaru}? Ini akan memindahkan kompetensi & reset target promosi.`,
            user,
            showConfirmButton: true,
        });
    };

    const handleCloseModal = () => {
        setModal({ isOpen: false, type: '', title: '', message: '', user: null });
    };

    if (loading) return (
        <div className="p-6 pt-20 text-center text-gray-500 min-h-screen">
            Memuat data kompetensi karyawan...
        </div>
    );

    return (
        <div className="p-6 pt-20 bg-gray-50 min-h-screen">
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-7xl mx-auto">
                
                {/* Warna judul disesuaikan (Amber) */}
                <h2 className="text-3xl font-extrabold mb-2 text-amber-800 border-b pb-2">Kompetensi</h2>
                <p className="mb-6 text-xl font-semibold text-gray-700">{UNIT_TITLE}</p>

                <div className="overflow-x-auto shadow-xl rounded-lg border border-gray-100 mb-12">
                    <table className="min-w-full bg-white table-auto">
                        <thead>
                            {/* Warna header disesuaikan (Amber) */}
                            <tr className="bg-amber-800 text-white shadow-lg text-sm uppercase">
                                <th className="border-r border-amber-700 px-3 py-3 w-12">No</th>
                                <th className="border-r border-amber-700 px-3 py-3 w-64">Nama / Posisi</th>
                                <th className="border-r border-amber-700 px-3 py-3">Teknikal</th>
                                <th className="border-r border-amber-700 px-3 py-3">Safety</th>
                                <th className="border-r border-amber-700 px-3 py-3">Legal</th>
                                <th className="border-r border-amber-700 px-3 py-3">Soft Skill</th>
                                <th className="px-3 py-3 w-48">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, index) => {
                                const isUpdatable = row.posisiBaru !== "-";
                                const isTargetSet = row.posisiBaru !== "-";
                                
                                // Warna latar baris target disesuaikan (Orange/Amber)
                                const row3Class = `border-b-2 border-gray-300 hover:bg-orange-100 transition duration-200 text-sm ${isTargetSet ? 'bg-orange-50/80' : 'bg-white'}`;
                                // Warna latar posisi baru disesuaikan
                                const tdPosisiBaruClass = isTargetSet ? 'bg-amber-200/70 text-amber-800' : 'bg-gray-100';

                                const getKompetensiSekarangClass = (field) => {
                                    // Warna latar kompetensi sekarang disesuaikan (Kuning)
                                    return `border-r border-b px-3 py-2 text-center ${row.kompetensiSekarang[field] ? 'bg-yellow-50/50' : 'bg-red-50/50'}`;
                                };

                                const getKompetensiBaruClass = (field) => {
                                    let baseClass = 'border-r border-b px-3 py-2 text-center';
                                    if (!isTargetSet) return `${baseClass} bg-white`;
                                    // Warna latar kompetensi baru disesuaikan (Kuning)
                                    return `${baseClass} ${row.kompetensiBaru[field] ? 'bg-yellow-100' : 'bg-red-100/50'}`;
                                };

                                return (
                                    <React.Fragment key={row.id}>
                                        <tr className="border-t border-gray-300 hover:bg-gray-50 transition duration-200">
                                            {/* Warna no. disesuaikan (Amber) */}
                                            <td className="border-r border-b px-3 py-2 text-center bg-gray-50 font-extrabold text-lg text-amber-800" rowSpan={3}>
                                                {row.no}
                                            </td>
                                            <td className="border-r border-b px-3 py-3 font-bold text-gray-800">{row.nama}</td>
                                            <td className="border-b" colSpan={4}></td>
                                            <td className="border-b px-3 py-2 text-center bg-gray-50" rowSpan={3}>
                                                <button
                                                    onClick={() => handleFinalUpdateClick(row)}
                                                    disabled={!isUpdatable}
                                                    // Warna tombol disesuaikan (Amber)
                                                    className={`flex items-center gap-1 text-white px-3 py-1.5 rounded-full text-xs w-full justify-center font-semibold shadow-md transition transform mt-1
                                                        ${isUpdatable 
                                                            ? "bg-amber-600 hover:bg-amber-700 hover:scale-[1.02]" 
                                                            : "bg-gray-400 cursor-not-allowed"
                                                        }`}
                                                >
                                                    <CheckCircle size={14} /> Update Posisi
                                                </button>
                                            </td>
                                        </tr>

                                        <tr className="border-b border-gray-200 hover:bg-amber-50 transition duration-200 text-sm">
                                            {/* Warna latar kolom posisi sekarang disesuaikan (Amber) */}
                                            <td className="border-r border-b px-3 py-2 text-xs text-gray-700 bg-amber-100/50 font-medium">
                                                Posisi Sekarang: <span className="font-semibold">{row.posisiSekarang}</span>
                                            </td>
                                            {Object.keys(row.kompetensiSekarang).map((field) => (
                                                <td key={field} className={getKompetensiSekarangClass(field)}>
                                                    <input
                                                        type="checkbox"
                                                        checked={row.kompetensiSekarang[field]}
                                                        onChange={() => handleCheckboxChange(index, "kompetensiSekarang", field)}
                                                        // Warna checkbox disesuaikan (Kuning)
                                                        className="h-4 w-4 rounded text-yellow-600 border-gray-400 cursor-pointer"
                                                    />
                                                </td>
                                            ))}
                                        </tr>

                                        <tr className={row3Class}>
                                            <td className={`border-r border-b px-3 py-2 text-xs font-bold ${tdPosisiBaruClass}`}>
                                                Posisi Baru: <span className="font-extrabold">{row.posisiBaru}</span>
                                            </td>
                                            {Object.keys(row.kompetensiBaru).map((field) => (
                                                <td key={field} className={getKompetensiBaruClass(field)}>
                                                    <input
                                                        type="checkbox"
                                                        checked={row.kompetensiBaru[field]}
                                                        onChange={() => handleCheckboxChange(index, "kompetensiBaru", field)}
                                                        disabled={!isTargetSet}
                                                        // Warna checkbox disesuaikan (Kuning)
                                                        className="h-4 w-4 rounded text-yellow-600 border-gray-400 cursor-pointer disabled:cursor-not-allowed"
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {modal.isOpen && (
                <CustomModal
                    isOpen={modal.isOpen}
                    onClose={handleCloseModal}
                    title={modal.title}
                    message={modal.message}
                    onConfirm={modal.type === "final_update" ? executeFinalPositionUpdate : handleCloseModal}
                    showConfirmButton={modal.showConfirmButton}
                />
            )}
        </div>
    );
}