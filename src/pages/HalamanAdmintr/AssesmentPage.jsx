import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; 
import { Search, Save, Edit2, Check, X, Filter, RefreshCw, ArrowLeft, Users } from 'lucide-react';

const AssessmentPage = () => {
    // State untuk menampung semua data registrasi yang disetujui
    const [registrations, setRegistrations] = useState([]);
    // State untuk menampung data registrasi yang sudah difilter (untuk tampilan daftar training)
    const [filteredRegistrations, setFilteredRegistrations] = useState([]); 
    
    // State untuk mode drill-down
    const [selectedRegistration, setSelectedRegistration] = useState(null); // Objek Registrasi yang dipilih
    
    // State untuk fungsionalitas grading
    const [participants, setParticipants] = useState([]); // Peserta dari selectedRegistration (Hanya Trainee)
    const [filteredParticipants, setFilteredParticipants] = useState([]); 
    
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(''); // Digunakan untuk mencari Training
    const [filterStatus, setFilterStatus] = useState('all'); // Digunakan untuk memfilter Peserta
    const [editingId, setEditingId] = useState(null); 
    const [editValues, setEditValues] = useState({ pretest: '', posttest: '' });
    const [successMessage, setSuccessMessage] = useState('');

    // Mengambil data dari Firestore (hanya yang sudah disetujui)
    const fetchRegistrations = useCallback(async () => {
        setIsLoading(true);
        try {
            const collectionRef = collection(db, 'trainingapp'); 
            
            // Filter: Ambil data yang sudah 'approved' Manager ATAU sudah di-Implemented HR
            const q = query(collectionRef, where('status', 'in', ['approved', 'Implemented']));
            
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                regId: doc.id,
                participants: doc.data().participants || [],
                trainingName: doc.data().judulTraining,
                trainingDate: doc.data().tanggalMulai,
                totalTrainees: doc.data().participants.filter(p => p.role === 'T').length // Menghitung Trainee
            }));

            setRegistrations(data);
        } catch (error) {
            console.error('Error fetching registrations:', error);
            alert("Gagal memuat daftar training dari Firestore.");
            setRegistrations([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRegistrations();
    }, [fetchRegistrations]);
    
    // 💡 FILTER BARU: Filter Daftar Training (registrations) berdasarkan search bar
    useEffect(() => {
        let filteredReg = registrations;

        if (searchTerm) {
            filteredReg = filteredReg.filter(reg => 
                reg.regId.toLowerCase().includes(searchTerm.toLowerCase()) || // Cari berdasarkan No Reg
                reg.trainingDate.includes(searchTerm)                       // Cari berdasarkan Tanggal
            );
        }

        setFilteredRegistrations(filteredReg);
    }, [searchTerm, registrations]);


    // Memuat daftar peserta Trainee ketika registrasi dipilih
    useEffect(() => {
        if (selectedRegistration) {
            // Memproses peserta yang memiliki role 'T' (Trainee)
            const trainees = selectedRegistration.participants
                .filter(p => p.role === 'T')
                .map(p => ({
                    id: `${selectedRegistration.regId}-${p.nik}`, // ID unik untuk editing state
                    regId: selectedRegistration.regId,
                    nik: p.nik,
                    name: p.nama,
                    trainingName: selectedRegistration.trainingName,
                    trainingDate: selectedRegistration.trainingDate,
                    // Ambil nilai pretest/posttest yang sudah ada
                    pretest: p.pretest !== undefined ? p.pretest : null,
                    posttest: p.posttest !== undefined ? p.posttest : null,
                }));
            
            setParticipants(trainees);
        } else {
             // Reset jika tidak ada registrasi yang dipilih
            setParticipants([]);
        }
    }, [selectedRegistration]);
    
    // Filter participants berdasarkan search dan status (Berjalan setiap kali peserta berubah)
    useEffect(() => {
        let filtered = participants;

        if (searchTerm) {
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.nik.includes(searchTerm)
            );
        }

        if (filterStatus !== 'all') {
            filtered = filtered.filter(p => {
                if (filterStatus === 'completed') {
                    return p.pretest !== null && p.posttest !== null;
                } else if (filterStatus === 'pending') {
                    return p.pretest === null || p.posttest === null;
                }
                return true;
            });
        }

        setFilteredParticipants(filtered);
    }, [searchTerm, filterStatus, participants]);

    // --- LOGIKA SIMPAN KE FIRESTORE ---
    const handleSave = async (uniqueId) => {
        const participantToUpdate = participants.find(p => p.id === uniqueId);
        if (!participantToUpdate) return;
        
        const { regId, nik } = participantToUpdate;
        const docRef = doc(db, 'trainingapp', regId);

        const pretest = editValues.pretest === '' ? null : Number(editValues.pretest);
        const posttest = editValues.posttest === '' ? null : Number(editValues.posttest);

        if ((pretest !== null && (pretest < 0 || pretest > 100)) || 
            (posttest !== null && (posttest < 0 || posttest > 100))) {
            alert('Nilai harus antara 0-100');
            return;
        }

        try {
            // 1. Update state lokal (untuk tampilan cepat)
            const updatedParticipants = participants.map(p => 
                p.id === uniqueId ? { ...p, pretest, posttest } : p
            );
            setParticipants(updatedParticipants);
            setEditingId(null);
            
            // 2. Update Firestore (update array participants di dalam dokumen registrasi)
            
            // Mengambil data registrasi saat ini untuk mendapatkan array participants
            const docSnap = await getDocs(query(collection(db, 'trainingapp'), where('__name__', '==', regId)));
            if (docSnap.empty) throw new Error("Dokumen Registrasi tidak ditemukan.");

            const currentRegData = docSnap.docs[0].data();
            
            // Cari dan update peserta yang relevan di array participants
            const updatedParticipantsArray = currentRegData.participants.map(p => {
                if (p.nik === nik) {
                    // Hanya update nilai pretest/posttest di dokumen Firestore
                    return { ...p, pretest, posttest };
                }
                return p;
            });

            await updateDoc(docRef, { participants: updatedParticipantsArray });

            setSuccessMessage(`Nilai untuk ${participantToUpdate.name} berhasil disimpan!`);
            setTimeout(() => setSuccessMessage(''), 3000);

        } catch (error) {
            console.error('Error saving scores to Firestore:', error);
            alert('Gagal menyimpan nilai ke database.');
            fetchRegistrations(); // Sinkronisasi ulang jika gagal
        }
    };

    // --- HANDLER UI ---
    const handleEdit = (participant) => {
        setEditingId(participant.id);
        setEditValues({
            pretest: participant.pretest !== null ? participant.pretest : '',
            posttest: participant.posttest !== null ? participant.posttest : ''
        });
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditValues({ pretest: '', posttest: '' });
    };

    const handleSelectRegistration = (reg) => {
        setSelectedRegistration(reg);
        // Reset search term dan filter status saat masuk ke detail peserta
        setSearchTerm('');
        setFilterStatus('all'); 
        setEditingId(null);
        setEditValues({ pretest: '', posttest: '' });
    }
    
    // --- UTILITY DISPLAY ---
    const getStatusBadge = (participant) => {
        if (participant.pretest !== null && participant.posttest !== null) {
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Lengkap</span>;
        } else if (participant.pretest !== null || participant.posttest !== null) {
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Sebagian</span>;
        } else {
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Belum</span>;
        }
    };

    if (isLoading) {
         return (
            <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
                <div className="text-blue-600 flex items-center">
                    <div className="w-6 h-6 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mr-3"></div>
                    Memuat data assessment...
                </div>
            </div>
        );
    }
    
    // --- RENDER UTAMA ---
    return (
        <div className="min-h-screen bg-blue-50 p-6">
            <div className="max-w-7xl mx-auto">
                
                {/* Header */}
                <div className="mb-8 bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-600">
                    <h1 className="text-3xl font-bold text-blue-900 mb-2">Assessment Training</h1>
                    <p className="text-blue-600">Kelola nilai pretest dan posttest peserta Trainee.</p>
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div className="mb-6 p-4 bg-blue-100 border border-blue-300 rounded-lg flex items-center gap-2 text-blue-800">
                        <Check className="w-5 h-5" />
                        <span>{successMessage}</span>
                    </div>
                )}
                
                {selectedRegistration ? (
                    // --- TAMPILAN DETAIL PESERTA (Drill-down) ---
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center space-x-3 mb-6 border-b pb-3">
                            <button onClick={() => setSelectedRegistration(null)} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition">
                                <ArrowLeft className="w-5 h-5 text-gray-700" />
                            </button>
                            <h2 className="text-2xl font-bold text-blue-900">
                                Penilaian: {selectedRegistration.trainingName}
                            </h2>
                            <span className="text-sm text-gray-500 ml-auto">Total Trainee: {participants.length}</span>
                        </div>
                        
                        {/* Filters and Search (Re-used from original) */}
                        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Cari nama atau NIK peserta..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                                >
                                    <option value="all">Semua Status</option>
                                    <option value="pending">Belum Lengkap</option>
                                    <option value="completed">Sudah Lengkap</option>
                                </select>
                            </div>
                        </div>

                        {/* Table Peserta */}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-blue-600 text-white">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Peserta (NIK)</th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider">Pretest</th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider">Posttest</th>
                                        {/* <th>Peningkatan</th> 💡 DIHAPUS */}
                                        <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredParticipants.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                                Tidak ada peserta Trainee yang cocok.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredParticipants.map((participant) => (
                                            <tr key={participant.id} className="hover:bg-blue-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-blue-900">{participant.name}</div>
                                                    <div className="text-sm text-blue-600">NIK: {participant.nik}</div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {editingId === participant.id ? (
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={editValues.pretest}
                                                            onChange={(e) => setEditValues({ ...editValues, pretest: e.target.value })}
                                                            className="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            placeholder="0-100"
                                                        />
                                                    ) : (
                                                        <span className="text-gray-900 font-medium">{participant.pretest !== null ? participant.pretest : '-'}</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {editingId === participant.id ? (
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={editValues.posttest}
                                                            onChange={(e) => setEditValues({ ...editValues, posttest: e.target.value })}
                                                            className="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            placeholder="0-100"
                                                        />
                                                    ) : (
                                                        <span className="text-gray-900 font-medium">{participant.posttest !== null ? participant.posttest : '-'}</span>
                                                    )}
                                                </td>
                                                {/* 💡 Kolom Peningkatan Dihapus */}
                                                <td className="px-6 py-4 text-center">{getStatusBadge(participant)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    {editingId === participant.id ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => handleSave(participant.id)}
                                                                className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                                                title="Simpan"
                                                            >
                                                                <Check className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={handleCancel}
                                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                                title="Batal"
                                                            >
                                                                <X className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleEdit(participant)}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                            title="Edit Nilai"
                                                            disabled={isLoading}
                                                        >
                                                            <Edit2 className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    // --- TAMPILAN DAFTAR TRAINING (Default) ---
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-2xl font-bold text-blue-900 mb-4">
                            Daftar Training Siap Asesmen
                        </h2>
                        
                        {/* 💡 Search Bar untuk Daftar Training */}
                        <div className="mb-4 flex gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Cari No. Reg atau Tanggal Training (YYYY-MM-DD)..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <button onClick={fetchRegistrations} disabled={isLoading} className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition" title="Refresh Data">
                                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                        
                        <div className="space-y-4">
                            {filteredRegistrations.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 italic">Tidak ada training yang cocok dengan pencarian Anda.</div>
                            ) : (
                                filteredRegistrations.map(reg => (
                                    <div 
                                        key={reg.id}
                                        onClick={() => handleSelectRegistration(reg)}
                                        className="bg-gray-50 p-4 border-l-4 border-blue-600 rounded-lg shadow-sm cursor-pointer hover:bg-blue-100 transition"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold text-lg text-gray-900">{reg.trainingName}</h3>
                                                <p className="text-sm text-gray-600 mt-1">Reg No: {reg.noReg} | Tanggal: {reg.trainingDate}</p>
                                            </div>
                                            {/* 💡 Total Peserta di Kanan */}
                                            <p className="text-sm font-semibold text-blue-700 flex items-center">
                                                <Users className="w-4 h-4 mr-1"/> Total Peserta: {reg.totalTrainees}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
                
                {/* Summary Statistics - Hanya muncul di tampilan default */}
                {!selectedRegistration && (
                    /* 💡 DIHAPUS: Hapus seluruh blok statistik ini */
                    /*
                    <div className="mt-6 grid grid-cols-1 gap-4">
                        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-gray-400">
                            <div className="text-sm text-gray-600 mb-1">Total Training Siap Asesmen</div>
                            <div className="text-3xl font-bold text-gray-900">{registrations.length}</div>
                        </div>
                    </div>
                    */
                    null
                )}
                
            </div>
        </div>
    );
};

export default AssessmentPage;
