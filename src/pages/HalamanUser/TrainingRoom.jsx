// src/pages/hr/TrainingRoom.jsx (Koreksi Filter Waktu Selesai Penuh)
import React, { useState, useEffect, useRef, useMemo } from "react"; 
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; 
import HRHeader from "../../components/HalamanHR/HRHeader";
import { Clock, Calendar, Users, Building, RefreshCw, CheckCircle, XCircle, Info, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'; 

// Data master ruangan
const masterRooms = [
    { name: "Davinci", capacity: 20 },
    { name: "Newton", capacity: 25 },
    { name: "Edison", capacity: 30 },
    { name: "Copernicus", capacity: 20 }, 
    { name: "Aristoteles", capacity: 25 }, 
    { name: "Archimedes", capacity: 30 }, 
    { name: "Plato", capacity: 20 },
];

// Helper untuk memformat tanggal YYYY-MM-DD
const formatDisplayDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const parts = dateString.split('-');
        if (parts.length === 3) {
             return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateString;
    } catch (e) {
        return dateString;
    }
};

/**
 * Fungsi Helper untuk membuat objek Date di Local Time (untuk perbandingan tanggal saja)
 */
const createLocalDate = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
};

// --- KOMPONEN KALENDER MODAL BARU (Hampir tidak ada perubahan, karena filtering dilakukan di fetchSchedules) ---
const CalendarModal = ({ roomName, allSchedules, onClose, today }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null); // YYYY-MM-DD string
    const [dailyConflicts, setDailyConflicts] = useState([]);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay(); 

    const dateToday = useMemo(() => createLocalDate(today), [today]);

    // Map untuk mencari konflik dari jadwal yang SUDAH DIFILTER di atas
    const conflictsMap = useMemo(() => {
        const map = new Map();
        
        allSchedules.forEach(s => {
            if (s.room !== roomName) return;

            let current = createLocalDate(s.dateStart); 
            const end = createLocalDate(s.dateEnd);

            while (current <= end) {
                const currentYear = current.getFullYear();
                const currentMonth = String(current.getMonth() + 1).padStart(2, '0');
                const currentDay = String(current.getDate()).padStart(2, '0');
                const dateKey = `${currentYear}-${currentMonth}-${currentDay}`;
                
                if (!map.has(dateKey)) {
                    map.set(dateKey, []);
                }
                map.get(dateKey).push(s);
                current.setDate(current.getDate() + 1);
            }
        });
        return map;
    }, [roomName, allSchedules, dateToday]);

    // Fungsi untuk mengubah bulan
    const changeMonth = (delta) => {
        const newDate = new Date(currentDate.setMonth(currentDate.getMonth() + delta));
        setCurrentDate(new Date(newDate)); 
        setSelectedDate(null);
        setDailyConflicts([]);
    };
    
    // Handler klik tanggal
    const handleDateClick = (day) => {
        if (!day) return;
        
        const dayString = String(day).padStart(2, '0');
        const monthString = String(month + 1).padStart(2, '0');
        const dateKey = `${year}-${monthString}-${dayString}`;
        
        setSelectedDate(dateKey);
        setDailyConflicts(conflictsMap.get(dateKey) || []);
    };
    
    // Render hari-hari di kalender
    const renderCalendarDays = () => {
        const days = [];
        
        const dayOffset = firstDayIndex; 

        for (let i = 0; i < dayOffset; i++) {
             days.push(<div key={`spacer-${i}`} className="p-1"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayString = String(day).padStart(2, '0');
            const monthString = String(month + 1).padStart(2, '0');
            const dateKey = `${year}-${monthString}-${dayString}`;
            
            const hasConflict = conflictsMap.has(dateKey);
            const isSelected = selectedDate === dateKey;

            let dayClasses = "p-2 rounded-full cursor-pointer text-center text-sm transition-colors";
            
            const dateToCheck = createLocalDate(dateKey);
            const isPast = dateToCheck < dateToday;
            
            if (isPast) {
                 dayClasses += " text-gray-400 cursor-default";
            } else if (hasConflict) {
                dayClasses += " bg-red-400 text-white font-bold hover:bg-red-500";
            } else {
                dayClasses += " hover:bg-blue-100";
            }
            
            if (isSelected) {
                dayClasses += " ring-2 ring-blue-600 bg-blue-500 text-white";
            }

            days.push(
                <div 
                    key={day} 
                    className={dayClasses}
                    onClick={() => { if (!isPast) handleDateClick(day); }}
                >
                    {day}
                </div>
            );
        }

        return days;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-4xl w-full flex space-x-6">
                
                {/* Bagian Kalender */}
                <div className="w-1/2 p-4 border rounded-lg">
                    <h3 className="text-xl font-bold text-blue-700 mb-4 flex items-center">
                        <Calendar className="w-5 h-5 mr-2" /> Ketersediaan Kelas {roomName}
                    </h3>
                    
                    {/* Navigasi Bulan */}
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={() => changeMonth(-1)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"><ChevronLeft className="w-5 h-5" /></button>
                        <h4 className="font-semibold">{currentDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</h4>
                        <button onClick={() => changeMonth(1)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"><ChevronRight className="w-5 h-5" /></button>
                    </div>

                    {/* Grid Kalender */}
                    <div className="grid grid-cols-7 text-center font-medium text-gray-600 border-b pb-2">
                        {/* Judul hari: Minggu sampai Sabtu */}
                        {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                            <div key={day} className="text-xs">{day}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1 pt-2">
                        {renderCalendarDays()}
                    </div>
                    
                    <div className="mt-4 text-xs">
                        <span className="inline-block w-3 h-3 bg-red-400 rounded-full mr-2"></span> Tanggal terbooking
                    </div>
                </div>

                {/* Bagian Detail Bentrok */}
                <div className="w-1/2 p-4 border rounded-lg bg-gray-50">
                    <h3 className="text-xl font-bold text-gray-700 mb-4">Detail Jadwal</h3>
                    
                    {selectedDate ? (
                        <div className="space-y-3">
                            <h4 className="text-lg font-bold text-blue-600 border-b pb-1">Jadwal pada {formatDisplayDate(selectedDate)}</h4>
                            
                            {dailyConflicts.length > 0 ? (
                                <ul className="space-y-3">
                                    {dailyConflicts.map((conflict, index) => (
                                        <li key={index} className="p-3 bg-white rounded-lg shadow-sm border-l-4 border-red-500">
                                            <p className="font-semibold text-gray-800">{conflict.judul} (No Reg: {conflict.noReg})</p>
                                            <p className="text-sm text-red-600 flex items-center mt-1">
                                                <Clock className="w-4 h-4 mr-1" />
                                                {conflict.timeStart} - {conflict.timeEnd} 
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">Tgl Penuh: {formatDisplayDate(conflict.dateStart)} s/d {formatDisplayDate(conflict.dateEnd)}</p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-green-600 font-semibold mt-5 flex items-center">
                                    <CheckCircle className="w-4 h-4 mr-2" /> Kelas Tersedia Sepenuhnya di Tanggal ini.
                                </p>
                            )}
                            
                        </div>
                    ) : (
                        <p className="text-gray-500 italic mt-5 flex items-center">
                            <Info className="w-4 h-4 mr-2" /> Klik tanggal terbooking (merah) di kalender untuk melihat detail jadwal.
                        </p>
                    )}
                    
                    <button onClick={onClose} className="mt-8 w-full py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition">Tutup Kalender</button>
                </div>
            </div>
        </div>
    );
};

// --- KOMPONEN UTAMA TRAINING ROOM ---
const TrainingRoom = () => {
    const [scheduledTrainings, setScheduledTrainings] = useState([]);
    const [isLoading, setIsLoading] = useState(false); 
    const [error, setError] = useState(null);
    const now = useMemo(() => new Date(), []); // Waktu saat ini secara akurat
    const todayString = now.toISOString().split("T")[0]; // Tanggal hari ini YYYY-MM-DD

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null); 

    // --- FUNGSI UTAMA: AMBIL JADWAL APPROVED/IMPLEMENTED DARI FIRESTORE ---
    const fetchSchedules = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const q = query(
                collection(db, 'trainingapp'), 
                where('status', 'in', ['approved', 'Implemented'])
            );
            const snapshot = await getDocs(q);
            
            // 💡 FILTER WAKTU SELESAI PENUH DI SINI:
            const schedules = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    room: data.kelasTraining,
                    dateStart: data.tanggalMulai, 
                    dateEnd: data.tanggalSelesai, 
                    timeStart: data.jamMulai,      
                    timeEnd: data.jamSelesai,      
                    judul: data.judulTraining,
                    noReg: data.noReg
                };
            }).filter(s => {
                // Buat objek waktu selesai penuh dari string Firestore
                const finishDateTimeString = `${s.dateEnd}T${s.timeEnd}`;
                const finishTime = new Date(finishDateTimeString);
                
                // Jadwal masih relevan jika waktu selesainya belum lewat
                return finishTime > now;
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

    // --- FUNGSI BARU: BUKA MODAL KALENDER ---
    const openCalendar = (roomName) => {
        setSelectedRoom(roomName);
        setModalOpen(true);
    };

    // --- FUNGSI MENDAPATKAN DETAIL BENTROK RINGKAS HARI INI (Untuk status tabel) ---
    const getConflictsToday = (roomName) => {
        const dateToday = createLocalDate(todayString); 
        
        // Cek apakah ada jadwal yang masih berlaku HARI INI
        const conflictsToday = scheduledTrainings.filter(s => {
            if (s.room !== roomName) return false;
            
            const dateScheduledStart = createLocalDate(s.dateStart);
            const dateScheduledEnd = createLocalDate(s.dateEnd);

            // Kondisi bentrok HARI INI: Tanggal mulai <= Hari Ini DAN Tanggal Akhir >= Hari Ini
            return dateToday >= dateScheduledStart && dateToday <= dateScheduledEnd;
        });

        return conflictsToday;
    };


    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-lg text-blue-600 flex items-center">
                    <RefreshCw className="w-6 h-6 mr-3 animate-spin" /> Memuat jadwal ruangan...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-lg text-red-600 flex items-center">
                    <XCircle className="w-6 h-6 mr-3" /> Error: {error}
                </p>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-gray-50 flex justify-center pt-24 pb-12 px-4">
            <HRHeader />
            <div className="w-full max-w-5xl bg-white shadow-xl rounded-xl p-8">
                <h2 className="text-2xl font-bold text-center text-blue-800 mb-6 border-b pb-3">
                    Daftar Ketersediaan Training Room
                </h2>

                <div className="flex flex-col sm:flex-row justify-center items-center text-sm text-gray-600 mb-6 space-y-2 sm:space-y-0 sm:space-x-4">
                    <p className="flex items-center"><Calendar className="w-4 h-4 mr-1 text-blue-500" /> Tanggal Hari Ini: <span className="font-semibold ml-1">{formatDisplayDate(todayString)}</span></p>
                    <p className="flex items-center"><Clock className="w-4 h-4 mr-1 text-blue-500" /> Waktu Saat Ini: <span className="font-semibold ml-1">{now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span></p>
                    <button onClick={fetchSchedules} className="px-4 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition flex items-center text-xs">
                         <RefreshCw className="w-4 h-4 mr-2" /> Refresh Jadwal
                    </button>
                </div>

                <div className="overflow-x-auto mt-4 border border-gray-200 rounded-lg shadow-sm">
                    <table className="w-full min-w-[700px]">
                        <thead className="bg-blue-700 text-white">
                            <tr>
                                <th className="px-4 py-3 text-left w-1/4">Nama Ruangan</th>
                                <th className="px-4 py-3 text-center w-1/5">Kapasitas</th>
                                <th className="px-4 py-3 text-center w-1/5">Status Hari Ini</th>
                                <th className="px-4 py-3 text-center w-1/5">Lihat Jadwal Penuh</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {masterRooms.map((room) => {
                                const conflicts = getConflictsToday(room.name);
                                const isUsed = conflicts.length > 0;
                                const statusText = isUsed ? "Terpakai" : "Kosong";
                                const statusClass = isUsed ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700";

                                return (
                                    <tr
                                        key={room.name}
                                        className={`odd:bg-white even:bg-gray-50 hover:bg-blue-50 transition`}
                                    >
                                        <td className="px-4 py-3 font-semibold text-gray-800 border-r align-top">
                                            <Building className="w-4 h-4 inline mr-2 text-blue-600"/>
                                            {room.name}
                                        </td>
                                        <td className="px-4 py-3 text-center text-gray-600 border-r align-top">
                                            {room.capacity} orang
                                        </td>
                                        <td className="px-4 py-3 text-center border-r align-top">
                                            <span className={`px-3 py-1 rounded-full text-xs ${statusClass} inline-flex items-center justify-center`}>
                                                {isUsed ? <XCircle className="w-3 h-3 mr-1" /> : <CheckCircle className="w-3 h-3 mr-1" />}
                                                {statusText}
                                            </span>
                                            {isUsed && <p className="text-xs text-red-500 mt-1">({conflicts.length} bentrok)</p>}
                                        </td>
                                        <td className="px-4 py-3 text-center align-top">
                                            <button 
                                                onClick={() => openCalendar(room.name)}
                                                className="py-1 px-3 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center mx-auto"
                                            >
                                                <Calendar className="w-4 h-4 mr-1" /> Kalender
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                
                {/* Footer */}
                <div className="mt-6 text-sm text-gray-600">
                    <p>* Keterangan: Jadwal tertera adalah yang sudah Approved atau Implemented.</p>
                </div>
            </div>
            
            {/* Tampilkan Modal Kalender jika aktif */}
            {modalOpen && selectedRoom && (
                <CalendarModal 
                    roomName={selectedRoom} 
                    allSchedules={scheduledTrainings} 
                    today={todayString} // Kirim tanggal hari ini
                    onClose={() => setModalOpen(false)} 
                />
            )}

        </div>
    );
};

export default TrainingRoom;