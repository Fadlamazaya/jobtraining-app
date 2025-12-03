import React, { useState, useEffect, useCallback } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { CheckCircle, Clock, Award, XCircle, RefreshCw, Users, TrendingUp, Briefcase } from 'lucide-react'; 

// --- FUNGSI UTILITY ---

// FUNGSI UNTUK CEK JIKA TANGGAL SELESAI SUDAH LEWAT (DONE)
const isTrainingDateDone = (endDateString) => {
    if (!endDateString) return false;
    
    try {
        const endDate = new Date(endDateString);
        const today = new Date();
        
        today.setHours(0, 0, 0, 0); 
        endDate.setHours(0, 0, 0, 0);

        return endDate < today;
    } catch (e) {
        console.error("Error parsing date for isTrainingDateDone:", e);
        return false;
    }
};

// --- KOMPONEN BAR CHART KUSTOM ---
const PositionBarChart = ({ summary, totalEmployees }) => {
    const data = [
        { name: 'FO', value: summary.FO, color: 'bg-blue-500' },
        { name: 'DO', value: summary.DO, color: 'bg-indigo-500' },
        { name: 'SL / SPV', value: summary.SLSPV, color: 'bg-yellow-500' },
        { name: 'Manager', value: summary.Manager, color: 'bg-green-500' },
    ];

    if (totalEmployees === 0) return <p className="text-center text-gray-500 mt-4">Tidak ada data posisi karyawan.</p>;

    return (
        <div className="space-y-4">
            {data.map((item) => {
                const percentage = totalEmployees > 0 ? (item.value / totalEmployees * 100) : 0;
                
                return (
                    <div key={item.name} className="flex flex-col">
                        <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                            <span>{item.name} ({item.value})</span>
                            <span>{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                                className={`h-3 rounded-full transition-all duration-1000 ease-out ${item.color}`} 
                                style={{ width: `${percentage}%` }}
                                title={`${item.value} karyawan (${percentage.toFixed(1)}%)`}
                            ></div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};


// --- KOMPONEN STATUS CARD TRAINING ---

const StatusCard = ({ title, count, color, icon: Icon, totalEmployees }) => {
    const formattedPercentage = totalEmployees > 0 ? (count / totalEmployees * 100).toFixed(1) : 0;
    
    // Logic untuk menentukan warna ikon yang lebih aman
    const iconColorClass = color.includes('green') ? 'text-green-600' : 
                           color.includes('yellow') ? 'text-yellow-600' : 
                           color.includes('blue') ? 'text-blue-600' : 
                           color.includes('gray') ? 'text-gray-600' : 'text-red-600';
    
    return (
        <div className={`p-5 rounded-xl shadow-lg border-t-4 ${color} transition duration-300 hover:shadow-xl`}>
            <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-gray-800">
                    {count}
                </div>
                <Icon className={`w-8 h-8 opacity-70 ${iconColorClass}`} />
            </div>
            <p className="mt-1 text-sm font-medium text-gray-500">{title}</p>
            <div className="mt-2 text-xs font-semibold">
                {formattedPercentage}% dari total karyawan
            </div>
        </div>
    );
};


// --- KOMPONEN UTAMA DASHBOARD ---

export default function TrainingSummaryDashboard() {
    const [summary, setSummary] = useState({
        totalEmployees: 0,
        pending: 0,
        approved: 0, 
        implemented: 0, 
        done: 0, 
        notRegistered: 0,
    });
    const [positionSummary, setPositionSummary] = useState({
        FO: 0, DO: 0, SLSPV: 0, Manager: 0, total: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDataSummary = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // 1. Ambil SEMUA training yang relevan
            const trainingQuery = query(
                collection(db, "trainingapp"),
                where("status", "in", ["pending", "approved", "Implemented"])
            );
            const trainingSnapshot = await getDocs(trainingQuery);
            
            const allRelevantTrainings = trainingSnapshot.docs.flatMap(doc => {
                const data = doc.data();
                return data.participants.map(p => ({
                    nik: p.nik,
                    tanggalSelesai: data.tanggalSelesai,
                    statusTraining: data.status, 
                }));
            });

            // 2. Ambil SEMUA Karyawan 
            const usersCollection = collection(db, "users");
            const userSnapshot = await getDocs(usersCollection);
            
            const usersList = userSnapshot.docs.map(doc => ({
                nik: doc.data().nik,
                position: doc.data().position // Ambil data posisi
            }));
            
            const totalEmployees = usersList.length;

            // --- A. Hitung Status Training ---
            let trainingCounts = { pending: 0, approved: 0, implemented: 0, done: 0, registered: 0 };
            const nikProcessed = new Set(); 

            usersList.forEach(user => {
                const userTrainings = allRelevantTrainings
                    .filter(training => training.nik === user.nik)
                    .sort((a, b) => new Date(b.tanggalMulai) - new Date(a.tanggalMulai)); 
                
                if (userTrainings.length > 0) {
                    const latestTraining = userTrainings[0];
                    if (nikProcessed.has(user.nik)) return; 

                    trainingCounts.registered++;

                    const isDone = isTrainingDateDone(latestTraining.tanggalSelesai);
                    
                    if (isDone) {
                        trainingCounts.done++;
                    } else if (latestTraining.statusTraining === 'Implemented') {
                        trainingCounts.implemented++;
                    } else if (latestTraining.statusTraining === 'approved') {
                        trainingCounts.approved++;
                    } else if (latestTraining.statusTraining === 'pending') {
                        trainingCounts.pending++;
                    }
                    nikProcessed.add(user.nik);
                }
            });

            // --- B. Hitung Ringkasan Posisi ---
            let posCounts = { FO: 0, DO: 0, SLSPV: 0, Manager: 0, total: totalEmployees };
            usersList.forEach(user => {
                const position = user.position;
                if (position === "FO") {
                    posCounts.FO++;
                } else if (position === "DO") {
                    posCounts.DO++;
                } else if (position === "SL" || position === "SL/SPV") {
                    posCounts.SLSPV++;
                } else if (position === "Manager") {
                    posCounts.Manager++;
                }
            });
            
            // Set State
            setSummary({
                totalEmployees,
                pending: trainingCounts.pending,
                approved: trainingCounts.approved,
                implemented: trainingCounts.implemented,
                done: trainingCounts.done,
                notRegistered: totalEmployees - trainingCounts.registered,
            });

            setPositionSummary(posCounts);

        } catch (err) {
            console.error("Error fetching data for dashboard:", err);
            setError("Gagal memuat ringkasan data dari Firebase.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDataSummary();
    }, [fetchDataSummary]);

    if (loading) {
        return (
            <div className="p-6 text-center text-gray-500 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                Memuat ringkasan data training dan posisi...
            </div>
        );
    }

    if (error) {
        return <div className="p-6 text-center text-red-600">Error: {error}</div>;
    }

    return (
        <div className="p-6">
            <div className="bg-white p-6 rounded-xl shadow-2xl">
                <h2 className="text-3xl font-bold mb-4 text-blue-700">Dashboard Karyawan & Status Training Global </h2>
                <p className="text-gray-600 mb-6">Total Karyawan yang dipantau: <span className="font-bold text-lg text-blue-600">{summary.totalEmployees}</span></p>

                {/* === BLOCK 1: STATUS TRAINING === */}
                <h3 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-blue-500"/> Ringkasan Status Training
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
                    {/* Card Total Karyawan */}
                    <div className="p-5 rounded-xl shadow-lg border-t-4 border-purple-500 bg-purple-50 text-center">
                        <Users className="w-10 h-10 mx-auto text-purple-600 mb-2" />
                        <p className="text-3xl font-extrabold text-purple-800">{summary.totalEmployees}</p>
                        <p className="mt-1 text-sm font-semibold text-purple-600">Total Karyawan</p>
                    </div>

                    {/* Status Card: Implemented/Final */}
                    <StatusCard 
                        title="Implemented/Final" 
                        count={summary.implemented} 
                        color="border-green-500 bg-green-50"
                        icon={TrendingUp}
                        totalEmployees={summary.totalEmployees}
                    />
                    
                    {/* Status Card: Approved Manager */}
                    <StatusCard 
                        title="Approved Manager" 
                        count={summary.approved} 
                        color="border-blue-500 bg-blue-50"
                        icon={Award}
                        totalEmployees={summary.totalEmployees}
                    />
                    
                    {/* Status Card: Pending */}
                    <StatusCard 
                        title="Pending Approval" 
                        count={summary.pending} 
                        color="border-yellow-500 bg-yellow-50"
                        icon={Clock}
                        totalEmployees={summary.totalEmployees}
                    />

                    {/* Status Card: Belum Terdaftar */}
                    <StatusCard 
                        title="Belum Terdaftar" 
                        count={summary.notRegistered} 
                        color="border-red-500 bg-red-50"
                        icon={XCircle}
                        totalEmployees={summary.totalEmployees}
                    />

                    {/* Status Card: Done/Selesai (Di bagian terpisah) */}
                    <div className="lg:col-span-5 pt-4">
                        <div className="p-4 rounded-xl shadow-md border-l-4 border-gray-600 bg-gray-50 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                                    <CheckCircle className="w-5 h-5 mr-2 text-gray-600" />
                                    Done / Sudah Selesai Training
                                </h3>
                                <p className="text-sm text-gray-600">Karyawan yang training terakhirnya sudah melewati tanggal selesai.</p>
                            </div>
                            <div className="text-3xl font-extrabold text-gray-700">
                                {summary.done}
                                <span className="block text-sm font-semibold mt-1">
                                    {(summary.totalEmployees > 0 ? (summary.done / summary.totalEmployees * 100).toFixed(1) : 0)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* === BLOCK 2: STATISTIK POSISI KOMPETENSI (Bar Chart) === */}
                <h3 className="text-xl font-semibold mb-4 text-gray-700 flex items-center pt-6 border-t mt-4">
                    <Briefcase className="w-5 h-5 mr-2 text-blue-500"/> Distribusi Posisi Kompetensi
                </h3>
                <div className="bg-gray-50 p-6 rounded-xl shadow-inner">
                    <PositionBarChart summary={positionSummary} totalEmployees={summary.totalEmployees} />
                </div>
                
                <div className="mt-8 text-center">
                    <button
                        onClick={fetchDataSummary}
                        className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center space-x-2 mx-auto"
                        disabled={loading}
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        <span>Perbarui Ringkasan Data</span>
                    </button>
                </div>
            </div>
        </div>
    );
}