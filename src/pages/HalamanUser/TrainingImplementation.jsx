// src/pages/hr/TrainingImplementation.jsx (Kode Final dengan Logika Persetujuan HR)
import React, { useState, useEffect, useRef } from "react";
import { collection, query, where, getDocs, updateDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import AttendancePDF from "./AttendancePDF";
import HRHeader from "../../components/HalamanHR/HRHeader";
import { Download, CheckCircle, FileText, Clock, Calendar, Users, AlertCircle, XCircle, User, Upload, Building, RefreshCw } from 'lucide-react';

const NOTIFICATIONS_COLLECTION = 'notifications';

const TrainingImplementation = () => {
    const [registrations, setRegistrations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedReg, setSelectedReg] = useState(null);

    // Perubahan nama state agar tidak bentrok dengan field dokumen (misalnya: hrComment)
    const [hrComment, setHrComment] = useState('');
    const fileInputRef = useRef(null);

    // Helper untuk memformat tanggal YYYY-MM-DD
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            const parts = dateString.split('-');
            const newDate = new Date(parts[0], parts[1] - 1, parts[2]);
            if (isNaN(newDate)) return dateString;
            return newDate.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' });
        } catch (e) {
            return dateString;
        }
    };

    const fetchRequests = async () => {
        setIsLoading(true);
        setSelectedReg(null);
        setError(null);
        try {
            const collectionRef = collection(db, 'trainingapp');

            // 💡 FILTER KRITIS: Hanya ambil data yang sudah di-APPROVED oleh Manager (status === 'approved')
            // Kita juga ambil status final agar bisa ditampilkan: 'Implemented' dan 'HR Rejected'
            const q = query(collectionRef, where('status', 'in', ['approved', 'Implemented', 'HR Rejected']));

            const snapshot = await getDocs(q);

            const data = snapshot.docs.map(doc => {
                const docData = doc.data();

                const managerApprovalName = docData.approvalManager || 'User Pendaftar';
                const emailPrefix = managerApprovalName.split(' ')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';

                // Menganalisis status: 'approved' adalah menunggu HR (Implementation)
                let displayStatus = docData.status;
                if (docData.status === 'approved') {
                    displayStatus = 'Siap Implementasi (Manager Approved)';
                } else if (docData.status === 'Implemented') {
                    displayStatus = 'Selesai/Implementasi';
                } else if (docData.status === 'HR Rejected') {
                    displayStatus = 'Ditolak Final (HR)';
                }

                return {
                    id: doc.id,
                    ...docData,
                    noReg: docData.noReg || 'N/A',
                    area: docData.area || 'N/A',
                    tanggalMulai: docData.tanggalMulai || 'N/A',
                    jamMulai: docData.jamMulai || 'N/A',
                    jamSelesai: docData.jamSelesai || 'N/A',

                    pengajuName: managerApprovalName,
                    pengajuEmail: `${emailPrefix}.${docData.noReg?.slice(-4) || '0000'}@company.com`,
                    unitPendaftar: docData.area || 'N/A',

                    // Field status dari DB yang sudah diolah
                    status: displayStatus,
                    commentManager: docData.reviewNote, // Komentar dari Manager
                    hrComment: docData.hrComment, // Komentar dari HR (jika ada)
                };
            });

            // Sort: Siap Implementasi di atas
            const sortedData = data.sort((a, b) => {
                if (a.status === 'Siap Implementasi (Manager Approved)' && b.status !== 'Siap Implementasi (Manager Approved)') return -1;
                if (a.status !== 'Siap Implementasi (Manager Approved)' && b.status === 'Siap Implementasi (Manager Approved)') return 1;

                const dateA = a.tanggalMulai !== 'N/A' ? new Date(a.tanggalMulai) : 0;
                const dateB = b.tanggalMulai !== 'N/A' ? new Date(b.tanggalMulai) : 0;
                return dateB - dateA;
            });

            setRegistrations(sortedData);

        } catch (err) {
            console.error("Error fetching requests:", err);
            setError("Gagal memuat data registrasi. Cek konsol browser.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    // 💡 FUNGSI FINAL APPROVAL/IMPLEMENTASI (Update ke DB Utama)
    const handleUpdateStatus = async (id, finalStatus) => {
        // Hanya izinkan aksi jika status saat ini adalah 'Siap Implementasi (Manager Approved)'
        const reg = registrations.find(r => r.id === id);
        if (!reg || reg.status !== 'Siap Implementasi (Manager Approved)') return;

        const statusKey = finalStatus === 'Implemented' ? 'Implemented' : 'HR Rejected';

        if (finalStatus === 'Implemented' && !window.confirm("Konfirmasi Implementasi: Anda yakin semua persiapan training telah Selesai?")) return;
        if (finalStatus === 'HR Rejected' && !window.confirm("Konfirmasi Penolakan: Anda yakin ingin menolak implementasi training ini?")) return;

        try {
            const docRef = doc(db, 'trainingapp', id);

            await updateDoc(docRef, {
                status: statusKey,
                hrComment: hrComment, // Menggunakan state hrComment yang baru
                finalizedAt: new Date().toISOString(),
            });

            // LANGKAH 2: BUAT/UPDATE NOTIFIKASI KHUSUS HR REJECTED
            if (statusKey === 'HR Rejected') {
                const notificationDocRef = doc(db, NOTIFICATIONS_COLLECTION, id);
                await setDoc(notificationDocRef, {
                    noReg: id,
                    type: 'HR Finalisasi', // Tipe baru untuk KonfirmasiPage
                    read: false,
                    createdAt: new Date(),
                    payload: {
                        judul: reg.judulTraining,
                        area: reg.area,
                        statusKonfirmasi: 'HR Rejected', // Status yang akan dilihat oleh KonfirmasiPage
                        komentarHR: hrComment,
                    }
                });
            }

            alert(`Status registrasi ${reg.judulTraining} berhasil diubah menjadi ${statusKey}.`);
            setSelectedReg(null);
            setHrComment('');
            fetchRequests();
        } catch (err) {
            console.error("Error updating status:", err);
            alert('Gagal mengubah status. Cek koneksi Anda.');
        }
    };

    // KOMPONEN UNTUK SATU KARTU DI DAFTAR REGISTRASI
    const RegistrationCard = ({ reg }) => {
        const isPendingHR = reg.status === 'Siap Implementasi (Manager Approved)';
        const isFinalized = reg.status === 'Selesai/Implementasi' || reg.status === 'Ditolak Final (HR)';

        const { classes, icon: StatusIcon } = getStatusStyle(reg.status);
        const isActive = selectedReg && selectedReg.id === reg.id;

        const cardClasses = `p-4 border-l-4 rounded-lg shadow-md mb-3 cursor-pointer transition 
                             ${isPendingHR ? 'border-orange-500 bg-white hover:shadow-lg' : isFinalized ? 'border-green-700 bg-gray-100 hover:bg-gray-200' : 'border-red-500 bg-white'}
                             ${isActive ? 'ring-2 ring-blue-500 border-blue-600 shadow-xl' : ''}`;

        return (
            <div className={cardClasses} onClick={() => setSelectedReg(reg)}>
                <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-blue-600" />
                        <div>
                            <p className="font-semibold text-gray-800">{reg.pengajuName}</p>
                            <p className="text-xs text-gray-500">{reg.pengajuEmail}</p>
                        </div>
                    </div>
                    <div className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center ${classes}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {reg.status}
                    </div>
                </div>

                {/* Detail ringkasan */}
                <div className="mt-3 text-sm text-gray-600 space-y-1">
                    <p className="flex items-center"><Calendar className="w-4 h-4 mr-2" />Tanggal: {formatDate(reg.tanggalMulai)}</p>
                    <p className="flex items-center"><Clock className="w-4 h-4 mr-2" />Waktu: {reg.jamMulai} - {reg.jamSelesai}</p>
                    <p className="flex items-center text-sm font-medium">{reg.judulTraining}</p>
                </div>

                {isPendingHR && (
                    <button className="mt-3 w-full py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition">
                        Tindak Lanjut & Finalisasi
                    </button>
                )}
            </div>
        );
    };

    // Fungsi untuk menentukan style status (Diperbarui untuk HR Status)
    const getStatusStyle = (status) => {
        switch (status) {
            case 'Implemented':
            case 'Selesai/Implementasi': return { classes: 'bg-green-100 text-green-700', icon: CheckCircle };
            case 'HR Rejected':
            case 'Ditolak Final (HR)': return { classes: 'bg-red-100 text-red-700', icon: XCircle };
            case 'approved':
            case 'Siap Implementasi (Manager Approved)': default: return { classes: 'bg-orange-100 text-orange-700', icon: AlertCircle };
        }
    };

    // Handler untuk input file manager (Masih Placeholder)
    const handleFileSelection = (e) => {
        const file = e.target.files[0];
        if (file) {
            console.log("File dipilih oleh HR:", file.name);
            // Implementasi upload file HR jika diperlukan
        }
    };

    // --- RENDER UTAMA ---
    return (
        <div className="min-h-screen bg-gray-100 p-6 pt-24 flex justify-center">
            <HRHeader />

            {/* Kontainer Utama Dua Kolom */}
            <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* 1. KOLOM KIRI: DAFTAR REGISTRASI */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-2xl">
                    <div className="flex justify-between items-center border-b pb-2 mb-4">
                        <h2 className="text-2xl font-bold text-blue-700">
                            Daftar Training untuk Implementasi ({registrations.length})
                        </h2>
                        {/* 💡 TOMBOL REFRESH */}
                        <button onClick={fetchRequests} disabled={isLoading} className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition" title="Refresh Data">
                            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg mb-4">{error}</div>}

                    {registrations.length === 0 && !isLoading ? (
                        <div className="p-4 text-center text-gray-500 italic">Tidak ada registrasi yang menunggu persetujuan HR/Implementasi.</div>
                    ) : (
                        <div className="space-y-3 max-h-[80vh] overflow-y-auto pr-2">
                            {isLoading ? <p className="p-4 text-center text-blue-500">Memuat data...</p> :
                                registrations.map(reg => (
                                    <RegistrationCard key={reg.id} reg={reg} />
                                ))}
                        </div>
                    )}
                </div>

                {/* 2. KOLOM KANAN: PANEL FINAL APPROVAL/IMPLEMENTASI */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-2xl sticky top-24 h-fit">
                    <h2 className="text-xl font-bold text-blue-700 mb-4 border-b pb-2">Panel Implementasi (HR)</h2>

                    {selectedReg ? (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-800 text-lg">Detail Registrasi</h3>
                            <div className="text-sm space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <p><strong>Nama Pengaju:</strong> {selectedReg.pengajuName || 'N/A'}</p>
                                <p><strong>Training:</strong> {selectedReg.judulTraining}</p>
                                <p><strong>Tanggal:</strong> {formatDate(selectedReg.tanggalMulai)}</p>
                                <p><strong>Unit Manager:</strong> {selectedReg.unitPendaftar || 'N/A'}</p>
                                <p><strong>Kelas:</strong> {selectedReg.kelasTraining || 'N/A'}</p>
                                <p><strong>File Materi:</strong> {selectedReg.materiFileName ? <a href={selectedReg.materiURL} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedReg.materiFileName}</a> : 'Tidak Ada'}</p>
                                {/* 💡 Tampilkan Komentar Manager */}
                                {selectedReg.commentManager && <p className="mt-2 pt-2 border-t"><strong>Komentar Manager:</strong> <em>"{selectedReg.commentManager}"</em></p>}
                            </div>

                            {/* Tampilan Kondisional untuk Aksi HR */}
                            {selectedReg.status === 'Siap Implementasi (Manager Approved)' ? (
                                <>
                                    <div className="text-sm text-gray-700 pt-2 border-t">
                                        <p className="font-semibold mb-2">Catatan Finalisasi/Penolakan HR</p>
                                        <textarea
                                            value={hrComment} // Menggunakan hrComment
                                            onChange={(e) => setHrComment(e.target.value)}
                                            placeholder="Komentar akhir atau alasan penolakan..."
                                            rows="3"
                                            className="w-full p-2 border rounded-lg focus:ring-blue-500"
                                        ></textarea>
                                    </div>

                                    <div className="space-y-3 pt-3 border-t">
                                        <button
                                            onClick={() => handleUpdateStatus(selectedReg.id, 'Implemented')}
                                            className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-md transition"
                                        >
                                            ✅ Finalisasi & Implementasi
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStatus(selectedReg.id, 'HR Rejected')}
                                            className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-md transition"
                                        >
                                            ❌ Tolak Final (Gagal Implementasi)
                                        </button>
                                        <button
                                            onClick={() => setSelectedReg(null)}
                                            className="w-full py-2 text-gray-600 rounded-lg hover:bg-gray-100 transition"
                                        >
                                            Batal
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="p-4 rounded-lg bg-gray-50 border">
                                    <p className="font-semibold text-gray-700">Status Akhir:</p>
                                    <p className={`font-bold mt-1 ${selectedReg.status === 'Selesai/Implementasi' ? 'text-green-600' : 'text-red-600'}`}>
                                        {selectedReg.status}
                                    </p>
                                    {selectedReg.commentManager && <p className="text-xs mt-2 italic">Komen Manager: "{selectedReg.commentManager}"</p>}
                                    {selectedReg.hrComment && <p className="text-sm mt-2 italic border-t pt-2">Komen HR: "{selectedReg.hrComment}"</p>}

                                    {/* START INTEGRASI ATTENDANCE PDF */}
                                    {selectedReg.status === 'Selesai/Implementasi' && (
                                        <div className="mt-3 pt-3 border-t">
                                            <AttendancePDF
                                                participantsData={selectedReg.participants}
                                                trainingTitle={selectedReg.judulTraining}
                                                registrationData={selectedReg}
                                            />
                                        </div>
                                    )}
                                    {/* END INTEGRASI ATTENDANCE PDF */}

                                    <button onClick={() => setSelectedReg(null)} className="mt-3 w-full py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Tutup Review</button>
                                </div>
                            )}

                        </div>
                    ) : (
                        <div className="p-6 text-center text-gray-500 bg-blue-50 rounded-lg">
                            Pilih registrasi yang sudah disetujui Manager untuk finalisasi.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrainingImplementation;