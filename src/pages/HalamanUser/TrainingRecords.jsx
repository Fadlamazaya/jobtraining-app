// src/pages/hr/TrainingRecords.jsx (Dikelompokkan Berdasarkan Nama Training - FINAL dengan Search)
import React, { useState, useEffect, useMemo } from "react"; 
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'; 
import { db } from '../../firebaseConfig'; 
import HRHeader from "../../components/HalamanHR/HRHeader";
import { ListChecks, Clock, Calendar, Users, CheckCircle, Search } from 'lucide-react'; // Import Search

const TrainingRecords = () => {
    const [trainingRecords, setTrainingRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(''); // State untuk search input

    // Dapatkan waktu saat ini secara akurat
    const now = useMemo(() => new Date(), []);
    
    // Helper untuk memformat tanggal YYYY-MM-DD menjadi DD/MM/YYYY
    const formatDate = (dateString) => {
        if (!dateString || dateString === 'N/A') return 'N/A';
        try {
            const [year, month, day] = dateString.split('-');
            return `${day}/${month}/${year}`;
        } catch (e) {
            return dateString;
        }
    };


    const fetchTrainingRecords = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // QUERY: Ambil semua data yang sudah Approved atau Implemented
            const q = query(
                collection(db, 'trainingapp'), 
                where('status', 'in', ['approved', 'Implemented']),
                orderBy('createdAt', 'desc') 
            );
            
            const snapshot = await getDocs(q);
            const records = [];

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const regId = doc.id;
                
                // 1. BUAT OBJEK WAKTU SELESAI PENUH
                const finishDateTimeString = `${data.tanggalSelesai}T${data.jamSelesai}`;
                const finishTime = new Date(finishDateTimeString); 
                
                // 2. FILTER WAKTU: Pelatihan dianggap selesai jika waktu selesai SUDAH LEWAT
                const isTrainingComplete = finishTime <= now;

                if (isTrainingComplete) {
                    records.push({
                        regId: regId,
                        noReg: data.noReg || 'N/A', 
                        judulTraining: data.judulTraining,
                        area: data.area,
                        kelasTraining: data.kelasTraining, 
                        totalJam: data.totalJam || 0,
                        
                        // Instruktur Utama
                        instruktur: data.namaInstruktur || data.instrukturDetails?.[0]?.nama || 'N/A', 
                        
                        // Daftar Peserta UTUH
                        participants: data.participants || [],
                        
                        tanggalSelesaiOriginal: data.tanggalSelesai,
                        tanggalMulaiOriginal: data.tanggalMulai,
                    });
                }
            });

            setTrainingRecords(records);
        } catch (err) {
            console.error("Firebase Query Failed. ERROR:", err);
            setError("Gagal memuat data riwayat training dari database. Silakan cek konsol browser untuk detail."); 
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTrainingRecords();
    }, [now]); 
    
    // 💡 FUNGSI FILTER DATA BERDASARKAN SEARCH TERM
    const filteredRecords = useMemo(() => {
        if (!searchTerm) return trainingRecords;

        const lowerCaseSearch = searchTerm.toLowerCase();

        return trainingRecords.filter(record => {
            // Cek Judul Training atau No. Reg
            const matchesTraining = 
                record.judulTraining.toLowerCase().includes(lowerCaseSearch) ||
                record.noReg.toLowerCase().includes(lowerCaseSearch);

            if (matchesTraining) return true;

            // Cek di setiap Peserta (Nama atau NIK)
            const matchesParticipant = record.participants.some(p => 
                p.nama.toLowerCase().includes(lowerCaseSearch) ||
                p.nik.toLowerCase().includes(lowerCaseSearch)
            );

            return matchesParticipant;
        });
    }, [trainingRecords, searchTerm]);
    

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-blue-600 font-medium flex items-center">
                    <div className="w-6 h-6 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mr-3"></div>
                    Memuat riwayat training...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 px-6 pt-24 pb-12 flex justify-center">
            <HRHeader /> 
            <div className="w-full max-w-6xl bg-white shadow-lg rounded-2xl p-8">
                <h2 className="text-3xl font-bold text-center text-blue-800 mb-8 border-b pb-4 flex items-center justify-center">
                    <ListChecks className="w-7 h-7 mr-3 text-green-600" />
                    Riwayat Training Karyawan (Approved & Completed)
                </h2>

                {error && (
                    <div className="p-4 bg-red-100 text-red-700 rounded-lg mb-6 text-center font-medium">
                        {error} 
                    </div>
                )}
                
                {/* --- SEARCH BAR --- */}
                <div className="mb-6 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Cari Judul Training, Nama Peserta, atau NIK..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {/* --- END SEARCH BAR --- */}

                
                <p className="text-sm text-gray-600 mb-4">
                    Data yang ditampilkan adalah riwayat training yang sudah disetujui dan telah selesai (lewat tanggal dan jam selesainya). Total **{filteredRecords.length} Training Selesai** ditemukan.
                </p>

                {filteredRecords.length === 0 && !error ? (
                    <p className="text-gray-500 italic p-6 bg-yellow-50 rounded-lg border border-yellow-200 text-center">
                        Tidak ditemukan riwayat training yang telah selesai dan memenuhi syarat.
                    </p>
                ) : (
                    <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-blue-700 to-blue-500 text-white"> 
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold w-1/5">Judul Training</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold w-1/4">Peserta & NIK/Unit</th> {/* Header Diperluas */}
                                    <th className="px-4 py-3 text-left text-sm font-semibold w-1/6">Instruktur</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold w-auto">Kelas & Area</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold w-1/6">Periode</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold w-auto">Total Jam</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredRecords.map((record) => (
                                    <tr key={record.regId} className="hover:bg-gray-50 transition">
                                        
                                        {/* KOLOM 1: JUDUL */}
                                        <td className="px-4 py-4 text-sm font-medium text-blue-700 align-top">
                                            {record.judulTraining}
                                            <p className="text-xs text-gray-500 mt-1">No. Reg: {record.noReg}</p>
                                        </td>
                                        
                                        {/* KOLOM 2: PESERTA & NIK (List Bernomor + Unit) */}
                                        <td className="px-4 py-4 text-sm text-gray-900 align-top">
                                            <ol className="list-decimal list-inside space-y-1">
                                                {(record.participants || []).map((p, pIndex) => (
                                                    <li key={pIndex} className="text-xs text-gray-700">
                                                        {p.nama} (<span className="text-xs text-blue-600">{p.role}</span>)
                                                        <p className="text-xs text-gray-500 pl-4">Unit: {p.unit}</p> 
                                                        <p className="text-xs text-gray-500 pl-4">NIK: {p.nik}</p>
                                                    </li>
                                                ))}
                                            </ol>
                                        </td>
                                        
                                        {/* KOLOM 3: INSTRUKTUR */}
                                        <td className="px-4 py-4 text-sm text-gray-700 align-top">
                                            <Users className="w-4 h-4 inline mr-1 text-green-600" /> {record.instruktur}
                                        </td>

                                        {/* KOLOM 4: KELAS & AREA */}
                                        <td className="px-4 py-4 text-sm text-center align-top">
                                            <p className="font-semibold">{record.kelasTraining}</p>
                                            <p className="text-xs text-gray-500 mt-1">({record.area})</p> 
                                        </td>

                                        {/* KOLOM 5: PERIODE */}
                                        <td className="px-4 py-4 text-sm text-center align-top">
                                            <Calendar className="w-4 h-4 inline mr-1 text-green-500" />
                                            {formatDate(record.tanggalMulaiOriginal)} - {formatDate(record.tanggalSelesaiOriginal)}
                                        </td>

                                        {/* KOLOM 6: TOTAL JAM */}
                                        <td className="px-4 py-4 text-sm text-center font-medium align-top">
                                            <Clock className="w-4 h-4 inline mr-1 text-orange-500" />
                                            {record.totalJam.toFixed(1)} jam
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrainingRecords;