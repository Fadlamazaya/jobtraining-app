import React, { useState, useEffect, useCallback } from 'react';
import { Search, Check, X, Eye, FileText, Clock, CheckCircle, XCircle, Filter, Download } from 'lucide-react';
import { collection, query, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore'; // 💡 Import untuk operasi DB
import { db } from '../../firebaseConfig'; // 💡 Import db

// Konstanta untuk nama koleksi
const TRAINING_COLLECTION = 'trainingapp';
const MANAGER_APPROVAL_COLLECTION = 'approvalManager';

export default function ApprovalPage() {
    const [approvals, setApprovals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedApproval, setSelectedApproval] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showActionModal, setShowActionModal] = useState(false);
    const [actionType, setActionType] = useState('');
    const [reviewNote, setReviewNote] = useState('');

    const statusConfig = {
        pending: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
        approved: { label: 'Disetujui', color: 'bg-green-100 text-green-700', icon: CheckCircle },
        rejected: { label: 'Ditolak', color: 'bg-red-100 text-red-700', icon: XCircle }
    };

    // 💡 FUNGSI FETCH DATA DARI FIRESTORE
    const fetchApprovals = useCallback(async () => {
        setIsLoading(true);
        try {
            // Ambil SEMUA data dari koleksi trainingapp
            const q = query(collection(db, TRAINING_COLLECTION));
            const snapshot = await getDocs(q);
            
            const data = snapshot.docs.map(doc => {
                const docData = doc.data();
                const submittedDate = docData.createdAt?.toDate()?.toLocaleDateString('id-ID') || 'N/A';
                
                // Menyesuaikan struktur data untuk tampilan Manager
                return {
                    id: doc.id,
                    noReg: doc.id, // Menggunakan Document ID sebagai NoReg
                    judulTraining: docData.judulTraining,
                    area: docData.area,
                    kelasTraining: docData.kelasTraining,
                    tanggalMulai: docData.tanggalMulai,
                    tanggalSelesai: docData.tanggalSelesai,
                    jamMulai: docData.jamMulai,
                    jamSelesai: docData.jamSelesai,
                    instrukturType: docData.instrukturType,
                    
                    // Data yang dibutuhkan untuk detail dan aksi
                    namaInstruktur: docData.namaInstruktur,
                    instansi: docData.instrukturNikOrInstansi, // Menggunakan field gabungan NIK/Instansi
                    materiURL: docData.materiURL, // 💡 URL untuk Download
                    materiFileName: docData.materiFileName,
                    status: docData.status || 'pending',
                    submittedDate: submittedDate,
                    submittedBy: docData.submittedBy,
                    approvalDate: docData.approvalDate || '',
                    reviewNote: docData.reviewNote || '',
                };
            });
            setApprovals(data);
        } catch (error) {
            console.error("Error fetching approvals:", error);
            alert("Gagal memuat data dari Firestore.");
            setApprovals([]); 
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchApprovals();
    }, [fetchApprovals]);
    
    // 💡 LOGIKA HANDLE APPROVE/REJECT KE FIRESTORE
    const updateApprovalStatus = async (noReg, newStatus, note) => {
        const docRef = doc(db, TRAINING_COLLECTION, noReg);
        const approvalDate = new Date().toISOString().split('T')[0];
        const selectedData = approvals.find(a => a.noReg === noReg);

        try {
            // LANGKAH 1: Update status di koleksi utama (trainingapp)
            await updateDoc(docRef, {
                status: newStatus,
                reviewNote: note,
                approvalDate: approvalDate,
                approvalManager: selectedData.approvalManager, // Memastikan nama manager tetap ada
                // Tidak perlu update submittedBy
            });

            // LANGKAH 2: Simpan/Salin ke koleksi approvalManager jika disetujui
            if (newStatus === 'approved') {
                const approvedDocRef = doc(db, MANAGER_APPROVAL_COLLECTION, noReg);
                
                // Pastikan hanya menyalin data yang relevan setelah status diupdate
                await setDoc(approvedDocRef, { 
                    ...selectedData, 
                    status: newStatus, 
                    reviewNote: note, 
                    approvalDate: approvalDate,
                    approvedBy: selectedData.approvalManager // Manager yang meng-approve
                });
            }
            
            // Perbarui state lokal setelah sukses
            fetchApprovals(); // Refresh data dari DB
            alert(`Registrasi ${noReg} berhasil di${newStatus === 'approved' ? 'setujui' : 'tolak'}!`);

        } catch (error) {
            console.error(`Error updating status for ${noReg}:`, error);
            alert(`Gagal memperbarui status registrasi ${noReg}.`);
        }
    };
    
    const handleSubmitAction = () => {
        if (actionType === 'rejected' && !reviewNote.trim()) {
            alert("Catatan Review harus diisi untuk penolakan.");
            return;
        }

        // Memanggil fungsi update ke Firestore
        updateApprovalStatus(selectedApproval.noReg, actionType, reviewNote);

        setShowActionModal(false);
        setSelectedApproval(null);
        setReviewNote('');
    };
    
    const handleAction = (approval, type) => {
        setSelectedApproval(approval);
        setActionType(type);
        setReviewNote('');
        setShowActionModal(true);
    };

    const handleViewDetail = (approval) => {
        setSelectedApproval(approval);
        setShowDetailModal(true);
    };

    const getStatusCount = (status) => {
        return approvals.filter(a => a.status === status).length;
    };


    const filteredApprovals = approvals.filter(approval => {
        const matchesSearch = 
            approval.noReg.toLowerCase().includes(searchTerm.toLowerCase()) ||
            approval.judulTraining.toLowerCase().includes(searchTerm.toLowerCase()) ||
            approval.area.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesFilter = filterStatus === 'all' || approval.status === filterStatus;
        
        // 💡 Hanya tampilkan data yang perlu di-review manager (status 'pending') atau yang sudah di review
        return matchesSearch && matchesFilter;
    });

    if (isLoading) {
        return (
            <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
                <div className="text-blue-600 flex items-center">
                    <div className="w-6 h-6 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mr-3"></div>
                    Memuat data persetujuan...
                </div>
            </div>
        );
    }

    return (
        <div className="w-screen h-screen bg-gradient-to-br from-gray-50 to-blue-50 overflow-auto">
            <div className="w-full h-full px-8 py-6">
                
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Approval Training</h1>
                    <p className="text-gray-600">Kelola persetujuan registrasi training dari tim Anda</p>
                </div>

                {/* --- Stats Cards --- */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-5 border-l-4 border-blue-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 text-sm">Total Ajuan</p>
                          <p className="text-2xl font-bold text-gray-800">{approvals.length}</p>
                        </div>
                        <FileText className="w-8 h-8 text-blue-500" />
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow p-5 border-l-4 border-yellow-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 text-sm">Menunggu</p>
                          <p className="text-2xl font-bold text-gray-800">{getStatusCount('pending')}</p>
                        </div>
                        <Clock className="w-8 h-8 text-yellow-500" />
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow p-5 border-l-4 border-green-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 text-sm">Disetujui</p>
                          <p className="text-2xl font-bold text-gray-800">{getStatusCount('approved')}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow p-5 border-l-4 border-red-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 text-sm">Ditolak</p>
                          <p className="text-2xl font-bold text-gray-800">{getStatusCount('rejected')}</p>
                        </div>
                        <XCircle className="w-8 h-8 text-red-500" />
                      </div>
                    </div>
                </div>

                {/* --- Search and Filter --- */}
                <div className="bg-white rounded-lg shadow p-5 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Cari berdasarkan No. Registrasi, Judul, atau Area..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Filter className="text-gray-400 w-5 h-5" />
                            <select
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="all">Semua Status</option>
                                <option value="pending">Menunggu</option>
                                <option value="approved">Disetujui</option>
                                <option value="rejected">Ditolak</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* --- Approvals List --- */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-blue-600 text-white">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">No. Registrasi</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">Judul Training</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">Area</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">Tanggal</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                                    <th className="px-6 py-3 text-center text-sm font-semibold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredApprovals.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                            Tidak ada data yang ditemukan
                                        </td>
                                    </tr>
                                ) : (
                                    filteredApprovals.map((approval) => {
                                        const StatusIcon = statusConfig[approval.status]?.icon || Clock;
                                        return (
                                            <tr key={approval.noReg} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="font-medium text-gray-900">{approval.noReg}</span>
                                                    <p className="text-xs text-gray-500 mt-1">Diajukan: {approval.submittedDate}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-gray-900">{approval.judulTraining}</span>
                                                    <p className="text-xs text-gray-500 mt-1">{approval.kelasTraining}</p>
                                                </td>
                                                <td className="px-6 py-4 text-gray-900">{approval.area}</td>
                                                <td className="px-6 py-4">
                                                    <span className="text-gray-900 text-sm">{approval.tanggalMulai}</span>
                                                    <p className="text-xs text-gray-500">s/d {approval.tanggalSelesai}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusConfig[approval.status]?.color}`}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        {statusConfig[approval.status]?.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleViewDetail(approval)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Lihat Detail"
                                                        >
                                                            <Eye className="w-5 h-5" />
                                                        </button>
                                                        
                                                        {/* 💡 TOMBOL DOWNLOAD MATERI */}
                                                        {approval.materiURL && (
                                                            <a
                                                                href={approval.materiURL}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                                title={`Unduh Materi: ${approval.materiFileName || 'File'}`}
                                                            >
                                                                <Download className="w-5 h-5" />
                                                            </a>
                                                        )}
                                                        
                                                        {approval.status === 'pending' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleAction(approval, 'approved')}
                                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                    title="Setujui"
                                                                >
                                                                    <Check className="w-5 h-5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleAction(approval, 'rejected')}
                                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title="Tolak"
                                                                >
                                                                    <X className="w-5 h-5" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* --- Detail Modal --- */}
                {showDetailModal && selectedApproval && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                <h2 className="text-xl font-bold">Detail Training</h2>
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="text-white hover:bg-blue-700 rounded-lg p-1"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-600">No. Registrasi</label>
                                        <p className="text-gray-900 mt-1">{selectedApproval.noReg}</p>
                                    </div>
                                    
                                    <div>
                                        <label className="text-sm font-semibold text-gray-600">Judul Training</label>
                                        <p className="text-gray-900 mt-1">{selectedApproval.judulTraining}</p>
                                    </div>
                                    
                                    <div>
                                        <label className="text-sm font-semibold text-gray-600">Area</label>
                                        <p className="text-gray-900 mt-1">{selectedApproval.area}</p>
                                    </div>
                                    
                                    <div>
                                        <label className="text-sm font-semibold text-gray-600">Kelas Training</label>
                                        <p className="text-gray-900 mt-1">{selectedApproval.kelasTraining}</p>
                                    </div>
                                    
                                    <div>
                                        <label className="text-sm font-semibold text-gray-600">Tanggal Mulai</label>
                                        <p className="text-gray-900 mt-1">{selectedApproval.tanggalMulai}</p>
                                    </div>
                                    
                                    <div>
                                        <label className="text-sm font-semibold text-gray-600">Tanggal Selesai</label>
                                        <p className="text-gray-900 mt-1">{selectedApproval.tanggalSelesai}</p>
                                    </div>
                                    
                                    <div>
                                        <label className="text-sm font-semibold text-gray-600">Jam</label>
                                        <p className="text-gray-900 mt-1">{selectedApproval.jamMulai} - {selectedApproval.jamSelesai}</p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-semibold text-gray-600">Diajukan Oleh</label>
                                        <p className="text-gray-900 mt-1">{selectedApproval.submittedBy}</p>
                                    </div>
                                    
                                    {/* Instruktur Details */}
                                    <div className="md:col-span-2 border-t pt-4 mt-2">
                                        <h3 className="font-bold text-md text-blue-700 mb-2">Detail Instruktur</h3>
                                    </div>

                                    <div>
                                        <label className="text-sm font-semibold text-gray-600">Tipe Instruktur</label>
                                        <p className="text-gray-900 mt-1">{selectedApproval.instrukturType}</p>
                                    </div>
                                    
                                    <div>
                                        <label className="text-sm font-semibold text-gray-600">Nama Instruktur</label>
                                        <p className="text-gray-900 mt-1">{selectedApproval.namaInstruktur}</p>
                                    </div>
                                    
                                    <div>
                                        <label className="text-sm font-semibold text-gray-600">NIK / Instansi</label>
                                        <p className="text-gray-900 mt-1">{selectedApproval.instansi}</p>
                                    </div>

                                    {/* Materi File */}
                                    <div className="md:col-span-2">
                                        <label className="text-sm font-semibold text-gray-600">Materi Training</label>
                                        <div className="mt-1">
                                            {selectedApproval.materiURL ? (
                                                <a 
                                                    href={selectedApproval.materiURL} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                                                >
                                                    <Download className="w-4 h-4 mr-1"/> Unduh File ({selectedApproval.materiFileName || 'File Materi'})
                                                </a>
                                            ) : (
                                                <p className="text-gray-500">Tidak ada file materi dilampirkan.</p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Status & Review Note */}
                                    <div className="md:col-span-2 border-t pt-4 mt-2">
                                        <label className="text-sm font-semibold text-gray-600">Status</label>
                                        <div className="mt-1">
                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusConfig[selectedApproval.status].color}`}>
                                                {statusConfig[selectedApproval.status].label} {selectedApproval.approvalDate && `(${selectedApproval.approvalDate})`}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {selectedApproval.reviewNote && (
                                        <div className="md:col-span-2">
                                            <label className="text-sm font-semibold text-gray-600">Catatan Review</label>
                                            <p className="text-gray-900 mt-1 bg-gray-50 p-3 rounded-lg">{selectedApproval.reviewNote}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- Action Modal --- */}
                {showActionModal && selectedApproval && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-md w-full">
                            <div className={`${actionType === 'approved' ? 'bg-green-600' : 'bg-red-600'} text-white px-6 py-4 flex items-center justify-between`}>
                                <h2 className="text-xl font-bold">
                                    {actionType === 'approved' ? 'Setujui' : 'Tolak'} Training
                                </h2>
                                <button
                                    onClick={() => setShowActionModal(false)}
                                    className="text-white hover:bg-opacity-80 rounded-lg p-1"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            
                            <div className="p-6">
                                <div className="mb-4">
                                    <p className="text-gray-600 mb-2">No. Registrasi:</p>
                                    <p className="font-semibold text-gray-900">{selectedApproval.noReg}</p>
                                </div>
                                
                                <div className="mb-4">
                                    <p className="text-gray-600 mb-2">Judul Training:</p>
                                    <p className="font-semibold text-gray-900">{selectedApproval.judulTraining}</p>
                                </div>
                                
                                <div className="mb-4">
                                    <label className="block text-gray-700 font-semibold mb-2">
                                        Catatan Review {actionType === 'rejected' && <span className="text-red-500">*</span>}
                                    </label>
                                    <textarea
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows="4"
                                        placeholder={`Berikan catatan untuk ${actionType === 'approved' ? 'persetujuan' : 'penolakan'} ini...`}
                                        value={reviewNote}
                                        onChange={(e) => setReviewNote(e.target.value)}
                                    />
                                </div>
                                
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowActionModal(false)}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleSubmitAction}
                                        disabled={actionType === 'rejected' && !reviewNote.trim()}
                                        className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                                            actionType === 'approved'
                                                ? 'bg-green-600 hover:bg-green-700'
                                                : 'bg-red-600 hover:bg-red-700'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {actionType === 'approved' ? 'Setujui' : 'Tolak'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}