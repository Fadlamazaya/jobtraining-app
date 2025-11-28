import React, { useState, useEffect, useCallback } from "react";
import emailjs from '@emailjs/browser';
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { Send, AlertTriangle, RefreshCw } from 'lucide-react'; 

// --- PENTING: Ganti dengan Kunci EmailJS Anda ---
const SERVICE_ID = "service_aad7d09";
const TEMPLATE_ID = "template_6opl2ns";
const PUBLIC_KEY = "RUUhsfnE0UKyiQ6TP";
// ----------------------------------------------------

// TARGET AREA KHUSUS UNTUK WATER TREATMENT
const TARGET_AREA = "Water Treatment Plant";

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Fungsi ini menentukan training mana yang masih upcoming atau sedang berjalan (tidak digunakan untuk status Done)
const isTrainingUpcomingOrCurrent = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    return endDate >= today;
};

// FUNGSI UNTUK CEK JIKA TANGGAL SELESAI SUDAH LEWAT (DONE)
const isTrainingDateDone = (endDateString) => {
    if (!endDateString) return false;
    
    try {
        const endDate = new Date(endDateString);
        const today = new Date();
        
        // Reset jam ke 00:00:00 untuk perbandingan tanggal murni
        today.setHours(0, 0, 0, 0); 
        endDate.setHours(0, 0, 0, 0);

        // Jika tanggal selesai lebih kecil dari hari ini, berarti Done.
        return endDate < today;
    } catch (e) {
        console.error("Error parsing date for isTrainingDateDone:", e);
        return false;
    }
};

export default function ReminderWater() {
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // 1. Ambil SEMUA training yang relevan (pending, approved, Implemented)
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
                    statusTraining: data.status, 
                }));
            });

            // 2. Ambil Karyawan berdasarkan TARGET_AREA
            const usersCollection = collection(db, "users");
            const userQuery = query(usersCollection, where("areaKerja", "==", TARGET_AREA));
            const userSnapshot = await getDocs(userQuery);

            const usersList = userSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            // 3. Gabungkan Data Karyawan & Data Training
            const correlatedReminders = usersList.map(user => {
                const userTrainings = allRelevantTrainings.filter(training =>
                    training.nik === user.nik
                );
                
                // Ambil training yang paling relevan/terakhir
                const currentTraining = userTrainings.length > 0 
                    ? userTrainings.sort((a, b) => new Date(b.tanggalMulai) - new Date(a.tanggalMulai))[0]
                    : null;

                const isRegistered = !!currentTraining;

                return {
                    ...user,
                    isRegistered: isRegistered,
                    trainings: currentTraining ? [currentTraining] : [] 
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
        const { name, email, nik, position, trainings = [] } = data;
        let subject, message, buttonText;

        const firstTraining = trainings[0];
        const isDateDone = firstTraining ? isTrainingDateDone(firstTraining.tanggalSelesai) : false;

        // Cek jika statusnya Done (tidak bisa kirim notifikasi/alert jika sudah selesai)
        if (isDateDone) {
            window.alert(`⚠️ Peringatan: Training ${firstTraining.judulTraining} untuk ${name} sudah selesai (Done). Tidak dapat mengirim email.`);
            return;
        }

        // Logika untuk Notifikasi Jadwal (Jika Terdaftar)
        if (type === 'notifikasi' && trainings.length > 0) {
            
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
            title: subject, name: name, email: email, nik: nik, posisi: position, message: message,
        };

        try {
            await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
            window.alert(`✅ ${buttonText} berhasil dikirim ke ${email}!`);
        } catch (err) {
            console.error('❌ GAGAL MENGIRIM EMAIL VIA EMAILJS:', err);
            window.alert(`❌ Gagal mengirim email. Error: ${err.message}`);
        }
    }, []);

    // ---------------------------------------------------------
    // RENDER START
    // ---------------------------------------------------------

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

                <p className="mb-6 font-medium text-gray-600">Daftar Karyawan : <span className="text-blue-500 font-bold">{TARGET_AREA}</span></p>

                <div className="overflow-x-auto rounded-lg shadow-inner">
                    <table className="min-w-full text-sm">
                        <thead className="bg-blue-600 text-white sticky top-0">
                            <tr className="uppercase text-xs tracking-wider">
                                <th className="px-4 py-3 text-left">Nama</th>
                                <th className="px-4 py-3 text-left">NIK</th>
                                <th className="px-4 py-3 text-left">Position</th>
                                <th className="px-4 py-3 text-left">Email</th>
                                <th className="px-4 py-3 text-center w-1/4">Detail Jadwal Training</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reminders.length > 0 ? (
                                reminders.map((reminder) => {
                                    const isRegistered = reminder.isRegistered;
                                    const firstTraining = reminder.trainings[0] || {};

                                    // --- PENENTUAN STATUS DONE BERDASARKAN TANGGAL ---
                                    const isDateDone = isRegistered && isTrainingDateDone(firstTraining.tanggalSelesai);
                                    // --------------------------------------------------

                                    // 1. Tentukan status dari training yang bersangkutan di DB
                                    const currentStatusDb = firstTraining.statusTraining;

                                    // 2. Logika Penentuan Status & Warna
                                    const isImplemented = currentStatusDb === 'Implemented';
                                    const isManagerApproved = currentStatusDb === 'approved';
                                    const isPending = currentStatusDb === 'pending';

                                    let statusLabel = 'Belum Terdaftar';
                                    let statusColor = 'bg-red-500 text-white';

                                    if (isRegistered) {
                                        if (isDateDone) {
                                            // PRIORITAS TERTINGGI: Sudah Lewat Tanggal Selesai
                                            statusLabel = 'Done (Selesai)';
                                            statusColor = 'bg-gray-700 text-white'; 
                                        } else if (isImplemented) {
                                            statusLabel = 'Implemented/Final';
                                            statusColor = 'bg-green-600 text-white'; 
                                        } else if (isManagerApproved) {
                                            statusLabel = 'Approved Manager';
                                            statusColor = 'bg-blue-500 text-white'; 
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

                                    // --- LOGIKA NONAKTIFKAN TOMBOL JIKA DONE ---
                                    const isDisabled = loading || isDateDone;

                                    // Tombol Alert 
                                    const buttonAlert = (
                                        <button
                                            onClick={() => handleSendEmail('alert', reminder)}
                                            className={`w-full px-3 py-1 rounded-lg shadow-md transition flex items-center justify-center space-x-2 ${isRegistered || isDisabled ? 'bg-gray-400 text-gray-600 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                                            disabled={isDisabled || isRegistered} 
                                        >
                                            <AlertTriangle className="w-4 h-4" />
                                            <span>Alert</span>
                                        </button>
                                    );

                                    // Tombol Notifikasi 
                                    const buttonNotifikasi = (
                                        <button
                                            onClick={() => handleSendEmail('notifikasi', reminder)}
                                            // Nonaktif jika Done (isDisabled) ATAU belum Implemented
                                            className={`w-full px-3 py-1 rounded-lg shadow-md transition flex items-center justify-center space-x-2 ${isRegistered && isImplemented && !isDisabled ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-400 text-gray-600 cursor-not-allowed'}`}
                                            disabled={isDisabled || !isRegistered || !isImplemented}
                                        >
                                            <Send className="w-4 h-4" />
                                            <span>Kirim Notifikasi</span>
                                        </button>
                                    );
                                    // -------------------------------------------

                                    return (
                                        <tr
                                            key={reminder.nik}
                                            className="border-b hover:bg-blue-50 transition odd:bg-white even:bg-gray-50"
                                        >
                                            <td className="px-4 py-3 font-medium text-gray-800">{reminder.name}</td>
                                            <td className="px-4 py-3">{reminder.nik}</td>
                                            <td className="px-4 py-3">{reminder.position}</td>
                                            <td className="px-4 py-3 text-blue-600">{reminder.email}</td>
                                            <td className="px-4 py-3 text-center">
                                                {trainingDetails}
                                            </td>
                                            <td className="px-4 py-3 text-center">
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
                                        Tidak ada data karyawan ditemukan untuk unit {TARGET_AREA}.
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