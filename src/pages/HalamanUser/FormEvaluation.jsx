// src/pages/hr/FormEvaluation.jsx (Perbaikan Scope Variabel 'today')
import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; 
import HRHeader from "../../components/HalamanHR/HRHeader";
import { ClipboardCheck, Download, Calendar, Clock } from 'lucide-react';

// Variabel today (YYYY-MM-DD) didefinisikan di luar komponen agar dapat digunakan di mana saja
const TODAY_STRING = new Date().toISOString().split('T')[0]; 

const FormEvaluation = () => {
    const [completedTrainings, setCompletedTrainings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchCompletedTrainings = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Kita ambil semua dokumen yang sudah 'Approved'
            const q = query(
                collection(db, 'trainingapp'), 
                where('status', '==', 'Approved'),
                orderBy('tanggalSelesai', 'desc') // Urutkan berdasarkan tanggal selesai
            );
            
            const snapshot = await getDocs(q);
            const trainings = [];

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                
                // Logika: Hanya tampilkan jika TANGGAL SELESAI SUDAH TERLEWATI 
                // Menggunakan TODAY_STRING yang didefinisikan di luar
                const isTrainingComplete = data.tanggalSelesai <= TODAY_STRING;

                if (isTrainingComplete) {
                    trainings.push({
                        id: doc.id,
                        ...data,
                        traineeCount: (data.participants || []).filter(p => p.role === 'T').length
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
    }, []);

    // Placeholder Function untuk Download Evaluasi
    const handleDownloadEvaluation = (training) => {
        const { judulTraining, noReg } = training;
        alert(`Mendownload Form Evaluasi untuk: ${judulTraining} (No. Reg: ${noReg}).\n\n(Implementasi pembuatan PDF/Doc Evaluasi diperlukan di sini)`);
        
        const evaluationData = [
            ["Kriteria", "Nilai", "Komentar"],
            ["Materi Pelatihan", "4/5", "Relevan dengan kebutuhan unit."],
        ];
        console.table(evaluationData);
    };

    // Helper untuk memformat tanggal YYYY-MM-DD menjadi DD/MM/YYYY
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
                    Form Evaluasi Kinerja Training
                </h2>

                {error && <div className="p-4 bg-red-100 text-red-700 rounded-lg mb-6">{error}</div>}

                {completedTrainings.length === 0 ? (
                    <p className="text-gray-500 italic p-6 bg-blue-50 rounded-lg border border-blue-200 text-center">
                        Tidak ada pelatihan yang sudah selesai dan siap dievaluasi saat ini.
                    </p>
                ) : (
                    <div className="space-y-6">
                        <p className="text-sm text-gray-600 font-medium">
                            Daftar pelatihan yang tanggal selesainya ({formatDate(TODAY_STRING)}) sudah terlewati dan memerlukan evaluasi akhir.
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
                                        {training.totalJam.toFixed(1)} jam
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        No. Reg: {training.noReg} | Area: {training.area}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDownloadEvaluation(training)}
                                    className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition flex items-center"
                                >
                                    <Download className="w-5 h-5 mr-2" />
                                    Download Form Evaluasi ({training.traineeCount} Peserta)
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FormEvaluation;