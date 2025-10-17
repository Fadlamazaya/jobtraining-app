// src/pages/hr/TrainingRecords.jsx 
import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'; 
import { db } from '../../firebaseConfig'; 
import HRHeader from "../../components/HalamanHR/HRHeader";
import { ListChecks, Clock, Calendar, Users } from 'lucide-react';

const TrainingRecords = () => {
    const [trainingRecords, setTrainingRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTrainingRecords = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // QUERY MENCARI SEMUA YANG APPROVED, diurutkan DESCENDING (Membutuhkan Index Komposit)
            const q = query(
                collection(db, 'trainingapp'), 
                where('status', '==', 'Approved'),
                orderBy('createdAt', 'desc') 
            );
            
            const snapshot = await getDocs(q);
            const records = [];

            // Memecah (unroll) data per peserta
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const regId = doc.id;
                
                (data.participants || []).forEach(participant => {
                    records.push({
                        regId: regId,
                        noReg: data.noReg || 'N/A', 
                        judulTraining: data.judulTraining,
                        area: data.area,
                        totalJam: data.totalJam || 0,
                        
                        // Data Peserta dan Instruktur
                        nama: participant.nama,
                        nik: participant.nik,
                        role: participant.role,
                        unit: participant.unit,
                        instruktur: data.namaInstruktur || 'N/A',
                        
                        tanggalSelesaiOriginal: data.tanggalSelesai,
                    });
                });
            });

            setTrainingRecords(records);
        } catch (err) {
            console.error("Firebase Query Failed. ERROR:", err);
            // Pesan error di UI mengarahkan ke konsol
            setError("Gagal memuat data riwayat training dari database. Silakan cek konsol browser untuk petunjuk Indexing."); 
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTrainingRecords();
    }, []);
    
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
                    Riwayat Training Karyawan (Approved)
                </h2>

                {error && (
                    <div className="p-4 bg-red-100 text-red-700 rounded-lg mb-6 text-center font-medium">
                        {error} 
                    </div>
                )}
                
                {trainingRecords.length === 0 && !error ? (
                    <p className="text-gray-500 italic p-6 bg-yellow-50 rounded-lg border border-yellow-200 text-center">
                        Tidak ditemukan riwayat training yang berstatus 'Approved' saat ini.
                    </p>
                ) : (
                    <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-green-600 to-green-500 text-white">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Nama Peserta</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">NIK</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Judul Training</th>
                                    <th className="px-4 py-3 text-center text-sm font-medium">Instruktur</th>
                                    <th className="px-4 py-3 text-center text-sm font-medium">Unit/Area</th>
                                    <th className="px-4 py-3 text-center text-sm font-medium">Total Jam</th>
                                    <th className="px-4 py-3 text-center text-sm font-medium">Tanggal Selesai</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {trainingRecords.map((record, index) => (
                                    <tr key={record.regId + record.nik} className="hover:bg-gray-50 transition">
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center">
                                            <Users className="w-4 h-4 mr-2 text-blue-500"/>
                                            **{record.nama}** ({record.role})
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{record.nik}</td>
                                        <td className="px-4 py-4 text-sm text-blue-700">{record.judulTraining}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center">{record.instruktur}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center">{record.unit}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-medium">
                                            <Clock className="w-4 h-4 inline mr-1 text-orange-500" />
                                            {record.totalJam.toFixed(1)} jam
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                                            <Calendar className="w-4 h-4 inline mr-1 text-green-500" />
                                            {formatDate(record.tanggalSelesaiOriginal)}
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