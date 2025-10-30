// src/pages/hr/FormEvaluation.jsx (Koreksi Logika Waktu Selesai & Impor)
import React, { useState, useEffect, useMemo } from "react"; 
// ^^^ PERBAIKAN KRITIS: useMemo ditambahkan ^^^
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; 
import HRHeader from "../../components/HalamanHR/HRHeader";
import EvaluationPDF from "./EvaluationPDF"; 
import { ClipboardCheck, Download, Calendar, Clock } from 'lucide-react'; 

// Fungsi Helper untuk membuat objek Date di Local Time (untuk perbandingan yang akurat)
const createLocalDate = (dateString) => {
    // Memastikan format YYYY-MM-DD
    const [year, month, day] = dateString.split('-').map(Number);
    // return new Date(year, month - 1, day); // Tidak digunakan di sini, tapi dipertahankan untuk konsistensi Timezone
    return new Date(dateString); // Untuk perbandingan Date-Time penuh, string ISO lebih aman
};

const FormEvaluation = () => {
    const [completedTrainings, setCompletedTrainings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Dapatkan waktu saat ini secara akurat saat komponen dimuat (gunakan useMemo/useState)
    const now = useMemo(() => new Date(), []); 
    const TODAY_STRING_DISPLAY = now.toLocaleDateString('id-ID'); // Untuk tampilan

    const fetchCompletedTrainings = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const q = query(
                collection(db, 'trainingapp'), 
                // Status harus 'Approved' atau 'Implemented' untuk dievaluasi
                where('status', 'in', ['approved', 'Implemented']),
                orderBy('tanggalSelesai', 'desc') 
            );
            
            const snapshot = await getDocs(q);
            const trainings = [];

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                
                // 1. BUAT OBJEK WAKTU SELESAI PENUH
                // Format: YYYY-MM-DD T HH:MM (Misal: 2025-10-30T11:00)
                // Ini akan diinterpretasikan sebagai waktu lokal (WIB) karena tidak ada Z di akhirnya.
                const finishDateTimeString = `${data.tanggalSelesai}T${data.jamSelesai}`;
                const finishTime = new Date(finishDateTimeString); 
                
                // 2. BANDINGKAN WAKTU SELESAI dengan WAKTU SAAT INI
                // Pelatihan selesai jika waktu selesai (finishTime) sudah terlewati (lebih kecil dari now)
                const isTrainingComplete = finishTime <= now;

                if (isTrainingComplete) {
                    trainings.push({
                        id: doc.id,
                        ...data,
                        participants: data.participants || [], 
                        namaInstruktur: data.instrukturDetails?.[0]?.nama || data.namaInstruktur || 'N/A'
                    });
                }
            });

            setCompletedTrainings(trainings);

        } catch (err) {
            console.error("Firebase Query Failed in FormEvaluation:", err);
            setError("Gagal memuat daftar training. Cek konsol browser.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCompletedTrainings();
        // Hanya fetch sekali saat komponen dimuat
    }, []); 

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const [year, month, day] = dateString.split('-');
            return `${day}/${month}/${year}`;
        } catch (e) {
            return dateString;
        }
    };
    
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-6 h-6 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 px-6 pt-24 pb-12 flex justify-center">
            <HRHeader /> 
            <div className="w-full max-w-5xl bg-white shadow-lg rounded-2xl p-8">
                <h2 className="text-3xl font-bold text-center text-indigo-700 mb-8 border-b pb-4 flex items-center justify-center">
                    <ClipboardCheck className="w-7 h-7 mr-3 text-indigo-500" />
                    Form Evaluasi Kinerja Trainer
                </h2>

                {error && <div className="p-4 bg-red-100 text-red-700 rounded-lg mb-6">{error}</div>}

                {completedTrainings.length === 0 ? (
                    <p className="text-gray-500 italic p-6 bg-blue-50 rounded-lg border border-blue-200 text-center">
                        Tidak ada pelatihan yang sudah selesai dan siap dievaluasi saat ini (Waktu saat ini: {TODAY_STRING_DISPLAY} {now.toLocaleTimeString()}).
                    </p>
                ) : (
                    <div className="space-y-6">
                        <p className="text-sm text-gray-600 font-medium">
                            Daftar pelatihan yang sudah selesai dan memerlukan evaluasi akhir:
                        </p>
                        
                        {completedTrainings.map((training) => (
                            <div key={training.id} className="p-5 border-l-4 border-indigo-500 bg-white shadow-md rounded-lg flex justify-between items-center transition hover:shadow-lg">
                                <div>
                                    <h4 className="font-bold text-xl text-indigo-800">{training.judulTraining}</h4>
                                    <p className="text-sm text-gray-500 mt-1">
                                        <Calendar className="w-4 h-4 inline mr-1" />
                                        {formatDate(training.tanggalMulai)} s/d {formatDate(training.tanggalSelesai)} 
                                        <span className="mx-2">|</span>
                                        <Clock className="w-4 h-4 inline mr-1" />
                                        {training.jamMulai} - {training.jamSelesai} ({training.totalJam ? training.totalJam.toFixed(1) : '0.0'} jam)
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        No. Reg: {training.noReg} | Area: {training.area}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Instruktur: {training.namaInstruktur}
                                    </p>
                                </div>
                                
                                {/* PANGGIL KOMPONEN EvaluationPDF */}
                                <EvaluationPDF 
                                    participants={training.participants} 
                                    trainingData={training}
                                />
                                
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FormEvaluation;