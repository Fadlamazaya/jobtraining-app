import React, { useState, useEffect, useCallback } from 'react';
import { Search, Check, X, Eye, FileText, Clock, CheckCircle, XCircle, Filter, Download, Trash2, Users, Bell, Mail, Send, Calendar } from 'lucide-react';
import { collection, query, getDocs, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useNavigate } from 'react-router-dom';

// Konstanta untuk nama koleksi
const TRAINING_COLLECTION = 'trainingapp';
const MANAGER_APPROVAL_COLLECTION = 'approvalManager';
// 💡 KOLEKSI BARU UNTUK NOTIFIKASI
const NOTIFICATIONS_COLLECTION = 'notifications';

// DAFTAR EKSTENSI DOKUMEN YANG MEMBUTUHKAN TIPE DELIVERY 'RAW' (Tetap sama)
const DOCUMENT_EXTENSIONS = ['.pdf', '.docx', '.xlsx', '.doc', '.xls', '.ppt', '.pptx'];

// FUNGSI UNTUK MENGOREKSI URL CLOUDINARY (Logika sudah stabil)
const getDownloadUrl = (url, fileName) => {
    if (!url || !fileName) return null;

    let cleanedUrl = url;
    const parts = fileName.toLowerCase().split('.');
    const fileExtension = parts.length > 1 ? '.' + parts.pop() : '';

    if (DOCUMENT_EXTENSIONS.includes(fileExtension)) {
        cleanedUrl = cleanedUrl.replace('/image/upload/', '/raw/upload/');
    }
    cleanedUrl = cleanedUrl.replace(/\/v\d+\//, '/');
    if (fileExtension && cleanedUrl.toLowerCase().endsWith(fileExtension + fileExtension)) {
        cleanedUrl = cleanedUrl.substring(0, cleanedUrl.length - fileExtension.length);
    }

    return cleanedUrl;
};

// Helper untuk memformat tanggal (DD/MM/YYYY)
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date)) return dateString;
        return date.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch (e) {
        return dateString;
    }
};


export default function ApprovalPage() {
    const navigate = useNavigate();

    const [approvals, setApprovals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedApproval, setSelectedApproval] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showActionModal, setShowActionModal] = useState(false);
    const [actionType, setActionType] = useState('');
    const [reviewNote, setReviewNote] = useState('');

    // 💡 STATE BARU UNTUK NOTIFIKASI
    const [notifications, setNotifications] = useState([]);
    const [showNotificationPopup, setShowNotificationPopup] = useState(false);


    const statusConfig = {
        pending: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
        approved: { label: 'Disetujui', color: 'bg-green-100 text-green-700', icon: CheckCircle },
        rejected: { label: 'Ditolak', color: 'bg-red-100 text-red-700', icon: XCircle }
    };

    // ===========================================
    // 💡 FUNGSI FETCH NOTIFIKASI
    // ===========================================
    const fetchNotifications = useCallback(async () => {
        try {
            const q = query(collection(db, NOTIFICATIONS_COLLECTION));
            const snapshot = await getDocs(q);

            const data = snapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date(),
                }))
                // Filter hanya notifikasi KonfirmasiPelaksanaan (dari KonfirmasiPage)
                .filter(notif => notif.type === 'KonfirmasiPelaksanaan')
                // Sortir dari yang terbaru
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

            setNotifications(data);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    }, []);

    // 💡 FUNGSI MARK AS READ
    const handleMarkAsRead = async (id) => {
        try {
            const notifRef = doc(db, NOTIFICATIONS_COLLECTION, id);
            await updateDoc(notifRef, {
                read: true,
            });
            fetchNotifications(); // Refresh daftar notifikasi
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    // ===========================================
    // 💡 FUNGSI AKSI NOTIFIKASI BARU
    // ===========================================
    const updateNotificationStatus = async (notif, newStatus) => {
        try {
            const notifRef = doc(db, NOTIFICATIONS_COLLECTION, notif.noReg);
            const trainingRef = doc(db, TRAINING_COLLECTION, notif.noReg);

            // 1. Update status Konfirmasi di dokumen notifikasi (selalu diupdate)
            await updateDoc(notifRef, {
                'payload.statusKonfirmasi': newStatus,
                read: true,
            });

            // 2. Update status di koleksi trainingapp (selalu diupdate dari notifikasi)
            // Ini adalah permintaan yang kompleks: Aksi dari lonceng harus mengubah status trainingapp
            await updateDoc(trainingRef, {
                status: newStatus,
                reviewNote: `Diperbarui via notifikasi Manager: ${newStatus}`,
            });

            // ... (Feedback dan Refresh)
            alert(`Aksi ${newStatus.toUpperCase()} untuk Registrasi ${notif.noReg} berhasil diperbarui di kedua tempat.`);
            setShowNotificationPopup(false);
            fetchNotifications();
            fetchApprovals();

        } catch (error) {
            console.error(`Error updating status to ${newStatus}:`, error);
            alert(`Gagal memperbarui status ke ${newStatus}.`);
        }
    }

    const handleReschedule = (notif) => {
        if (window.confirm(`Anda yakin ingin meminta Reschedule untuk Registrasi ${notif.noReg}? Status akan diubah menjadi 'reschedule_pending'.`)) {

            // PANGGIL FUNGSI UNTUK MENGUPDATE STATUS DI DB
            updateNotificationStatus(notif, 'reschedule_pending')
                .then(() => {
                    // Setelah DB diupdate, NAVIGASI KE HALAMAN REGISTRASI UNTUK EDIT
                    navigate(`/registration/edit/${notif.noReg}`);

                    // Opsional: Jika Anda ingin kembali ke halaman edit registrasi setelah Manager klik reschedule.
                    // Anda mungkin perlu menyesuaikan rute ini.
                })
                .catch(error => {
                    console.error("Reschedule failed:", error);
                });
        }
    };

    const handleSubmitNotification = (notif) => {
        if (window.confirm(`Anda yakin ingin Submit (Setujui) pelaksanaan Registrasi ${notif.noReg}? Status training akan diubah menjadi 'approved'.`)) {
            // Mengubah status di notifikasi dan trainingapp menjadi 'approved'
            updateNotificationStatus(notif, 'approved');
        }
    };

    const handleCancelNotification = (notif) => {
        if (window.confirm(`Anda yakin ingin Cancel (Tolak) pelaksanaan Registrasi ${notif.noReg}? Status akan diubah menjadi 'rejected'.`)) {
            // Mengubah status di notifikasi dan trainingapp (sebagai penolakan)
            updateNotificationStatus(notif, 'rejected');
        }
    };
    // ===========================================
    // AKHIR FUNGSI AKSI NOTIFIKASI BARU
    // ===========================================

    // FUNGSI FETCH DATA UTAMA (APPROVALS)
    const fetchApprovals = useCallback(async () => {
        setIsLoading(true);
        try {
            const q = query(collection(db, TRAINING_COLLECTION));
            const snapshot = await getDocs(q);

            const data = snapshot.docs.map(doc => {
                const docData = doc.data();
                const submittedDate = docData.createdAt?.toDate()?.toLocaleDateString('id-ID') || 'N/A';

                return {
                    id: doc.id,
                    noReg: doc.id,
                    judulTraining: docData.judulTraining,
                    area: docData.area,
                    kelasTraining: docData.kelasTraining,
                    tanggalMulai: docData.tanggalMulai,
                    tanggalSelesai: docData.tanggalSelesai,
                    jamMulai: docData.jamMulai,
                    jamSelesai: docData.jamSelesai,
                    instrukturType: docData.instrukturType,
                    namaInstruktur: docData.namaInstruktur,
                    instansi: docData.instrukturNikOrInstansi,
                    materiURL: docData.materiURL,
                    materiFileName: docData.materiFileName,
                    participants: docData.participants || [],
                    status: docData.status || 'pending',
                    submittedDate: submittedDate,
                    approvalDate: docData.approvalDate || '',
                    reviewNote: docData.reviewNote || '',
                    submittedBy: docData.submittedBy || 'N/A'
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
        fetchNotifications();
    }, [fetchApprovals, fetchNotifications]);

    // Logika sisanya (updateApprovalStatus, handleDeleteRegistration, handleSubmitAction, dll.) tidak berubah
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
            });

            // LANGKAH 2: Simpan/Salin ke koleksi approvalManager
            if (newStatus === 'approved' || newStatus === 'rejected') {
                const approvedDocRef = doc(db, MANAGER_APPROVAL_COLLECTION, noReg);

                const dataToApprove = {
                    ...selectedData,
                    status: newStatus,
                    reviewNote: note,
                    approvalDate: approvalDate,
                    approvedBy: selectedData.approvalManager || 'N/A'
                };
                delete dataToApprove.id;

                await setDoc(approvedDocRef, dataToApprove);
            }

            alert(`Registrasi ${noReg} berhasil di${newStatus === 'approved' ? 'setujui' : 'tolak'}!`);

            fetchApprovals();

        } catch (error) {
            console.error(`Error updating status for ${noReg}:`, error);
            alert(`Gagal memperbarui status registrasi ${noReg}.`);
        } finally {
            setShowActionModal(false);
            setSelectedApproval(null);
            setReviewNote('');
        }
    };

    const handleDeleteRegistration = async (noReg) => {
        if (!window.confirm(`Anda yakin ingin menghapus Registrasi ${noReg} secara PERMANEN? Aksi ini tidak dapat dibatalkan, dan data akan hilang dari database.`)) {
            return;
        }
        try {
            await deleteDoc(doc(db, TRAINING_COLLECTION, noReg));
            const approvedDocRef = doc(db, MANAGER_APPROVAL_COLLECTION, noReg);
            try {
                await deleteDoc(approvedDocRef);
            } catch (error) { }

            fetchApprovals();
            alert(`Registrasi ${noReg} berhasil dihapus dari database.`);
        } catch (error) {
            console.error(`Error deleting registration ${noReg}:`, error);
            alert(`Gagal menghapus registrasi ${noReg}.`);
        }
    };

    const handleSubmitAction = () => {
        if (!selectedApproval) return;

        const targetStatus = actionType;
        let note = reviewNote;

        if (targetStatus === 'rejected' && !note.trim()) {
            alert("Catatan Review harus diisi untuk penolakan.");
            return;
        }

        updateApprovalStatus(selectedApproval.noReg, targetStatus, note);
    };

    const handleAction = (approval, type) => {
        setSelectedApproval(approval);
        setReviewNote(approval.reviewNote || '');
        setActionType(type);
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

        const isManagerLevelStatus = ['pending', 'approved', 'rejected'].includes(approval.status);

        return matchesSearch && (filterStatus === 'all' || approval.status === filterStatus);
    });

    const unreadNotificationsCount = notifications.filter(n => !n.read).length;


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

    // KOMPONEN DETAIL MODAL LENGKAP UNTUK MANAGER (Tidak Berubah)
    const FullDetailModal = ({ reg, onClose }) => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold">Detail Registrasi: {reg.judulTraining}</h2>
                    <button onClick={onClose} className="text-white hover:bg-blue-700 rounded-lg p-1">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    {/* RINGKASAN UTAMA */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-4 mb-4">
                        <div>
                            <p className="text-sm font-semibold text-gray-600">No. Registrasi</p>
                            <p className="text-lg font-bold text-gray-900">{reg.noReg}</p>
                            <p className="text-xs text-gray-500">Diajukan: {reg.submittedDate}</p>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-600">Judul Training</p>
                            <p className="text-gray-900">{reg.judulTraining}</p>
                            <p className="text-xs text-gray-600">Kelas: {reg.kelasTraining}</p>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-600">Jadwal</p>
                            <p className="text-gray-900">{reg.tanggalMulai} - {reg.tanggalSelesai}</p>
                            <p className="text-xs text-gray-600">Waktu: {reg.jamMulai} - {reg.jamSelesai}</p>
                        </div>

                        <div className="md:col-span-3">
                            <p className="text-sm font-semibold text-gray-600">Instruktur</p>
                            {/* Menggunakan namaInstruktur dan instansi dari field utama */}
                            <p className="text-gray-900">Nama: {reg.namaInstruktur} ({reg.instrukturType})</p>
                            <p className="text-xs text-gray-600">{reg.instrukturType === 'internal' ? 'NIK' : 'Instansi'}: {reg.instansi}</p>
                        </div>
                    </div>

                    {/* FILE MATERI & STATUS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-b pb-4 mb-4">
                        <div>
                            <p className="text-sm font-semibold text-gray-600">Status Approval</p>
                            <span className={`inline-flex items-center mt-1 px-3 py-1 rounded-full text-xs font-medium ${statusConfig[reg.status]?.color}`}>
                                {statusConfig[reg.status]?.label}
                            </span>
                            {reg.reviewNote && <p className="text-xs text-red-700 italic mt-2">Catatan Review: "{reg.reviewNote}"</p>}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-600">Materi File</p>
                            {reg.materiURL ? (
                                <a
                                    href={getDownloadUrl(reg.materiURL, reg.materiFileName)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center mt-1 text-blue-600 hover:text-blue-800 font-medium text-sm"
                                >
                                    <Download className="w-4 h-4 mr-1" /> {reg.materiFileName || 'Unduh File'}
                                </a>
                            ) : (
                                <p className="text-gray-500 text-sm">Tidak ada file materi dilampirkan.</p>
                            )}
                        </div>
                    </div>

                    {/* DAFTAR PESERTA */}
                    <h4 className="font-bold text-md text-blue-700 mb-3 flex items-center"><Users className="w-4 h-4 mr-2" /> Daftar Peserta ({reg.participants.length} Orang)</h4>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIK</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posisi</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {reg.participants && reg.participants.length > 0 ? (
                                    reg.participants.map((p, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{p.nama}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{p.nik}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{p.position}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{p.unit}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-2 text-center text-sm text-gray-500 italic">Tidak ada peserta terdaftar.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );


    return (
        <div className="w-screen h-screen bg-gradient-to-br from-gray-50 to-blue-50 overflow-auto">
            <div className="w-full h-full px-8 py-6">

                {/* Header dan Lonceng Notifikasi */}
                <div className="mb-8 flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Approval Training</h1>
                        <p className="text-gray-600">Kelola persetujuan registrasi training dari tim Anda</p>
                    </div>

                    {/* 💡 KOMPONEN LONCENG NOTIFIKASI */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotificationPopup(!showNotificationPopup)}
                            className="p-3 rounded-full bg-white shadow-md hover:bg-gray-100 transition relative"
                            title="Notifikasi Konfirmasi Pelaksanaan"
                        >
                            <Bell className="w-6 h-6 text-gray-700" />
                            {unreadNotificationsCount > 0 && (
                                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                                    {unreadNotificationsCount}
                                </span>
                            )}
                        </button>

                        {/* Popup Notifikasi */}
                        {showNotificationPopup && (
                            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                                <div className="p-4 border-b">
                                    <h3 className="font-bold text-lg text-gray-800">Notifikasi Pelaksanaan ({unreadNotificationsCount} Baru)</h3>
                                </div>
                                {notifications.length > 0 ? (
                                    notifications.map((notif) => (
                                        <div
                                            key={notif.id}
                                            className={`p-3 border-b border-gray-100 hover:bg-blue-50 cursor-pointer ${notif.read ? 'bg-white text-gray-600' : 'bg-blue-50 font-semibold text-gray-800'}`}
                                        >
                                            <div className="flex items-start">
                                                <Send className={`w-4 h-4 mt-1 mr-2 ${notif.read ? 'text-blue-400' : 'text-blue-600'}`} />
                                                <div>
                                                    <p className="text-sm font-bold">
                                                        {notif.payload.statusKonfirmasi === 'pending' ? 'Permintaan Konfirmasi' : 'Status: ' + notif.payload.statusKonfirmasi}
                                                    </p>
                                                    <p className="text-xs">{notif.payload.judul}</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        No. Reg: {notif.noReg} | Area: {notif.payload.area}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-xs text-right text-gray-400 mt-1">
                                                {notif.createdAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            </p>

                                            {/* 💡 TOMBOL AKSI HANYA JIKA STATUSNYA PENDING */}
                                            {notif.payload.statusKonfirmasi === 'pending' && (
                                                <div className="flex justify-end gap-2 mt-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleReschedule(notif); }}
                                                        className="px-2 py-1 text-xs text-yellow-700 bg-yellow-100 rounded-lg hover:bg-yellow-200 flex items-center"
                                                    >
                                                        <Calendar className="w-3 h-3 mr-1" /> Reschedule
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleSubmitNotification(notif); }}
                                                        className="px-2 py-1 text-xs text-green-700 bg-green-100 rounded-lg hover:bg-green-200 flex items-center"
                                                    >
                                                        <Check className="w-3 h-3 mr-1" /> Submit
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleCancelNotification(notif); }}
                                                        className="px-2 py-1 text-xs text-red-700 bg-red-100 rounded-lg hover:bg-red-200 flex items-center"
                                                    >
                                                        <X className="w-3 h-3 mr-1" /> Cancel
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="p-4 text-center text-gray-500 text-sm">Tidak ada notifikasi baru.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <hr className="mb-6" />

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
                                                    <p className="text-xs text-gray-500 mt-1">Diajukan: {formatDate(approval.submittedDate)}</p>
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
                                                                href={getDownloadUrl(approval.materiURL, approval.materiFileName)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                                title={`Unduh Materi: ${approval.materiFileName || 'File'}`}
                                                            >
                                                                <Download className="w-5 h-5" />
                                                            </a>
                                                        )}

                                                        {/* Aksi Approve/Reject/Delete */}
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

                                                        {/* 💡 TOMBOL HAPUS */}
                                                        <button
                                                            onClick={() => handleDeleteRegistration(approval.noReg)}
                                                            className="p-2 text-gray-500 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors"
                                                            title="Hapus Registrasi Permanen"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
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
                    <FullDetailModal
                        reg={selectedApproval}
                        onClose={() => setShowDetailModal(false)}
                    />
                )}

                {/* --- Action Modal --- */}
                {showActionModal && selectedApproval && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        {/* ... (Kode Action Modal tetap sama) */}
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
                                        className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${actionType === 'approved'
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