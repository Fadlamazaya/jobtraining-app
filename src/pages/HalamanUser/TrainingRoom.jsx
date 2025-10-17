// src/pages/hr/TrainingRoom.jsx (Versi Sederhana Fokus Ketersediaan Harian dengan Detail Tanggal)
import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; 
import HRHeader from "../../components/HalamanHR/HRHeader";
import { Clock, Calendar, Users, Building, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

// Data master ruangan (Harus sinkron dengan RegistrasiPage.jsx)
const masterRooms = [
    { name: "Davinci", capacity: 20 },
    { name: "Newton", capacity: 25 },
    { name: "Edison", capacity: 30 },
    { name: "Copernicus", capacity: 20 }, 
    { name: "Aristoteles", capacity: 25 }, 
    { name: "Archimedes", capacity: 30 }, 
    { name: "Plato", capacity: 20 },
];

// Helper untuk memformat tanggal YYYY-MM-DD menjadi DD/MM/YYYY
const formatDisplayDate = (dateString) => {
    if (!dateString) return '-';
    try {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}`; // Hanya tampilkan tanggal/bulan
    } catch (e) {
        return dateString;
    }
};

// Fungsi utilitas untuk mengecek bentrok waktu (HH:MM) - TIDAK DIGUNAKAN DI SINI TAPI DIJAGA
const isTimeOverlap = (start1, end1, start2, end2) => {
    const toMinutes = (time) => { /* ... logic ... */ return 0; };
    const s1 = toMinutes(start1);
    const e1 = toMinutes(end1);
    const s2 = toMinutes(start2);
    const e2 = toMinutes(end2);
    return s1 < e2 && e1 > s2;
};


const TrainingRoom = () => {
    const [scheduledTrainings, setScheduledTrainings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // --- FUNGSI UTAMA: AMBIL JADWAL APPROVED DARI FIRESTORE ---
    const fetchSchedules = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const q = query(
                collection(db, 'trainingapp'), 
                where('status', '==', 'Approved')
            );
            const snapshot = await getDocs(q);
            
            const schedules = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    room: data.kelasTraining,
                    dateStart: data.tanggalMulai, 
                    dateEnd: data.tanggalSelesai, 
                    timeStart: data.jamMulai,      
                    timeEnd: data.jamSelesai,      
                    participantsCount: (data.participants || []).length,
                    judul: data.judulTraining
                };
            });
            setScheduledTrainings(schedules);
        } catch (err) {
            console.error("Error fetching schedules:", err);
            setError("Gagal memuat jadwal dari database.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedules();
    }, []);

    // --- LOGIKA CEK STATUS RUANGAN HARI INI ---
    const getRoomData = (roomName) => {
        const roomInfo = masterRooms.find(r => r.name === roomName) || {};
        let currentConflict = null;

        scheduledTrainings.forEach(s => {
            if (s.room !== roomName) return;

            // 1. Cek Bentrok Tanggal Hari Ini
            const dateToday = new Date(today);
            const dateScheduledStart = new Date(s.dateStart);
            const dateScheduledEnd = new Date(s.dateEnd);
            
            const isDateOverlap = dateToday >= dateScheduledStart && dateToday <= dateScheduledEnd;

            if (isDateOverlap) {
                // Jika tanggal bentrok, simpan detail jadwalnya
                currentConflict = s;
                return; 
            }
        });

        if (currentConflict) {
            return {
                ...roomInfo,
                used: currentConflict.participantsCount,
                status: "Terpakai",
                statusClass: "bg-red-100 text-red-700 font-semibold",
                startTime: currentConflict.timeStart,
                endTime: currentConflict.timeEnd,
                title: currentConflict.judul,
                // Tambahkan rentang tanggal pemakaian
                dateRange: `${formatDisplayDate(currentConflict.dateStart)} - ${formatDisplayDate(currentConflict.dateEnd)}`
            };
        }

        // Ruangan Kosong Hari Ini
        return {
            ...roomInfo,
            used: 0,
            status: "Kosong",
            statusClass: "bg-green-100 text-green-700 font-semibold",
            startTime: "-",
            endTime: "-",
            title: "-",
            dateRange: "-"
        };
    };
    
    // Siapkan data untuk ditampilkan
    const displayRooms = masterRooms.map(room => getRoomData(room.name));

    if (isLoading) {
        // ... (Loading state tetap sama)
    }

    if (error) {
        // ... (Error state tetap sama)
    }
    
    return (
        <div className="min-h-screen bg-gray-50 flex justify-center pt-24 pb-12 px-4">
            <HRHeader />
            <div className="w-full max-w-4xl bg-white shadow-xl rounded-xl p-8">
                <h2 className="text-2xl font-bold text-center text-blue-800 mb-6 border-b pb-3">
                    Daftar Ketersediaan Training Room 
                </h2>

                <div className="flex justify-center text-sm text-gray-600 mb-6 space-x-4">
                    <p className="flex items-center"><Calendar className="w-4 h-4 mr-1 text-blue-500" /> Tanggal Hari Ini: {today} </p>
                    <p className="flex items-center"><Clock className="w-4 h-4 mr-1 text-blue-500" /> Waktu Saat Ini: {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} </p>
                </div>

                <div className="overflow-x-auto mt-4 border border-gray-200 rounded-lg shadow-sm">
                    <table className="w-full min-w-[700px]">
                        <thead className="bg-blue-700 text-white">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium w-[150px]">Nama Ruangan</th>
                                <th className="px-4 py-3 text-center font-medium w-[100px]">Kapasitas</th>
                                <th className="px-4 py-3 text-center font-medium w-[100px]">Terisi</th>
                                <th className="px-4 py-3 text-center font-medium w-[100px]">Status</th>
                                <th className="px-4 py-3 text-center font-medium">Tanggal Diblokir</th> {/* KOLOM BARU */}
                                <th className="px-4 py-3 text-center font-medium">Waktu Mulai</th>
                                <th className="px-4 py-3 text-center font-medium">Waktu Selesai</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {displayRooms.map((data) => (
                                <tr
                                    key={data.name}
                                    className={`odd:bg-white even:bg-gray-50 hover:bg-blue-50 transition`}
                                >
                                    <td className="px-4 py-3 font-semibold text-gray-800 border-r">
                                        <Building className="w-4 h-4 inline mr-2 text-blue-600"/>
                                        {data.name}
                                    </td>
                                    <td className="px-4 py-3 text-center text-gray-600 border-r">
                                        {data.capacity} orang
                                    </td>
                                    <td className="px-4 py-3 text-center text-gray-600 border-r">
                                        {data.used} orang
                                    </td>
                                    <td className="px-4 py-3 text-center border-r">
                                        <span className={`px-3 py-1 rounded-full text-xs ${data.statusClass}`}>
                                            {data.status}
                                        </span>
                                    </td>
                                    {/* Kolom Tanggal Pemakaian */}
                                    <td className="px-4 py-3 text-center text-gray-700 border-r">
                                        {data.dateRange} 
                                    </td>
                                    <td className="px-4 py-3 text-center text-gray-700 border-r">
                                        {data.startTime}
                                    </td>
                                    <td className="px-4 py-3 text-center text-gray-700">
                                        {data.endTime}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {/* Legenda */}
                <div className="mt-6 text-sm text-gray-600">
                    <p>
                        * Keterangan: Ruangan dianggap **Terpakai** jika ada jadwal **Approved** yang tumpang tindih dengan Tanggal Hari Ini.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TrainingRoom;