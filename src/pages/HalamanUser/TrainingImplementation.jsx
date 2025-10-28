// src/pages/hr/TrainingImplementation.jsx (Kode Final dengan Tampilan Status Jelas)
import React, { useState, useEffect, useRef } from "react"; 
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; 
import AttendancePDF from "./AttendancePDF"; 
import HRHeader from "../../components/HalamanHR/HRHeader";
import { Download, CheckCircle, FileText, Clock, Calendar, Users, AlertCircle, XCircle, User, Upload, Building, RefreshCw } from 'lucide-react';

const TrainingImplementation = () => {
    const [registrations, setRegistrations] = useState([]); 
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedReg, setSelectedReg] = useState(null); 

    const [comment, setComment] = useState('');
    const fileInputRef = useRef(null); 
    
    // Helper untuk memformat tanggal YYYY-MM-DD
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            // Untuk menghindari bug tanggal pada beberapa browser jika formatnya YYYY-MM-DD
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
        setSelectedReg(null); // Bersihkan panel kanan saat refresh
        setError(null);
        try {
            const q = collection(db, 'trainingapp'); 
            const snapshot = await getDocs(q);
            
            const data = snapshot.docs.map(doc => {
                const docData = doc.data();
                
                const managerApprovalName = docData.approvalManager || 'User Pendaftar';
                const emailPrefix = managerApprovalName.split(' ')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
                
                return { 
                    id: doc.id, 
                    ...docData,
                    noReg: docData.noReg || 'N/A', 
                    area: docData.area || 'N/A',
                    tanggalMulai: docData.tanggalMulai || 'N/A',
                    jamMulai: docData.jamMulai || 'N/A',
                    jamSelesai: docData.jamSelesai || 'N/A',
                    
                    // Data yang disesuaikan untuk Tampilan
                    pengajuName: managerApprovalName, 
                    pengajuEmail: `${emailPrefix}.${docData.noReg?.slice(-4) || '0000'}@company.com`, 
                    unitPendaftar: docData.area || 'N/A',
                };
            });
            
            // Sort: Pending di atas, lalu berdasarkan tanggal terbaru
            const sortedData = data.sort((a, b) => {
                if (a.status === 'Pending' && b.status !== 'Pending') return -1;
                if (a.status !== 'Pending' && b.status === 'Pending') return 1;
                
                // Sort tanggal (terbaru ke lama)
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

    const handleUpdateStatus = async (id, newStatus) => {
        const reg = registrations.find(r => r.id === id);
        if (!reg || reg.status !== 'Pending') return;
        
        if (newStatus === 'Approved' && !window.confirm("Konfirmasi Persetujuan: Anda yakin ingin menyetujui registrasi ini?")) return;
        if (newStatus === 'Rejected' && !window.confirm("Konfirmasi Penolakan: Anda yakin ingin menolak registrasi ini?")) return;

        try {
            const docRef = doc(db, 'trainingapp', id);
            
            await updateDoc(docRef, {
                status: newStatus,
                commentManager: comment, 
                approvedAt: new Date().toISOString(), 
            });
            
            alert(`Status registrasi ${reg.judulTraining} berhasil diubah menjadi ${newStatus}.`);
            setSelectedReg(null); 
            setComment('');
            fetchRequests(); // Panggil ulang untuk mendapatkan data terbaru dan membersihkan UI
        } catch (err) {
            console.error("Error updating status:", err);
            alert('Gagal mengubah status. Cek koneksi Anda.');
        }
    };

    // KOMPONEN UNTUK SATU KARTU DI DAFTAR REGISTRASI
    const RegistrationCard = ({ reg }) => {
        const isPending = reg.status === 'Pending';
        const { classes, icon: StatusIcon } = getStatusStyle(reg.status);
        const isActive = selectedReg && selectedReg.id === reg.id;
        
        // 💡 Menggunakan data yang sudah diproses di fetchRequests
        const pengajuName = reg.pengajuName; 
        const pengajuEmail = reg.pengajuEmail; 
        
        const cardClasses = `p-4 border-l-4 rounded-lg shadow-md mb-3 cursor-pointer transition 
                             ${isPending ? 'border-yellow-500 bg-white hover:shadow-lg' : 'border-green-500 bg-gray-50 hover:bg-gray-100'}
                             ${isActive ? 'ring-2 ring-blue-500 border-blue-600 shadow-xl' : ''}`;

        return (
            <div className={cardClasses} onClick={() => setSelectedReg(reg)}>
                <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-blue-600" />
                        <div>
                            <p className="font-semibold text-gray-800">{pengajuName}</p>
                            <p className="text-xs text-gray-500">{pengajuEmail}</p>
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
                
                {isPending && (
                    <button className="mt-3 w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
                        Review & Approve
                    </button>
                )}
            </div>
        );
    };

    // Fungsi untuk menentukan style status (Kode Tetap)
    const getStatusStyle = (status) => {
        switch (status) {
            case 'Approved': return { classes: 'bg-green-100 text-green-800', icon: CheckCircle };
            case 'Rejected': return { classes: 'bg-red-100 text-red-800', icon: XCircle };
            case 'Pending': default: return { classes: 'bg-yellow-100 text-yellow-800', icon: AlertCircle };
        }
    };

    // Handler untuk input file manager (Masih Placeholder)
    const handleFileSelection = (e) => {
        const file = e.target.files[0];
        if (file) {
            console.log("File dipilih oleh manager:", file.name);
            // Implementasi upload file manager jika diperlukan
        }
    };

    // --- RENDER UTAMA ---
    return (
        <div className="min-h-screen bg-gray-100 p-6 pt-24 flex justify-center">
            <HRHeader /> 

            <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 1. KOLOM KIRI: DAFTAR REGISTRASI */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-2xl">
                    <div className="flex justify-between items-center border-b pb-2 mb-4">
                        <h2 className="text-2xl font-bold text-blue-700">
                            Daftar Registrasi Training ({registrations.length})
                        </h2>
                        {/* 💡 TOMBOL REFRESH */}
                        <button onClick={fetchRequests} disabled={isLoading} className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition" title="Refresh Data">
                            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                    
                    {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg mb-4">{error}</div>}

                    {registrations.length === 0 && !isLoading ? (
                        <div className="p-4 text-center text-gray-500 italic">Tidak ada registrasi yang tercatat.</div>
                    ) : (
                        <div className="space-y-3 max-h-[80vh] overflow-y-auto pr-2">
                            {isLoading ? <p className="p-4 text-center text-blue-500">Memuat data...</p> : 
                              registrations.map(reg => (
                                <RegistrationCard key={reg.id} reg={reg} />
                            ))}
                        </div>
                    )}
                </div>

                {/* 2. KOLOM KANAN: PANEL APPROVAL */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-2xl sticky top-24 h-fit">
                    <h2 className="text-xl font-bold text-blue-700 mb-4 border-b pb-2">Panel Approval</h2>
                    
                    {selectedReg ? (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-800 text-lg">Detail Registrasi</h3>
                            <div className="text-sm space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <p><strong>Nama Pengaju:</strong> {selectedReg.pengajuName || 'N/A'}</p>
                                <p><strong>Training:</strong> {selectedReg.judulTraining}</p>
                                <p><strong>Tanggal:</strong> {formatDate(selectedReg.tanggalMulai)}</p>
                                <p><strong>Unit:</strong> {selectedReg.unitPendaftar || 'N/A'}</p>
                                <p><strong>Kelas:</strong> {selectedReg.kelasTraining || 'N/A'}</p>
                                <p><strong>File Materi:</strong> {selectedReg.materiFileName ? <a href={selectedReg.materiURL} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedReg.materiFileName}</a> : 'Tidak Ada'}</p>
                            </div>

                            {/* Tampilan Kondisional untuk Aksi */}
                            {selectedReg.status === 'Pending' && (
                                <>
                                    <div className="text-sm text-gray-700 pt-2 border-t">
                                        <p className="font-semibold mb-2">Komentar Approval</p>
                                        <textarea
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder="Berikan komentar atau catatan untuk keputusan ini..."
                                            rows="3"
                                            className="w-full p-2 border rounded-lg focus:ring-blue-500"
                                        ></textarea>
                                    </div>
    
                                    <div className="text-sm text-gray-700">
                                        <p className="font-semibold mb-2">Lampiran Tambahan</p>
                                        <input
                                            type="file"
                                            id="managerFile"
                                            onChange={handleFileSelection}
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                            className="hidden"
                                        />
                                        <div 
                                            className="border-2 border-dashed border-gray-300 p-4 text-center rounded-lg cursor-pointer hover:border-blue-500"
                                            onClick={() => document.getElementById('managerFile').click()} 
                                        >
                                            <Upload className="w-5 h-5 mx-auto text-gray-500" />
                                            Klik untuk upload file (PDF, DOC, JPG)
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3 pt-3 border-t">
                                        <button
                                            onClick={() => handleUpdateStatus(selectedReg.id, 'Approved')}
                                            className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-md transition"
                                        >
                                            ✅ Setujui Registrasi
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStatus(selectedReg.id, 'Rejected')}
                                            className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-md transition"
                                        >
                                            ❌ Tolak Registrasi
                                        </button>
                                        <button
                                            onClick={() => setSelectedReg(null)}
                                            className="w-full py-2 text-gray-600 rounded-lg hover:bg-gray-100 transition"
                                        >
                                            Batal
                                        </button>
                                    </div>
                                </>
                            )}
                            
                            {(selectedReg.status === 'Approved' || selectedReg.status === 'Rejected') && (
                                <div className="p-4 rounded-lg bg-gray-50 border">
                                    <p className="font-semibold text-gray-700">Status Aksi:</p>
                                    
                                    <p className={`font-bold mt-1 ${selectedReg.status === 'Approved' ? 'text-green-600' : 'text-red-600'}`}>
                                        {selectedReg.status === 'Approved' ? 
                                            <>✅ Disetujui pada {formatDate(selectedReg.approvedAt)}</> : 
                                            <>❌ Ditolak</> 
                                        }
                                    </p>
                                    
                                    {selectedReg.commentManager && <p className="text-sm mt-2 italic border-t pt-2">"{selectedReg.commentManager}"</p>}
                                    
                                    {selectedReg.status === 'Approved' && (
                                        <div className="mt-3 pt-3 border-t">
                                            <AttendancePDF 
                                                participantsData={selectedReg.participants} 
                                                trainingTitle={selectedReg.judulTraining}
                                                registrationData={selectedReg} 
                                            />
                                            {selectedReg.materiFileName && (
                                                <a href={selectedReg.materiURL} target="_blank" rel="noopener noreferrer" className="mt-2 text-blue-600 hover:underline text-sm block">
                                                    <Download className="w-4 h-4 inline-block mr-1"/> Download Materi Tambahan
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    <button onClick={() => setSelectedReg(null)} className="mt-3 w-full py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Tutup Review</button>
                                </div>
                            )}

                        </div>
                    ) : (
                        <div className="p-6 text-center text-gray-500 bg-blue-50 rounded-lg">
                            Pilih registrasi dari daftar di samping untuk memulai review.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrainingImplementation;