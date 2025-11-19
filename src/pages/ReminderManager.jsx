import React, { useState, useEffect, useCallback } from "react";
import emailjs from '@emailjs/browser';
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Send, AlertTriangle, RefreshCw } from 'lucide-react'; // Import RefreshCw

// --- PENTING: Ganti dengan Kunci EmailJS Anda ---
const SERVICE_ID = "service_aad7d09";
const TEMPLATE_ID = "template_6opl2ns";
const PUBLIC_KEY = "RUUhsfnE0UKyiQ6TP";
// ----------------------------------------------------

const TARGET_POSITION = "Manager";

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

const isTrainingUpcomingOrCurrent = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    return endDate >= today;
};

export default function ReminderDo() {
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // 1. Ambil SEMUA training yang telah disetujui ATAU MASIH PENDING
            // >>> PERUBAHAN UTAMA: TAMBAHKAN "pending" ke array status
            const trainingQuery = query(
                collection(db, "trainingapp"),
                where("status", "in", ["pending", "approved", "Implemented"])
            );
            const trainingSnapshot = await getDocs(trainingQuery);
            const allRelevantTrainings = trainingSnapshot.docs.flatMap(doc => {
                const data = doc.data();
                return data.participants.map(p => ({
                    nik: p.nik,
                    nama: p.nama,
                    judulTraining: data.judulTraining,
                    kelasTraining: data.kelasTraining,
                    tanggalMulai: data.tanggalMulai,
                    tanggalSelesai: data.tanggalSelesai,
                    jamMulai: data.jamMulai,
                    jamSelesai: data.jamSelesai,
                    statusTraining: data.status, // Penting: simpan status training di sini
                }));
            });

            // 2. Ambil Karyawan berdasarkan TARGET_POSITION (TETAP SAMA)
            const usersCollection = collection(db, "users");
            const userQuery = query(usersCollection, where("position", "==", TARGET_POSITION));
            const userSnapshot = await getDocs(userQuery);

            const usersList = userSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            // 3. Gabungkan Data Karyawan & Data Training
            const correlatedReminders = usersList.map(user => {
                // Filter training yang akan/sedang dijalani user DAN statusnya bukan "Implemented" (kalau sudah implemented berarti sudah selesai/tidak perlu diingatkan jadwal lagi)
                const userTrainings = allRelevantTrainings.filter(training =>
                    training.nik === user.nik &&
                    isTrainingUpcomingOrCurrent(training.tanggalMulai, training.tanggalSelesai)
                    // training.statusTraining !== 'Implemented' // Hanya ingatkan yang pending/approved
                );

                const isRegistered = userTrainings.length > 0;

                return {
                    ...user,
                    isRegistered: isRegistered,
                    trainings: userTrainings // Daftar training yang akan/sedang berjalan
                };
            });

            setReminders(correlatedReminders);

        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Gagal memuat data dari Firebase. Cek koneksi & aturan Firestore.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSendEmail = useCallback(async (type, data) => {
        const { name, email, nik, areaKerja, trainings = [] } = data;
        let subject, message, buttonText;

        // Logika untuk Notifikasi Jadwal (Jika Terdaftar)
        if (type === 'notifikasi' && trainings.length > 0) {
            const firstTraining = trainings[0];

            // hanya izinkan notifikasi jika status sudah implemented
            if (firstTraining.statusTraining === 'pending') {
                window.alert(`⚠️ Peringatan: Jadwal training ${firstTraining.judulTraining} untuk ${name} masih berstatus PENDING. Tidak dapat mengirim notifikasi jadwal.`);
                return;
            }

            subject = `Jadwal Training Anda: ${firstTraining.judulTraining}`;
            buttonText = "Kirim Notifikasi";

            const trainingDetails = trainings.map(t =>
                `Judul: ${t.judulTraining}, Kelas: ${t.kelasTraining}, Tgl: ${formatDate(t.tanggalMulai)} s/d ${formatDate(t.tanggalSelesai)}, Jam: ${t.jamMulai}-${t.jamSelesai}`
            ).join('\n\n');

            message = `Berikut adalah detail training Anda yang akan datang/sedang berjalan:\n\n${trainingDetails}\n\nMohon hadir sesuai jadwal.`;

        }
        // Logika untuk Alert Belum Training (Jika Tidak Terdaftar)
        else if (type === 'alert' || trainings.length === 0) {
            subject = "Peringatan: Belum Ada Jadwal Training Kompetensi";
            buttonText = "Kirim Peringatan";
            message = "Anda **belum terdaftar** dalam training kompetensi yang akan datang. Silakan hubungi bagian HRD untuk penjadwalan. Jika sudah, abaikan email ini.";
        } else {
            return;
        }

        if (!window.confirm(`Yakin ${buttonText} ke ${name} (${email})?`)) {
            return;
        }

        const templateParams = {
            title: subject, name: name, email: email, nik: nik, area: areaKerja, message: message,
        };

        try {
            await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
            window.alert(`✅ ${buttonText} berhasil dikirim ke ${email}!`);
        } catch (err) {
            console.error('❌ GAGAL MENGIRIM EMAIL VIA EMAILJS:', err);
            window.alert(`❌ Gagal mengirim email. Error: ${err.message}`);
        }
    }, []);

    // ... (Rendering JSX) ...

    if (loading) {
        return <div className="p-6 text-center text-gray-500">Memuat data dan mengkorelasikan jadwal...</div>;
    }

    if (error) {
        return <div className="p-6 text-center text-red-600">Error: {error}</div>;
    }

    return (
        <div className="p-6">
            <div className="bg-white p-6 rounded-xl shadow-2xl border border-blue-100">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-blue-700">📅 Reminder Job Training</h2>
                    <button
                        onClick={fetchData}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center space-x-2"
                        disabled={loading}
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        <span>Refresh Data</span>
                    </button>
                </div>

                <p className="mb-6 font-medium text-gray-600">Daftar Karyawan Posisi: <span className="text-blue-500 font-bold">{TARGET_POSITION}</span></p>

                <div className="overflow-x-auto rounded-lg shadow-inner">
                    <table className="min-w-full text-sm">
                        <thead className="bg-blue-600 text-white sticky top-0">
                            <tr className="uppercase text-xs tracking-wider">
                                <th className="px-4 py-3 text-left">Nama</th>
                                <th className="px-4 py-3 text-left">NIK</th>
                                <th className="px-4 py-3 text-left">Area Kerja</th>
                                <th className="px-4 py-3 text-left">Email</th>
                                <th className="px-4 py-3 text-center w-1/4">Detail Jadwal Training</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reminders.length > 0 ? (
                                // BAGIAN INI MENGGANTIKAN SEMUA KODE DI DALAM reminders.map
                                reminders.map((reminder) => {
                                    const isRegistered = reminder.isRegistered;
                                    const firstTraining = reminder.trainings[0] || {};

                                    // 1. Tentukan status dari training yang bersangkutan
                                    const currentStatusDb = firstTraining.statusTraining;

                                    // 2. Logika Penentuan Status & Warna
                                    const isImplemented = currentStatusDb === 'Implemented';
                                    const isManagerApproved = currentStatusDb === 'approved';
                                    const isPending = currentStatusDb === 'pending';

                                    let statusLabel = 'Belum Terdaftar';
                                    let statusColor = 'bg-red-500 text-white';

                                    if (isRegistered) {
                                        if (isImplemented) {
                                            statusLabel = 'Implemented/Final';
                                            statusColor = 'bg-green-600 text-white'; // BISA DIKIRIM NOTIFIKASI
                                        } else if (isManagerApproved) {
                                            statusLabel = 'Approved Manager';
                                            statusColor = 'bg-blue-500 text-white'; // Approved Manager, TAPI BELUM BISA KIRIM NOTIFIKASI
                                        } else if (isPending) {
                                            statusLabel = 'Pending';
                                            statusColor = 'bg-yellow-500 text-white';
                                        }
                                    }

                                    // Detail Training
                                    const trainingDetails = isRegistered ? (
                                        <div className="text-left text-xs space-y-1">
                                            <p><span className="font-semibold text-blue-700">Judul:</span> {firstTraining.judulTraining}</p>
                                            <p><span className="font-semibold text-blue-700">Kelas:</span> {firstTraining.kelasTraining}</p>
                                            <p><span className="font-semibold text-blue-700">Tanggal:</span> {formatDate(firstTraining.tanggalMulai)} s/d {formatDate(firstTraining.tanggalSelesai)}</p>
                                            <p><span className="font-semibold text-blue-700">Jam:</span> {firstTraining.jamMulai} - {firstTraining.jamSelesai}</p>
                                        </div>
                                    ) : (
                                        <span className="font-semibold text-red-700">BELUM ADA JADWAL</span>
                                    );

                                    // Tombol Alert (Tidak Berubah)
                                    const buttonAlert = (
                                        <button
                                            onClick={() => handleSendEmail('alert', reminder)}
                                            className={`w-full px-3 py-1 rounded-lg shadow-md transition flex items-center justify-center space-x-2 ${isRegistered ? 'bg-gray-400 text-gray-600 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                                            disabled={loading || isRegistered}
                                        >
                                            <AlertTriangle className="w-4 h-4" />
                                            <span>Alert</span>
                                        </button>
                                    );

                                    // Tombol Notifikasi (Logika Kritis)
                                    const buttonNotifikasi = (
                                        <button
                                            onClick={() => handleSendEmail('notifikasi', reminder)}
                                            // HANYA AKTIF JIKA SUDAH IMPLEMENTED (Finalisasi HR)
                                            className={`w-full px-3 py-1 rounded-lg shadow-md transition flex items-center justify-center space-x-2 ${isRegistered && isImplemented ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-400 text-gray-600 cursor-not-allowed'}`}
                                            disabled={loading || !isRegistered || !isImplemented}
                                        >
                                            <Send className="w-4 h-4" />
                                            <span>Kirim Notifikasi</span>
                                        </button>
                                    );

                                    return (
                                        <tr
                                            key={reminder.nik}
                                            className="border-b hover:bg-blue-50 transition odd:bg-white even:bg-gray-50"
                                        >
                                            <td className="px-4 py-3 font-medium text-gray-800">{reminder.name}</td>
                                            <td className="px-4 py-3">{reminder.nik}</td>
                                            <td className="px-4 py-3">{reminder.areaKerja}</td>
                                            <td className="px-4 py-3 text-blue-600">{reminder.email}</td>
                                            <td className="px-4 py-3 text-center">
                                                {trainingDetails}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {/* Menampilkan status yang sudah diperbarui */}
                                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                                                    {statusLabel}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 space-y-2">
                                                {buttonAlert}
                                                {buttonNotifikasi}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-4 py-6 text-center text-gray-500">
                                        Tidak ada data karyawan ditemukan untuk posisi {TARGET_POSITION}.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
