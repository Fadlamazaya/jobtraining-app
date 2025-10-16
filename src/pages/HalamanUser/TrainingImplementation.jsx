// src/pages/hr/TrainingImplementation.jsx (Perbaikan Final)
import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; 
import AttendancePDF from "./AttendancePDF"; 
import HRHeader from "../../components/HalamanHR/HRHeader";
import { Download, CheckCircle, FileText } from 'lucide-react';

const TrainingImplementation = () => {
    // State untuk menampung request yang menunggu approval
    const [pendingRequests, setPendingRequests] = useState([]);
    // State untuk menampung request yang sudah di-approve
    const [approvedRequests, setApprovedRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fungsi untuk mengambil data dari Firestore
    const fetchRequests = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const q = collection(db, 'trainingapp'); // Menggunakan nama koleksi yang benar
            
            // Query untuk Pending Requests
            const pendingQuery = query(q, where('status', '==', 'Pending'));
            const pendingSnapshot = await getDocs(pendingQuery);
            const pendingData = pendingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Query untuk Approved Requests
            const approvedQuery = query(q, where('status', '==', 'Approved'));
            const approvedSnapshot = await getDocs(approvedQuery);
            
            // Perbaikan Pemetaan Data: Mengganti nilai string kosong/null menjadi N/A
            const approvedData = approvedSnapshot.docs.map(doc => {
                const data = doc.data();
                return { 
                    id: doc.id, 
                    ...data,
                    // Pastikan field string penting tidak pernah null/kosong saat diproses
                    noReg: data.noReg || 'N/A', 
                    area: data.area || 'N/A',
                    tanggalMulai: data.tanggalMulai || 'N/A',
                    tanggalSelesai: data.tanggalSelesai || 'N/A',
                    jamMulai: data.jamMulai || 'N/A',
                    jamSelesai: data.jamSelesai || 'N/A',
                    namaInstruktur: data.namaInstruktur || 'N/A',
                    participants: data.participants || [],
                    totalHari: data.totalHari || 0
                };
            });

            setPendingRequests(pendingData);
            setApprovedRequests(approvedData);
        } catch (err) {
            console.error("Error fetching requests: ", err);
            setError("Gagal memuat data dari database.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    // Fungsi untuk menyetujui request dan mengupdate status di Firestore
    const handleApprove = async (requestId) => {
        if (!window.confirm("Apakah Anda yakin ingin menyetujui registrasi ini?")) return;

        try {
            const docRef = doc(db, 'trainingapp', requestId);
            await updateDoc(docRef, {
                status: 'Approved',
                approvedAt: new Date().toISOString(), 
            });

            fetchRequests();

        } catch (err) {
            console.error("Error approving request: ", err);
            alert("Gagal menyetujui registrasi. Cek koneksi Anda.");
        }
    };

    // Fungsi untuk men-download materi
    const handleDownloadMateri = (materiURL, fileName) => {
        if (materiURL) {
            window.open(materiURL, '_blank');
        } else {
            alert("URL Materi tidak tersedia atau belum diunggah ke Storage.");
        }
    }

    // ... (sisa JSX render tetap sama) ...
    
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-blue-600 font-medium flex items-center">
                    <div className="w-6 h-6 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mr-3"></div>
                    Memuat data registrasi...
                </div>
            </div>
        );
    }

    if (error) {
         return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-red-600">Terjadi kesalahan: {error}</p>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-gray-50 px-6 pt-24 pb-12 flex justify-center">
            <HRHeader />
            <div className="w-full max-w-5xl bg-white shadow-lg rounded-2xl p-8">
                <h2 className="text-3xl font-bold text-center text-blue-800 mb-8 border-b pb-4">
                    Training Implementation Manager Dashboard
                </h2>

                {/* --- PENDING APPROVAL LIST --- */}
                <div className="mb-10">
                    <h3 className="text-xl font-semibold text-orange-600 mb-4 flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Pending Approval ({pendingRequests.length})
                    </h3>
                    
                    {pendingRequests.length === 0 ? (
                        <p className="text-gray-500 italic p-4 bg-green-50 rounded-lg border border-green-200">
                            🎉 Tidak ada request registrasi pending. Semua sudah beres!
                        </p>
                    ) : (
                        <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium">No. Registrasi</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Judul Training</th>
                                        <th className="px-4 py-3 text-center text-sm font-medium">Pengaju</th>
                                        <th className="px-4 py-3 text-center text-sm font-medium">Total Peserta</th>
                                        <th className="px-4 py-3 text-center text-sm font-medium">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {pendingRequests.map((req) => (
                                        <tr key={req.id} className="hover:bg-blue-50 transition">
                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-700">{req.noReg}</td>
                                            <td className="px-4 py-4 text-sm text-gray-900">{req.judulTraining}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{req.approvalManager}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{req.participants ? req.participants.length : 0}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-center">
                                                <button
                                                    onClick={() => handleApprove(req.id)}
                                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 transition"
                                                >
                                                    ✅ Approve
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* --- APPROVED LIST --- */}
                <div>
                    <h3 className="text-xl font-semibold text-green-700 mb-4 flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Approved Training Sessions ({approvedRequests.length})
                    </h3>
                    
                    {approvedRequests.length === 0 ? (
                        <p className="text-gray-500 italic p-4 bg-gray-50 rounded-lg border border-gray-200">
                             Belum ada training yang disetujui.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {approvedRequests.map((req) => (
                                <div
                                    key={req.id}
                                    className="p-6 border rounded-xl shadow-md bg-white border-green-300"
                                >
                                    <h4 className="font-bold text-lg text-blue-800 mb-2">{req.judulTraining}</h4>
                                    {/* Menggunakan data yang sudah 'diamankan' saat fetch */}
                                    <p className="text-sm text-gray-600 mb-3">🗓️ {req.tanggalMulai} s/d {req.tanggalSelesai} | 🧑‍🏫 Instruktur: {req.namaInstruktur}</p>

                                    <div className="flex flex-wrap gap-3 mt-4">
                                        
                                        {/* Tombol Download Absensi */}
                                        <AttendancePDF 
                                            participantsData={req.participants} 
                                            trainingTitle={req.judulTraining}
                                            registrationData={req} // Mengirim objek data yang sudah 'diamankan'
                                        />
                                        
                                        {/* Tombol Download Materi */}
                                        <button
                                            onClick={() => handleDownloadMateri(req.materiURL, req.materiFileName)}
                                            disabled={!req.materiFileName || !req.materiURL || req.materiURL === 'N/A'}
                                            className="inline-flex items-center px-4 py-2 border border-blue-500 text-sm font-medium rounded-lg text-blue-600 bg-white hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <FileText className="w-4 h-4 mr-2" />
                                            Download Materi ({req.materiFileName || 'N/A'})
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrainingImplementation;