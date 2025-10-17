import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Upload, FileText, User, Building, Save, Send, FileX, Eye, Info } from 'lucide-react'; 
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; 

// Fungsi utilitas untuk mengecek bentrok waktu antar dua rentang
const isTimeOverlap = (start1, end1, start2, end2) => {
    // Konversi HH:MM ke menit untuk perbandingan
    const toMinutes = (time) => {
        if (time === 'N/A') return 0;
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    };
    const s1 = toMinutes(start1);
    const e1 = toMinutes(end1);
    const s2 = toMinutes(start2);
    const e2 = toMinutes(end2);
    return s1 < e2 && e1 > s2;
};

// Fungsi generate NoReg
const generateNoReg = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `REG-${year}${month}${date}-${random}`;
};


const RegistrasiPage = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [scheduledRooms, setScheduledRooms] = useState([]);
  const [isScheduleLoading, setIsScheduleLoading] = useState(true); 

  // State untuk General Info
  const [generalInfo, setGeneralInfo] = useState({
    noReg: generateNoReg(), judulTraining: '', area: '', kelasTraining: '',
    tanggalMulai: '', tanggalSelesai: '', jamMulai: '', jamSelesai: '',
    instrukturType: '', namaInstruktur: '', noSAP: '', instansi: '',
    materi: null, approvalManager: '', lastApproval: 'Department Head'
  });

  // State untuk Participant
  const [participantInfo, setParticipantInfo] = useState({
    selectedRole: '', 
    jumlahPeserta: '', 
    participants: []
  });

  const [showAlert, setShowAlert] = useState(false);
  const [totalHari, setTotalHari] = useState(0);
  const [totalJam, setTotalJam] = useState(0);

  // Data master
  const areaOptions = ['Power Plant', 'Water Treatment Plant', 'Environment Protection Plant', 'Raw Material Plant', 'Maintenance Plant'];
  const kelasOptions = [
    { nama: 'Davinci', kapasitas: 20 }, { nama: 'Newton', kapasitas: 25 }, 
    { nama: 'Edison', kapasitas: 30 }, { nama: 'Copernicus', kapasitas: 20 }, 
    { nama: 'Aristoteles', kapasitas: 25 }, { nama: 'Archimedes', kapasitas: 30 }, 
    { nama: 'Plato', kapasitas: 20 }
  ];

  // --- 1. AMBIL JADWAL APPROVED DARI FIRESTORE ---
  useEffect(() => {
    const fetchApprovedSchedules = async () => {
        setIsScheduleLoading(true);
        try {
            const q = query(collection(db, 'trainingapp'), where('status', '==', 'Approved'));
            const snapshot = await getDocs(q);
            
            const schedules = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    room: data.kelasTraining, dateStart: data.tanggalMulai,
                    dateEnd: data.tanggalSelesai, timeStart: data.jamMulai,
                    timeEnd: data.jamSelesai,
                };
            });
            setScheduledRooms(schedules);
        } catch (error) {
            console.error("Error fetching approved schedules:", error);
        } finally {
            setIsScheduleLoading(false);
        }
    };
    fetchApprovedSchedules();
    
    // Regenerate NoReg saat komponen dimuat kembali (misal reset)
    setGeneralInfo(prev => ({ ...prev, noReg: generateNoReg() })); 
  }, []);

  // Hitung total hari dan jam (Tetap Sama)
  useEffect(() => {
    if (generalInfo.tanggalMulai && generalInfo.tanggalSelesai && generalInfo.jamMulai && generalInfo.jamSelesai) {
      const startDate = new Date(generalInfo.tanggalMulai);
      const endDate = new Date(generalInfo.tanggalSelesai);
      const diffTime = Math.abs(endDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 

      const [startHour, startMin] = generalInfo.jamMulai.split(':').map(Number);
      const [endHour, endMin] = generalInfo.jamSelesai.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      let totalMinutes = endMinutes - startMinutes;
      
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      setTotalHari(diffDays);
      setTotalJam(hours + (minutes > 0 ? minutes / 60 : 0));
    }
  }, [generalInfo.tanggalMulai, generalInfo.tanggalSelesai, generalInfo.jamMulai, generalInfo.jamSelesai]);


  // --- 2. FUNGSI CEK BENTROK RUANGAN (UTAMA) ---
  const isRoomAvailable = (roomName) => {
    const { tanggalMulai, tanggalSelesai, jamMulai, jamSelesai } = generalInfo;

    if (!tanggalMulai || !tanggalSelesai || !jamMulai || !jamSelesai) return true; 

    const newStart = new Date(tanggalMulai);
    const newEnd = new Date(tanggalSelesai);

    const isConflict = scheduledRooms.some(schedule => {
        if (schedule.room !== roomName) return false;
        const scheduledStart = new Date(schedule.dateStart);
        const scheduledEnd = new Date(schedule.dateEnd);
        const dateOverlap = newStart <= scheduledEnd && newEnd >= scheduledStart;

        if (dateOverlap) {
            return isTimeOverlap(jamMulai, jamSelesai, schedule.timeStart, schedule.timeEnd);
        }
        return false;
    });

    return !isConflict;
  };
    
  // --- 3. KOMPONEN OPTION RUANGAN YANG DIUBAH ---
  const RoomOptions = () => {
    if (isScheduleLoading) return <option>Memuat ketersediaan ruangan...</option>;
      
    return (
        <>
            <option value="">Pilih Kelas Training</option>
            {kelasOptions.map(kelas => {
                const isAvailable = isRoomAvailable(kelas.nama);
                const capacityStatus = `(Kapasitas: ${kelas.kapasitas} orang)`;
                
                return (
                    <option 
                        key={kelas.nama} 
                        value={kelas.nama}
                        disabled={!isAvailable}
                    >
                        {kelas.nama} {capacityStatus} {!isAvailable && "— BENTROK JADWAL"}
                    </option>
                );
            })}
        </>
    );
  };
  
  // --- FUNGSI UTAMA LAINNYA ---
  const handleGeneralInfoChange = (field, value) => { setGeneralInfo(prev => ({ ...prev, [field]: value })); };
  const handleFileUpload = (e) => { /* ... file logic ... */ };
  
  // Handler untuk input dalam array participants
  const handleParticipantChange = (index, field, value) => { 
    setParticipantInfo(prev => ({ 
        ...prev, 
        participants: prev.participants.map((p, i) => i === index ? { ...p, [field]: value } : p) 
    })); 
  };
  
  // Handler untuk input Role dan Jumlah Peserta sementara (di luar array)
  const handleTempParticipantChange = (field, value) => {
      setParticipantInfo(prev => ({ ...prev, [field]: value }));
  };
  
  // PERBAIKAN PENTING: Logic Tambah Peserta
  const generateParticipants = () => {
    const jumlah = parseInt(participantInfo.jumlahPeserta);
    const role = participantInfo.selectedRole;

    if (jumlah > 0 && role) {
      const newParticipants = Array.from({ length: jumlah }, () => ({
        nama: '', nik: '', role: role, unit: ''
      }));
      setParticipantInfo(prev => ({
        ...prev,
        participants: [...prev.participants, ...newParticipants],
        selectedRole: '',
        jumlahPeserta: ''
      }));
    }
  };

  const addMoreParticipants = () => {
    const jumlah = parseInt(participantInfo.jumlahPeserta);
    
    // Pengecekan disamakan dengan disabled button
    if (!participantInfo.selectedRole || isNaN(jumlah) || jumlah <= 0) {
      alert('Mohon pilih role dan masukkan jumlah peserta yang valid (min 1).');
      return;
    }
    generateParticipants();
  };
  
  const removeParticipant = (index) => { setParticipantInfo(prev => ({ ...prev, participants: prev.participants.filter((_, i) => i !== index) })); };
  const handleSubmit = () => { 
    if (participantInfo.participants.length === 0) { alert('Mohon tambahkan minimal 1 peserta'); return; }
    const incompleteParticipants = participantInfo.participants.some(p => !p.nama || !p.nik || !p.role || !p.unit);
    if (incompleteParticipants) { alert('Mohon lengkapi data semua peserta'); return; }
    setShowPreview(true);
  };
  const handleDraft = () => { alert('Data berhasil disimpan sebagai draft (Implementasi draft perlu penyesuaian dengan Firebase)'); };
  const handleReset = () => { setGeneralInfo(prev => ({ ...prev, noReg: generateNoReg(), judulTraining: '', area: '', kelasTraining: '', tanggalMulai: '', tanggalSelesai: '', jamMulai: '', jamSelesai: '', instrukturType: '', namaInstruktur: '', noSAP: '', instansi: '', materi: null, approvalManager: '' })); setParticipantInfo({ selectedRole: '', jumlahPeserta: '', participants: [] }); setActiveTab('general'); };
  const isGeneralFormValid = () => { 
    const required = ['judulTraining', 'area', 'kelasTraining', 'tanggalMulai', 'tanggalSelesai', 'jamMulai', 'jamSelesai', 'instrukturType', 'namaInstruktur', 'approvalManager'];
    const isBasicValid = required.every(field => generalInfo[field]);
    if (generalInfo.instrukturType === 'internal') return isBasicValid && generalInfo.noSAP;
    if (generalInfo.instrukturType === 'external') return isBasicValid && generalInfo.instansi;
    return isBasicValid;
  };
  const handleParticipantTabClick = () => { 
    if (!isGeneralFormValid()) { setShowAlert(true); setTimeout(() => setShowAlert(false), 3000); return; }
    setActiveTab('participant'); 
  };


  const handleSaveGeneral = () => {
    const required = ['judulTraining', 'area', 'kelasTraining', 'tanggalMulai', 'tanggalSelesai', 'jamMulai', 'jamSelesai', 'instrukturType', 'namaInstruktur', 'approvalManager'];
    const missingFields = required.filter(field => !generalInfo[field]);
    if (generalInfo.instrukturType === 'internal' && !generalInfo.noSAP) missingFields.push('noSAP');
    if (generalInfo.instrukturType === 'external' && !generalInfo.instansi) missingFields.push('instansi');

    if (missingFields.length > 0) {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }

    const { kelasTraining } = generalInfo;
    if (kelasTraining && !isRoomAvailable(kelasTraining)) {
        setShowAlert(true);
        alert(`Kelas ${kelasTraining} bentrok dengan jadwal yang sudah di-approve. Silakan pilih tanggal atau jam yang berbeda.`);
        setTimeout(() => setShowAlert(false), 3000);
        return;
    }
    setActiveTab('participant');
  };

  const handleFinalSubmit = async () => {
    setIsLoading(true);
    let materiURL = null;

    try {
        if (generalInfo.materi) materiURL = `/materi/${generalInfo.noReg}/${generalInfo.materi.name}`; 
        const { materi, ...generalInfoToSave } = generalInfo;

        const registrationData = {
            ...generalInfoToSave, participants: participantInfo.participants, 
            totalHari: totalHari, totalJam: totalJam,
            materiFileName: generalInfo.materi ? generalInfo.materi.name : null,
            materiURL: materiURL, status: 'Pending', createdAt: serverTimestamp(), 
        };
        
        const docRef = await addDoc(collection(db, 'trainingapp'), registrationData); 
        alert(`Registrasi berhasil dikirim! ID Dokumen: ${docRef.id}`);
        // Reset state
        setGeneralInfo(prev => ({ ...prev, judulTraining: '', area: '', kelasTraining: '', tanggalMulai: '', tanggalSelesai: '', jamMulai: '', jamSelesai: '', instrukturType: '', namaInstruktur: '', noSAP: '', instansi: '', materi: null, approvalManager: '' }));
        setParticipantInfo({ selectedRole: '', jumlahPeserta: '', participants: [] });
        setShowPreview(false);
        setActiveTab('general');

    } catch (error) {
        console.error('Error saat menyimpan registrasi: ', error);
        alert('Gagal mengirim registrasi. Silakan coba lagi. (Cek log konsol untuk detail error)');
    } finally {
        setIsLoading(false);
    }
  };

  const InstructorSummary = () => {
    const { namaInstruktur, instrukturType, noSAP, instansi } = generalInfo;
    const detail = instrukturType === 'internal' ? `No. SAP: ${noSAP || 'N/A'}` : `Instansi: ${instansi || 'N/A'}`;
        
    return (<div className="bg-white p-4 border border-blue-200 rounded-lg shadow-sm">
        <h4 className="font-semibold text-blue-800 flex items-center"><User className="w-4 h-4 mr-2" />Instruktur ({instrukturType.toUpperCase()}): {namaInstruktur}</h4>
        <p className="text-sm text-gray-600 mt-1 pl-6 mb-2">{detail}</p>
    </div>);
  };
  
  // --- START JSX RENDER ---
  
  if (showPreview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
        <div className="max-w-4xl mx-auto border border-blue-100 rounded-xl shadow-2xl p-8 bg-white">
          <h2 className="text-3xl font-bold text-blue-700 mb-6 border-b pb-3 flex items-center">
            <Eye className="mr-3 text-blue-500" />
            Pratinjau Data Registrasi
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 text-sm mb-8">
            {/* Kolom Kiri: General Info & Jadwal */}
            <div className="space-y-3">
              <h3 className="font-bold text-lg text-blue-600 border-b-2 border-blue-200 pb-1 mb-2">I. Informasi Umum</h3>
              <p><span className="font-medium text-gray-700">No. Registrasi:</span> {generalInfo.noReg}</p>
              <p><span className="font-medium text-gray-700">Judul Training:</span> {generalInfo.judulTraining}</p>
              <p><span className="font-medium text-gray-700">Area/Unit:</span> {generalInfo.area}</p>
              <p><span className="font-medium text-gray-700">Kelas:</span> {generalInfo.kelasTraining}</p>
              <p><span className="font-medium text-gray-700">Approval Manager:</span> {generalInfo.approvalManager}</p>
            </div>
            
            {/* Kolom Kanan: Waktu & Instruktur */}
            <div className="space-y-3">
                <h3 className="font-bold text-lg text-blue-600 border-b-2 border-blue-200 pb-1 mb-2">II. Jadwal & Instruktur</h3>
                <p><span className="font-medium text-gray-700">Tanggal:</span> {generalInfo.tanggalMulai} s/d {generalInfo.tanggalSelesai}</p>
                <p><span className="font-medium text-gray-700">Jam:</span> {generalInfo.jamMulai} - {generalInfo.jamSelesai}</p>
                <p><span className="font-medium text-gray-700">Durasi:</span> {totalHari} hari / {totalJam.toFixed(1)} jam</p>
                <div className="border-t pt-2 mt-2">
                    <p><span className="font-medium text-gray-700">Instruktur:</span> {generalInfo.namaInstruktur} ({generalInfo.instrukturType})</p>
                    {generalInfo.instrukturType === 'internal' ? 
                        <p className="text-xs text-gray-500 pl-2">No. SAP: {generalInfo.noSAP}</p> :
                        <p className="text-xs text-gray-500 pl-2">Instansi: {generalInfo.instansi}</p>
                    }
                </div>
            </div>
          </div>
          
          {/* Tabel Peserta */}
          <div className="mb-8">
            <h3 className="font-bold text-lg text-blue-600 border-b-2 border-blue-200 pb-1 mb-3 flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-500"/>
                III. Peserta ({participantInfo.participants.length} Orang)
            </h3>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="bg-blue-50 text-blue-700 font-semibold">
                            <th className="p-3 border-r">No</th>
                            <th className="p-3 border-r">Nama</th>
                            <th className="p-3 border-r">NIK</th>
                            <th className="p-3 border-r">Role</th>
                            <th className="p-3">Unit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {participantInfo.participants.map((p, index) => (
                            <tr key={index} className="odd:bg-white even:bg-gray-50 hover:bg-blue-100 transition-colors">
                                <td className="p-3 border-r text-center">{index + 1}</td>
                                <td className="p-3 border-r">{p.nama}</td>
                                <td className="p-3 border-r">{p.nik}</td>
                                <td className="p-3 border-r font-medium text-center">{p.role}</td>
                                <td className="p-3">{p.unit}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <button onClick={() => setShowPreview(false)} className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors shadow-lg">
              Kembali Edit
            </button>
            <button onClick={handleFinalSubmit} disabled={isLoading} className={`px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-lg flex items-center space-x-2 disabled:opacity-50`}>
              {isLoading ? (<><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span>Mengirim...</span></>) : (<><Send className="w-5 h-5" /><span>Kirim Registrasi</span></>)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Alert Banner */}
      {showAlert && (<div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce"><div className="flex items-center"><div className="w-5 h-5 border-2 border-white rounded-full flex items-center justify-center mr-3"><span className="text-xs font-bold">!</span></div>Semua kolom wajib diisi terlebih dahulu.</div></div>)}

      <div className="container mx-auto p-4 lg:p-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white p-6 shadow-md">
            <h1 className="text-3xl font-bold">Registrasi Training</h1>
            <p className="text-blue-100 mt-2">Silakan lengkapi form registrasi training di bawah ini</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <button onClick={() => setActiveTab('general')} className={`flex-1 py-4 px-6 text-center font-medium transition-all ${activeTab === 'general' ? 'bg-white text-blue-600 shadow' : 'text-gray-500 hover:text-blue-600'}`}>
              <FileText className="w-5 h-5 inline-block mr-2" />
              General Info
            </button>
            <button onClick={handleParticipantTabClick} className={`flex-1 py-4 px-6 text-center font-medium transition-all ${activeTab === 'participant' ? 'bg-white text-blue-600 shadow' : 'text-gray-500 hover:text-blue-600'}`}>
              <Users className="w-5 h-5 inline-block mr-2" />
              Participants
            </button>
          </div>
          {/* Content */}
          <div className="p-4 lg:p-8">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-blue-900 mb-6">General Information</h2>

                {/* No Registrasi, Judul, Area, Kelas, Tanggal, Jam, Total Hari/Jam - Tetap Sama */}
                <div><label className="block text-sm font-medium text-blue-700 mb-2">No. Registrasi</label><input type="text" value={generalInfo.noReg} disabled className="w-full p-3 border border-blue-200 rounded-lg bg-gray-100 text-gray-600" /></div>
                <div><label className="block text-sm font-medium text-blue-700 mb-2">Judul Training *</label><input type="text" value={generalInfo.judulTraining} onChange={(e) => handleGeneralInfoChange('judulTraining', e.target.value)} className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Masukkan judul training" /></div>
                <div><label className="block text-sm font-medium text-blue-700 mb-2">Area/Unit *</label><select value={generalInfo.area} onChange={(e) => handleGeneralInfoChange('area', e.target.value)} className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"><option value="">Pilih Area/Unit</option>{areaOptions.map(area => (<option key={area} value={area}>{area}</option>))}</select></div>
                
                {/* Kelas Training (Menggunakan RoomOptions) */}
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Kelas Training *</label>
                  <select
                    value={generalInfo.kelasTraining}
                    onChange={(e) => handleGeneralInfoChange('kelasTraining', e.target.value)}
                    className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <RoomOptions /> {/* <-- Komponen Pengecek Bentrok */}
                  </select>
                  {generalInfo.kelasTraining && !isRoomAvailable(generalInfo.kelasTraining) && (
                      <p className="text-sm text-red-500 mt-2">⚠️ Peringatan: Kelas ini BENTROK dengan jadwal lain pada tanggal/jam yang sama.</p>
                  )}
                </div>

                {/* Tanggal dan Jam */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label className="block text-sm font-medium text-blue-700 mb-2">Tanggal Mulai *</label><input type="date" value={generalInfo.tanggalMulai} onChange={(e) => handleGeneralInfoChange('tanggalMulai', e.target.value)} className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-blue-700 mb-2">Tanggal Selesai *</label><input type="date" value={generalInfo.tanggalSelesai} onChange={(e) => handleGeneralInfoChange('tanggalSelesai', e.target.value)} className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-blue-700 mb-2">Jam Mulai *</label><input type="time" value={generalInfo.jamMulai} onChange={(e) => handleGeneralInfoChange('jamMulai', e.target.value)} className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                  <div><label className="block text-sm font-medium text-blue-700 mb-2">Jam Selesai *</label><input type="time" value={generalInfo.jamSelesai} onChange={(e) => handleGeneralInfoChange('jamSelesai', e.target.value)} className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                </div>

                {/* Total Hari dan Jam */}
                {totalHari > 0 && (<div className="bg-blue-50 p-4 rounded-lg"><div className="flex items-center space-x-4"><div className="flex items-center"><Calendar className="w-5 h-5 text-blue-600 mr-2" /><span className="text-blue-800 font-medium">Total Hari: {totalHari} hari</span></div><div className="flex items-center"><Clock className="w-5 h-5 text-blue-600 mr-2" /><span className="text-blue-800 font-medium">Total Jam: {totalJam.toFixed(1)} jam</span></div></div></div>)}

                {/* Instruktur */}
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Tipe Instruktur *</label>
                  <select value={generalInfo.instrukturType} onChange={(e) => handleGeneralInfoChange('instrukturType', e.target.value)} className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4">
                    <option value="">Pilih Tipe Instruktur</option><option value="internal">Internal</option><option value="external">External</option>
                  </select>

                  {/* Conditional Fields untuk Instruktur */}
                  {generalInfo.instrukturType && (
                    <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-blue-500">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Detail Instruktur {generalInfo.instrukturType === 'internal' ? 'Internal' : 'External'}</h3>
                      <div className="space-y-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-2">Nama Instruktur *</label><input type="text" value={generalInfo.namaInstruktur} onChange={(e) => handleGeneralInfoChange('namaInstruktur', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Masukkan nama instruktur" required /></div>
                        {generalInfo.instrukturType === 'internal' && (<div><label className="block text-sm font-medium text-gray-700 mb-2">No. SAP *</label><input type="text" value={generalInfo.noSAP} onChange={(e) => handleGeneralInfoChange('noSAP', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Masukkan nomor SAP" required /></div>)}
                        {generalInfo.instrukturType === 'external' && (<div><label className="block text-sm font-medium text-gray-700 mb-2">Asal Instansi *</label><input type="text" value={generalInfo.instansi} onChange={(e) => handleGeneralInfoChange('instansi', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Masukkan nama instansi" required /></div>)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Upload Materi */}
                <div><label className="block text-sm font-medium text-blue-700 mb-2">Materi Training</label><div className="flex items-center space-x-4"><label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"><Upload className="w-6 h-6 text-blue-500 mr-2" /><span className="text-blue-600">Upload file (PPT, Word, PDF)</span><input type="file" accept=".ppt,.pptx,.doc,.docx,.pdf" onChange={handleFileUpload} className="hidden" /></label></div>{generalInfo.materi && (<p className="text-sm text-green-600 mt-2">File terupload: {generalInfo.materi.name}</p>)}</div>

                {/* Approval */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-blue-700 mb-2">Approval Manager *</label><input type="text" value={generalInfo.approvalManager} onChange={(e) => handleGeneralInfoChange('approvalManager', e.target.value)} className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Nama manager" /></div><div><label className="block text-sm font-medium text-blue-700 mb-2">Last Approval</label><input type="text" value={generalInfo.lastApproval} disabled className="w-full p-3 border border-blue-200 rounded-lg bg-gray-100 text-gray-600" /></div></div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <button onClick={handleSaveGeneral} disabled={!isGeneralFormValid()} className={`px-6 py-3 rounded-lg transition-colors flex items-center ${isGeneralFormValid() ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`} title={!isGeneralFormValid() ? "Mohon lengkapi semua kolom yang wajib diisi" : ""}>
                    <Save className="w-4 h-4 mr-2" />
                    Save & Continue
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'participant' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-blue-900 mb-6">Participants Information</h2>
                
                {/* RINGKASAN INSTRUKTUR DAN TRAINING */}
                <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center"><Info className="w-5 h-5 mr-2 text-blue-500"/>Ringkasan Instruktur & Training</h3>
                    <InstructorSummary />

                    {/* Ringkasan Training Dasar */}
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mt-3 border-t pt-3">
                        <p><span className="font-medium">Judul:</span> {generalInfo.judulTraining || '-'}</p>
                        <p><span className="font-medium">Area/Unit:</span> {generalInfo.area || '-'}</p>
                        <p><span className="font-medium">Tanggal:</span> {generalInfo.tanggalMulai || '-'} s/d {generalInfo.tanggalSelesai || '-'}</p>
                        <p><span className="font-medium">Kelas:</span> {generalInfo.kelasTraining || '-'}</p>
                    </div>
                </div>
                
                {/* Role Selection */}
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4">Tambah Peserta Training</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Role Selection */}
                    <div><label className="block text-sm font-medium text-blue-700 mb-2">Pilih Role *</label><select value={participantInfo.selectedRole} onChange={(e) => handleTempParticipantChange('selectedRole', e.target.value)} className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"><option value="">Pilih Role</option><option value="T">Trainer (T)</option><option value="I">Instructor (I)</option></select></div>

                    {/* Jumlah Peserta */}
                    <div><label className="block text-sm font-medium text-blue-700 mb-2">Jumlah {participantInfo.selectedRole === 'T' ? 'Trainer' : participantInfo.selectedRole === 'I' ? 'Instructor' : 'Peserta'} *</label><input type="number" value={participantInfo.jumlahPeserta} onChange={(e) => handleTempParticipantChange('jumlahPeserta', e.target.value)} className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Masukkan jumlah" min="1" disabled={!participantInfo.selectedRole} /></div>

                    {/* Add Button */}
                    <div className="flex items-end">
                      <button onClick={addMoreParticipants} disabled={!participantInfo.selectedRole || !participantInfo.jumlahPeserta} className={`w-full p-3 rounded-lg transition-colors flex items-center justify-center ${participantInfo.selectedRole && participantInfo.jumlahPeserta ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
                        <User className="w-4 h-4 mr-2" />
                        Tambah
                      </button>
                    </div>
                  </div>
                </div>

                {/* Participant List */}
                {participantInfo.participants.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-blue-800">Daftar Peserta ({participantInfo.participants.length} orang)</h3>
                      <div className="flex space-x-4 text-sm">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">Trainer: {participantInfo.participants.filter(p => p.role === 'T').length}</span>
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">Instructor: {participantInfo.participants.filter(p => p.role === 'I').length}</span>
                      </div>
                    </div>

                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {participantInfo.participants.map((participant, index) => (
                        <div key={index} className="bg-white border border-blue-200 p-4 rounded-lg shadow-sm">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-medium text-blue-700 flex items-center"><span className={`inline-block w-6 h-6 rounded-full text-white text-xs flex items-center justify-center mr-2 ${participant.role === 'T' ? 'bg-green-500' : 'bg-blue-500'}`}>{participant.role}</span>{participant.role === 'T' ? 'Trainer' : 'Instructor'} #{index + 1}</h4>
                            <button onClick={() => removeParticipant(index)} className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"><FileX className="w-4 h-4" /></button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div><label className="block text-sm font-medium text-blue-700 mb-1">Nama *</label><input type="text" value={participant.nama} onChange={(e) => handleParticipantChange(index, 'nama', e.target.value)} className="w-full p-2 border border-blue-200 rounded focus:ring-1 focus:ring-blue-500" placeholder="Nama peserta" /></div>
                            <div><label className="block text-sm font-medium text-blue-700 mb-1">NIK *</label><input type="text" value={participant.nik} onChange={(e) => handleParticipantChange(index, 'nik', e.target.value)} className="w-full p-2 border border-blue-200 rounded focus:ring-1 focus:ring-blue-500" placeholder="Nomor NIK" /></div>
                            <div><label className="block text-sm font-medium text-blue-700 mb-1">Unit/Area *</label><select value={participant.unit} onChange={(e) => handleParticipantChange(index, 'unit', e.target.value)} className="w-full p-2 border border-blue-200 rounded focus:ring-1 focus:ring-blue-500"><option value="">Pilih Unit/Area</option>{areaOptions.map(area => (<option key={area} value={area}>{area}</option>))}</select></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="bg-blue-50 p-6 rounded-lg">
                  <p className="text-sm text-blue-700 mb-4"><strong>Informasi:</strong> Pastikan semua kolom terisi dengan benar sebelum mengirim registrasi.</p>
                  <div className="flex flex-wrap gap-4">
                    <button onClick={handleSubmit} disabled={isLoading} className={`px-6 py-3 rounded-lg transition-colors flex items-center ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white`}>{isLoading ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>Memproses...</>) : (<><Send className="w-4 h-4 mr-2" />Kirim Registrasi</>)}</button>
                    <button onClick={handleDraft} disabled={isLoading} className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center disabled:opacity-50"><Save className="w-4 h-4 mr-2" />Simpan Draft</button>
                    <button onClick={handleReset} disabled={isLoading} className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center disabled:opacity-50"><FileX className="w-4 h-4 mr-2" />Reset Form</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrasiPage;