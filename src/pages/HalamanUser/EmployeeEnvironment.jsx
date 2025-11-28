import React, { useState, useEffect } from "react";
import { Trash2, Edit, Send } from 'lucide-react'; 

// --- Komponen Modal Kustom (Sama seperti di EmployeeWater) ---
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
                            Yakin Hapus
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- Komponen Utama EmployeeEnvironment ---
export default function EmployeeEnvironment() {
    // ⭐️ PENYESUAIAN KEY & JUDUL UNTUK ENVIRONMENT PROTECTION PLANT
    const LOCAL_STORAGE_KEY = "kompetensiEnvironmentProtectionPlant";
    const UNIT_TITLE = "Unit 3: Environment Protection Plant";

    const defaultData = [];

    const [data, setData] = useState(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        return saved ? JSON.parse(saved) : defaultData;
    });

    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    }, [data]);

    const [modal, setModal] = useState({
        isOpen: false,
        type: '', 
        title: '',
        message: '',
        index: null,
    });
    
    const [editIndex, setEditIndex] = useState(null);
    const [form, setForm] = useState({ nama: "", posisiSekarang: "", posisiBaru: "" });

    // --- FUNGSI LOGIKA (Tetap sama) ---

    const handleCheckboxChange = (index, tipe, field) => {
        const newData = [...data];
        newData[index][tipe][field] = !newData[index][tipe][field];
        setData(newData);
    };

    const handleConfirmDelete = (index) => {
        setModal({
            isOpen: true,
            type: 'delete',
            title: 'Konfirmasi Penghapusan',
            message: `Apakah Anda yakin ingin menghapus data peserta ${data[index].nama}?`, 
            index: index,
        });
    };

    const executeDelete = () => {
        const indexToDelete = modal.index;
        if (indexToDelete !== null) {
            const newData = data.filter((_, i) => i !== indexToDelete);
            const reIndexedData = newData.map((item, i) => ({ ...item, no: i + 1 }));
            setData(reIndexedData);
            
            if (editIndex === indexToDelete) {
                setEditIndex(null);
                setForm({ nama: "", posisiSekarang: "", posisiBaru: "" });
            }
        }
        setModal({ isOpen: false, type: '', title: '', message: '', index: null });
    };

    const handleSendNotification = (nama) => {
        setModal({
            isOpen: true,
            type: 'notify',
            title: 'Notifikasi Terkirim',
            message: `Notifikasi telah berhasil dikirimkan kepada ${nama}.`, 
            index: null,
        });
    };

    const handleEdit = (index) => {
        setEditIndex(index);
        setModal({
            isOpen: true,
            type: 'form',
            title: 'Edit Data Peserta (Fitur Dinonaktifkan)',
            message: 'Fitur Edit dinonaktifkan di tampilan ini. Silakan buat form terpisah jika diperlukan.',
            index: index,
        });
    };

    const handleCloseModal = () => {
        setModal({ isOpen: false, type: '', title: '', message: '', index: null });
        if (modal.type === 'form') {
            setEditIndex(null);
            setForm({ nama: "", posisiSekarang: "", posisiBaru: "" });
        }
    };

    // --- RENDER TAMPILAN (Sama) ---
    return (
        <div className="p-6 pt-20 bg-gray-50 min-h-screen"> 
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-7xl mx-auto">
                
                <h2 className="text-3xl font-extrabold mb-2 text-blue-800 border-b pb-2">Kompetensi Unit</h2>
                <p className="mb-6 text-xl font-semibold text-gray-700">{UNIT_TITLE}</p>

                {/* Tabel data dengan styling cantik */}
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
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-8 text-gray-500 font-medium">
                                        Belum ada data peserta untuk Environment Protection Plant. Silakan tambahkan.
                                    </td>
                                </tr>
                            ) : (
                                data.map((row, index) => (
                                    <React.Fragment key={row.no}> 
                                        {/* Baris data... (Sama seperti unit lain) */}
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
                                                    <button
                                                        onClick={() => handleSendNotification(row.nama)}
                                                        className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-full hover:bg-green-700 text-xs w-full justify-center font-semibold shadow-md transition transform hover:scale-[1.02]"
                                                    >
                                                        <Send size={14} /> Notifikasi
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(index)}
                                                        className="flex items-center gap-1 bg-yellow-500 text-white px-3 py-1.5 rounded-full hover:bg-yellow-600 text-xs w-full justify-center font-semibold shadow-md transition transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                                                        disabled 
                                                    >
                                                        <Edit size={14} /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleConfirmDelete(index)}
                                                        className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded-full hover:bg-red-700 text-xs w-full justify-center font-semibold shadow-md transition transform hover:scale-[1.02]"
                                                    >
                                                        <Trash2 size={14} /> Hapus
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
                                                        onChange={() =>
                                                            handleCheckboxChange(
                                                                index, "kompetensiSekarang", field
                                                            )
                                                        }
                                                        className={`form-checkbox h-4 w-4 rounded transition duration-150 ${row.kompetensiSekarang[field] ? 'text-green-600 border-green-600' : 'text-gray-400 border-gray-400'}`}
                                                    />
                                                </td>
                                            ))}
                                        </tr>

                                        {/* 3. Baris Posisi Baru - Kompetensi Baru (Diberi highlight hijau) */}
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
                                                        onChange={() =>
                                                            handleCheckboxChange(index, "kompetensiBaru", field)
                                                        }
                                                        className={`form-checkbox h-4 w-4 rounded transition duration-150 ${row.kompetensiBaru[field] ? 'text-green-600 border-green-600' : 'text-gray-400 border-gray-400'}`}
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Modal untuk menggantikan alert/confirm bawaan browser */}
            <CustomModal
                isOpen={modal.isOpen}
                onClose={handleCloseModal}
                title={modal.title}
                message={modal.message}
                onConfirm={modal.type === 'delete' ? executeDelete : handleCloseModal}
                showConfirmButton={modal.type === 'delete'}
            />
        </div>
    );
}