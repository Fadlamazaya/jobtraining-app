import React, { useState, useEffect, useCallback } from 'react';
import {
    Search, Clock, CheckCircle, XCircle, Filter,
    Eye, Send, Mail, Users, Download,
    FileText, X, Calendar, ArrowLeft
} from 'lucide-react';
import { collection, query, getDocs, doc, setDoc, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';

// Konstanta untuk nama koleksi
const TRAINING_COLLECTION = 'trainingapp';
const NOTIFICATIONS_COLLECTION = 'notifications';

const SERVICE_ID = "service_aad7d09";
const TEMPLATE_ID = "template_6opl2ns";
const PUBLIC_KEY = "RUUhsfnE0UKyiQ6TP";

// DAFTAR EKSTENSI DOKUMEN YANG MEMBUTUHKAN TIPE DELIVERY 'RAW'
const DOCUMENT_EXTENSIONS = ['.pdf', '.docx', '.xlsx', '.doc', '.xls', '.ppt', '.pptx'];

// FUNGSI UNTUK MENGOREKSI URL CLOUDINARY
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
        // PERBAIKAN: Menggunakan format Date ISO (YYYY-MM-DD) yang disimpan di Firestore
        const date = new Date(dateString);  // Tambahkan T00:00:00 untuk menghindari masalah timezone
        if (isNaN(date)) return dateString;
        return date.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch (e) {
        return dateString;
    }
};


// ===========================================
// KOMPONEN KONFIRMASI PAGE
// ===========================================
export default function KonfirmasiPage() {
    const navigate = useNavigate();

    const [konfirmasis, setKonfirmasis] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedTraining, setSelectedTraining] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Konfigurasi status
    const statusConfig = {
        pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
        approved: { label: 'Disetujui Manager', color: 'bg-green-100 text-green-700', icon: CheckCircle },
        rejected: { label: 'Ditolak Manager', color: 'bg-red-100 text-red-700', icon: XCircle },
        confirmed: { label: 'Terkonfirmasi (Notif Sent)', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
        reschedule_pending: { label: 'Reschedule Diminta', color: 'bg-orange-100 text-orange-700', icon: Calendar },
        'HR Rejected': { label: 'Ditolak Final (HR)', color: 'bg-red-200 text-red-800', icon: XCircle }
    };

    // FUNGSI FETCH DATA DARI FIRESTORE
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const qTraining = query(collection(db, TRAINING_COLLECTION));
            const trainingSnapshot = await getDocs(qTraining);

            // Ambil semua notifikasi yang RELEVAN (Konfirmasi Pelaksanaan dan HR Finalisasi)
            const qNotifications = query(collection(db, NOTIFICATIONS_COLLECTION),
                where('type', 'in', ['KonfirmasiPelaksanaan', 'HR Finalisasi'])); // 💡 TAMBAH FILTER HR Finalisasi
            const notificationsSnapshot = await getDocs(qNotifications);

            // Map status terakhir dari Notifikasi (hasil aksi Manager/HR)
            const confirmationMap = notificationsSnapshot.docs
                .reduce((acc, doc) => {
                    const data = doc.data();
                    // Prioritas status dari payload (apakah itu Konfirmasi status atau HR Finalisasi status)
                    acc[doc.id] = data.payload?.statusKonfirmasi || 'pending';
                    return acc;
                }, {});

            const data = trainingSnapshot.docs.map(doc => {
                const docData = doc.data();
                // PERBAIKAN: Gunakan toDate() jika berupa Timestamp, jika tidak, gunakan nilai langsung.
                const submittedDate = docData.createdAt?.toDate ? formatDate(docData.createdAt.toDate().toISOString()) : 'N/A';

                let currentStatus = docData.status || 'pending';

                // ===================================================================
                // LOGIKA PRIORITAS STATUS KONFIRMASIPAGE
                // ===================================================================
                if (confirmationMap[doc.id]) {
                    // Jika Notifikasi Konfirmasi/HR Finalisasi ada, gunakan status Notifikasi
                    currentStatus = confirmationMap[doc.id];
                } else if (docData.status === 'approved') {
                    // Jika TIDAK ADA Notifikasi, tetapi Approval Manager sudah APPROVED (dari tabel ApprovalPage), 
                    currentStatus = 'pending';
                } else if (docData.status === 'HR Rejected') {
                    // Jika HR Rejected dari DB langsung, dan belum ada notif (kasus yang jarang terjadi), tampilkan
                    currentStatus = 'HR Rejected';
                }
                // Jika status trainingapp adalah 'rejected' dan belum ada notif, biarkan rejected.
                // ===================================================================


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
                    status: currentStatus,
                    submittedDate: submittedDate,
                    reviewNote: docData.reviewNote || '',
                };
            });
            setKonfirmasis(data);
        } catch (error) {
            console.error("Error fetching data:", error);
            alert("Gagal memuat data dari Firestore.");
            setKonfirmasis([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ===========================================
    // FUNGSI SUBMIT KONFIRMASI DENGAN STATUS PENDING DI NOTIFICATIONS
    // ===========================================
    const handleSubmit = async (noReg) => {
        const trainingToConfirm = konfirmasis.find(t => t.noReg === noReg);
        if (!trainingToConfirm) return;

        // Cek jika status tampilan sudah 'confirmed' untuk mencegah kirim berulang
        if (['confirmed', 'reschedule_pending'].includes(trainingToConfirm.status)) {
            alert(`Training ${noReg} sudah pernah dikonfirmasi atau sedang menunggu Reschedule.`);
            return;
        }

        if (window.confirm(`Anda yakin ingin Submit Konfirmasi untuk Registrasi ${noReg}? Aksi ini akan mengirim notifikasi konfirmasi pelaksanaan.`)) {
            try {

                // 1. Definisikan referensi dokumen NOTIFIKASI dengan ID = noReg
                const notificationDocRef = doc(db, NOTIFICATIONS_COLLECTION, noReg);

                // 2. BUAT/SET DOKUMEN BARU DI KOLEKSI NOTIFICATIONS (Payload Notifikasi)
                const newNotification = {
                    noReg: noReg,
                    type: 'KonfirmasiPelaksanaan',
                    read: false,
                    createdAt: new Date(),
                    payload: {
                        judul: trainingToConfirm.judulTraining,
                        area: trainingToConfirm.area,
                        statusKonfirmasi: 'pending', // Status notifikasi sekarang PENDING
                        jadwal: `${formatDate(trainingToConfirm.tanggalMulai)} - ${formatDate(trainingToConfirm.tanggalSelesai)} (${trainingToConfirm.jamMulai} - ${trainingToConfirm.jamSelesai})`,
                        instruktur: trainingToConfirm.namaInstruktur,
                        jumlahPeserta: trainingToConfirm.participants.length,
                    }
                };

                // Gunakan setDoc untuk menetapkan ID dokumen
                await setDoc(notificationDocRef, newNotification);

                alert(`Konfirmasi Training ${noReg} berhasil di-Submit! Notifikasi telah dikirim ke Manager dengan status PENDING.`);
                fetchData(); // Panggil ulang untuk memperbarui UI dengan status PENDING dari notifikasi

            } catch (error) {
                console.error("Error saving notification:", error);
                alert("Gagal meng-Submit konfirmasi. Silakan coba lagi.");
            }
        }
    };

    // FUNGSI KIRIM EMAIL DENGAN EMAILJS (MODIFIKASI)
    const handleSendEmail = async (noReg) => {
        // Pastikan Anda mendapatkan trainingToSend
        const trainingToSend = konfirmasis.find(t => t.noReg === noReg);
        if (!trainingToSend) return;

        if (!window.confirm(`Anda yakin ingin mengirim Notifikasi Email untuk Registrasi ${noReg} ke Manager & HR?`)) {
            return;
        }

        try {
            // 1. Siapkan data training
            const schedule = `${formatDate(trainingToSend.tanggalMulai)} - ${formatDate(trainingToSend.tanggalSelesai)} (${trainingToSend.jamMulai} - ${trainingToSend.jamSelesai})`;
            const participantsList = trainingToSend.participants.map((p, index) =>
                `${index + 1}. ${p.nama} (NIK: ${p.nik}) (unit: ${p.unit})`
            ).join('\n');

            // 2. Buat subjek dan badan email
            const subject = `Daftar Pelaksanaan Training: ${trainingToSend.judulTraining} (Reg: ${noReg})`;

            const messageDetails = `Daftar Peserta Pelaksanaan Training Baru telah diajukan. 

            --- DETAIL TRAINING ---
            No. Registrasi: ${trainingToSend.noReg}
            Judul Training: ${trainingToSend.judulTraining}
            Area Pengajuan: ${trainingToSend.area}
            Kelas Training: ${trainingToSend.kelasTraining}
            Status Saat Ini: ${statusConfig[trainingToSend.status]?.label}
            
            Jadwal Pelaksanaan: ${schedule}
            Instruktur: ${trainingToSend.namaInstruktur} (${trainingToSend.instrukturType})

            Total Peserta: ${trainingToSend.participants.length} Orang

            --- DAFTAR PESERTA ---
            ${participantsList || 'Tidak ada peserta terdaftar.'}
            
            Mohon tindak lanjuti di halaman Approval Manager.
        `;

            // 3. Siapkan parameter template EmailJS
            // Catatan: Asumsikan template EmailJS Anda memiliki variabel:
            // {{subject}}, {{message}}, {{manager_email}}, {{hr_email}}, {{reply_to}}

            const managerEmail = 'admtrainingikpp@gmail.com';
            const hrEmail = 'hrIkpp@gmail.com'; // Ganti dengan email HR yang valid.
            const recipientName = 'Admin';

            const templateParams = {
                title: subject,
                // Penerima email: Di template EmailJS, set "To" ke {{manager_email}}, {{hr_email}}
                email: `${managerEmail}, ${hrEmail}`,
                // Email Pengirim: Ini akan menjadi alamat reply-to email.

                name: recipientName,

                

                reply_to: 'toni.irawan.rmp@gmail.com',

                // Konten detail
                message: messageDetails,
            };

            // 4. Kirim Email
            await emailjs.send(
                SERVICE_ID,
                TEMPLATE_ID,
                templateParams,
                PUBLIC_KEY
            );

            alert(`Notifikasi Email untuk Registrasi ${noReg} berhasil dikirim ke Manager dan HR.`);

        } catch (error) {
            console.error("Error sending email:", error);
            alert(`Gagal mengirim email notifikasi. Pastikan EmailJS sudah dikonfigurasi dengan benar. Error: ${error.message}`);
        }
    };

    const handleViewDetail = (training) => {
        setSelectedTraining(training);
        setShowDetailModal(true);
    };

    // ... (Logika Filtering dan JSX Detail Modal)

    const filteredTrainings = konfirmasis.filter(training => {
        const matchesSearch =
            training.noReg.toLowerCase().includes(searchTerm.toLowerCase()) ||
            training.judulTraining.toLowerCase().includes(searchTerm.toLowerCase()) ||
            training.area.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = filterStatus === 'all' || training.status === filterStatus;

        return matchesSearch && matchesFilter;
    });

    if (isLoading) {
        return (
            <div className="w-screen h-screen flex items-center justify-center bg-gray-50">
                <div className="text-blue-600 flex items-center">
                    <div className="w-6 h-6 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mr-3"></div>
                    Memuat data konfirmasi...
                </div>
            </div>
        );
    }

    // KOMPONEN DETAIL MODAL (Preview) 
    const PreviewDetailModal = ({ reg, onClose }) => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold">Detail Training: {reg.judulTraining}</h2>
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
                            <p className="text-gray-900">{formatDate(reg.tanggalMulai)} - {formatDate(reg.tanggalSelesai)}</p>
                            <p className="text-xs text-gray-600">Waktu: {reg.jamMulai} - {reg.jamSelesai}</p>
                        </div>

                        <div className="md:col-span-3">
                            <p className="text-sm font-semibold text-gray-600">Instruktur</p>
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
                            <thead>
                                <tr className="bg-gray-50">
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
        <div className="bg-white p-6 rounded-xl shadow-2xl">
            <div className="w-full h-full px-8 py-6">

                {/* Header Konfirmasi */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-4 text-blue-700">Konfirmasi Training</h1>
                    <p className="text-gray-600">Lihat detail, kirim konfirmasi pelaksanaan atau kirim email notifikasi.</p>
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
                                <option value="pending">Pending</option>
                                <option value="approved">Disetujui</option>
                                <option value="rejected">Ditolak</option>
                                <option value="confirmed">Terkonfirmasi (Notif Sent)</option>
                                <option value="reschedule_pending">Reschedule Diminta</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* --- Konfirmasi List Table --- */}
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
                                {filteredTrainings.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                            Tidak ada data yang ditemukan
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTrainings.map((training) => {
                                        const StatusIcon = statusConfig[training.status]?.icon || Clock;
                                        // Tombol konfirmasi HANYA boleh muncul jika status bukan 'confirmed' atau 'reschedule_pending'
                                        const canSubmit = !['confirmed', 'reschedule_pending', 'rejected'].includes(training.status);
                                        const canEdit = training.status === 'reschedule_pending';

                                        return (
                                            <tr key={training.noReg} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="font-medium text-gray-900">{training.noReg}</span>
                                                    <p className="text-xs text-gray-500 mt-1">Diajukan: {formatDate(training.submittedDate)}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-gray-900">{training.judulTraining || 'N/A'}</span>
                                                    <p className="text-xs text-gray-500 mt-1">{training.kelasTraining || 'N/A'}</p>
                                                </td>
                                                <td className="px-6 py-4 text-gray-900">{training.area || 'N/A'}</td>
                                                <td className="px-6 py-4">
                                                    <span className="text-gray-900 text-sm">{formatDate(training.tanggalMulai)}</span>
                                                    <p className="text-xs text-gray-500">s/d {formatDate(training.tanggalSelesai)}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusConfig[training.status]?.color}`}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        {statusConfig[training.status]?.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-1">

                                                        {/* Tombol Preview Detail */}
                                                        <button
                                                            onClick={() => handleViewDetail(training)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Lihat Detail Training"
                                                        >
                                                            <Eye className="w-5 h-5" />
                                                        </button>

                                                        {/* Tombol KEMBALI EDIT (JIKA RESCHEDULE) */}
                                                        {canEdit && (
                                                            <button
                                                                onClick={() => navigate(`/registration/edit/${training.noReg}`)}
                                                                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors flex items-center"
                                                                title="Kembali Edit Registrasi"
                                                            >
                                                                <ArrowLeft className="w-5 h-5" />
                                                            </button>
                                                        )}

                                                        {/* Tombol Kirim Konfirmasi */}
                                                        {canSubmit && (
                                                            <button
                                                                onClick={() => handleSubmit(training.noReg)}
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                title="Kirim Konfirmasi Pelaksanaan"
                                                            >
                                                                <Send className="w-5 h-5" />
                                                            </button>
                                                        )}

                                                        {/* Tombol Konfirmasi Disabled (Jika sudah confirmed/rejected) */}
                                                        {!canSubmit && !canEdit && training.status !== 'rejected' && (
                                                            <button
                                                                className="p-2 text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed"
                                                                title="Sudah Dikonfirmasi"
                                                            >
                                                                <CheckCircle className="w-5 h-5" />
                                                            </button>
                                                        )}
                                                        {!canSubmit && !canEdit && training.status === 'rejected' && (
                                                            <button
                                                                className="p-2 text-red-400 bg-red-100 rounded-lg cursor-not-allowed"
                                                                title="Ditolak Manager"
                                                            >
                                                                <XCircle className="w-5 h-5" />
                                                            </button>
                                                        )}

                                                        {/* Tombol Kirim Email */}
                                                        <button
                                                            onClick={() => handleSendEmail(training.noReg)}
                                                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                                            title="Kirim Email Notifikasi"
                                                        >
                                                            <Mail className="w-5 h-5" />
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

                {/* --- Detail Modal (Preview) --- */}
                {showDetailModal && selectedTraining && (
                    <PreviewDetailModal
                        reg={selectedTraining}
                        onClose={() => setShowDetailModal(false)}
                    />
                )}
            </div>
        </div>
    );
}