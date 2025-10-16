import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Upload, FileText, User, Building, Save, Send, FileX, Eye, Info } from 'lucide-react'; // Tambah Info icon
// 1. Import Firestore Functions dan db dari firebaseConfig.js
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; 
// Catatan: Jika Anda ingin implementasi upload file sungguhan, Anda perlu mengimpor:
// import { storage } from '../../firebaseConfig'; 
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; 

const RegistrasiPage = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // State untuk General Info
  const [generalInfo, setGeneralInfo] = useState({
    noReg: '',
    judulTraining: '',
    area: '',
    kelasTraining: '',
    tanggalMulai: '',
    tanggalSelesai: '',
    jamMulai: '',
    jamSelesai: '',
    instrukturType: '',
    namaInstruktur: '',
    noSAP: '',
    instansi: '',
    materi: null, // Objek File (tidak boleh dikirim langsung ke Firestore)
    approvalManager: '',
    lastApproval: 'Department Head'
  });

  // State untuk Participant
  const [participantInfo, setParticipantInfo] = useState({
    selectedRole: '', // Data sementara (tidak boleh dikirim ke Firestore)
    jumlahPeserta: '', // Data sementara (tidak boleh dikirim ke Firestore)
    participants: []
  });

  const [showAlert, setShowAlert] = useState(false);

  const [totalHari, setTotalHari] = useState(0);
  const [totalJam, setTotalJam] = useState(0);

  // Data master (Dikeluarkan dari state utama)
  const areaOptions = [
    'Power Plant', 'Water Treatment Plant', 'Environment Protection Plant', 
    'Raw Material Plant', 'Maintenance Plant'
  ];

  const kelasOptions = [
    { nama: 'Davinci', kapasitas: 20 }, { nama: 'Newton', kapasitas: 25 }, 
    { nama: 'Edison', kapasitas: 30 }, { nama: 'Copernicus', kapasitas: 20 }, 
    { nama: 'Aristoteles', kapasitas: 25 }, { nama: 'Archimedes', kapasitas: 30 }, 
    { nama: 'Plato', kapasitas: 20 }
  ];

  // Generate No Registrasi otomatis
  useEffect(() => {
    const generateNoReg = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const date = String(now.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `REG-${year}${month}${date}-${random}`;
    };

    setGeneralInfo(prev => ({ ...prev, noReg: generateNoReg() }));
  }, []);

  // Hitung total hari dan jam
  useEffect(() => {
    if (generalInfo.tanggalMulai && generalInfo.tanggalSelesai && generalInfo.jamMulai && generalInfo.jamSelesai) {
      const startDate = new Date(generalInfo.tanggalMulai);
      const endDate = new Date(generalInfo.tanggalSelesai);
      const diffTime = Math.abs(endDate - startDate);
      // +1 karena jika mulai dan selesai di hari yang sama, hitungannya 1 hari
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 

      const [startHour, startMin] = generalInfo.jamMulai.split(':').map(Number);
      const [endHour, endMin] = generalInfo.jamSelesai.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      let totalMinutes = endMinutes - startMinutes;

      // Tangani jika jam selesai < jam mulai (misal training berlangsung di hari berikutnya)
      if (totalMinutes <= 0 && diffDays > 1) { 
        // Jika ada perbedaan hari, tambahkan 24 jam untuk setiap hari penuh, ini kompleks
        // Untuk penyederhanaan: jika durasi lebih dari 1 hari, kita asumsikan 8 jam/hari (hanya contoh sederhana)
        // Kita hanya akan menampilkan durasi jam per hari
      } else if (totalMinutes <= 0 && diffDays === 1) {
         // Jika mulai jam 23:00 selesai 01:00 (di hari yang sama) ini tidak mungkin
         // Asumsi: jika tanggal sama dan jam selesai < jam mulai, total jam akan 0, perlu validasi
      }
      
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      setTotalHari(diffDays);
      setTotalJam(hours + (minutes > 0 ? minutes / 60 : 0));
    }
  }, [generalInfo.tanggalMulai, generalInfo.tanggalSelesai, generalInfo.jamMulai, generalInfo.jamSelesai]);

  const handleGeneralInfoChange = (field, value) => {
    setGeneralInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = [
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/pdf'
      ];

      if (allowedTypes.includes(file.type)) {
        setGeneralInfo(prev => ({ ...prev, materi: file }));
      } else {
        alert('Hanya file PPT, Word, dan PDF yang diperbolehkan');
      }
    }
  };

  const handleSaveGeneral = () => {
    // Validasi form general info
    const required = ['judulTraining', 'area', 'kelasTraining', 'tanggalMulai', 'tanggalSelesai', 'jamMulai', 'jamSelesai', 'instrukturType', 'namaInstruktur', 'approvalManager'];
    const missingFields = required.filter(field => !generalInfo[field]);

    if (generalInfo.instrukturType === 'internal' && !generalInfo.noSAP) {
      missingFields.push('noSAP');
    }
    if (generalInfo.instrukturType === 'external' && !generalInfo.instansi) {
      missingFields.push('instansi');
    }

    if (missingFields.length > 0) {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }

    setActiveTab('participant');
  };

  const isGeneralFormValid = () => {
    const required = ['judulTraining', 'area', 'kelasTraining', 'tanggalMulai', 'tanggalSelesai', 'jamMulai', 'jamSelesai', 'instrukturType', 'namaInstruktur', 'approvalManager'];
    const isBasicValid = required.every(field => generalInfo[field]);

    if (generalInfo.instrukturType === 'internal') {
      return isBasicValid && generalInfo.noSAP;
    }
    if (generalInfo.instrukturType === 'external') {
      return isBasicValid && generalInfo.instansi;
    }

    return isBasicValid;
  };

  const handleParticipantTabClick = () => {
    if (!isGeneralFormValid()) {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }
    setActiveTab('participant');
  };

  const handleParticipantChange = (index, field, value) => {
    const updatedParticipants = [...participantInfo.participants];
    updatedParticipants[index] = { ...updatedParticipants[index], [field]: value };
    setParticipantInfo(prev => ({ ...prev, participants: updatedParticipants }));
  };

  const generateParticipants = () => {
    const jumlah = parseInt(participantInfo.jumlahPeserta);
    const role = participantInfo.selectedRole;

    if (jumlah > 0 && role) {
      const newParticipants = Array.from({ length: jumlah }, () => ({
        nama: '',
        nik: '',
        role: role,
        unit: ''
      }));
      setParticipantInfo(prev => ({
        ...prev,
        participants: [...prev.participants, ...newParticipants],
        selectedRole: '', // Reset data input sementara
        jumlahPeserta: '' // Reset data input sementara
      }));
    }
  };

  const addMoreParticipants = () => {
    if (!participantInfo.selectedRole || !participantInfo.jumlahPeserta) {
      alert('Mohon pilih role dan masukkan jumlah peserta');
      return;
    }
    generateParticipants();
  };
  
  const removeParticipant = (index) => {
    const updatedParticipants = participantInfo.participants.filter((_, i) => i !== index);
    setParticipantInfo(prev => ({ ...prev, participants: updatedParticipants }));
  };

  const handleSubmit = () => {
    // Validasi participant
    if (participantInfo.participants.length === 0) {
      alert('Mohon tambahkan minimal 1 peserta');
      return;
    }

    const incompleteParticipants = participantInfo.participants.some(p =>
      !p.nama || !p.nik || !p.role || !p.unit
    );

    if (incompleteParticipants) {
      alert('Mohon lengkapi data semua peserta');
      return;
    }

    setShowPreview(true);
  };

  const handleDraft = () => {
    alert('Data berhasil disimpan sebagai draft (Implementasi draft perlu penyesuaian dengan Firebase)');
  };

  const handleReset = () => {
    if (confirm('Apakah Anda yakin ingin mereset semua data?')) {
      setGeneralInfo({
        noReg: generalInfo.noReg, judulTraining: '', area: '', kelasTraining: '',
        tanggalMulai: '', tanggalSelesai: '', jamMulai: '', jamSelesai: '',
        instrukturType: '', namaInstruktur: '', noSAP: '', instansi: '',
        materi: null, approvalManager: '', lastApproval: 'Department Head'
      });
      setParticipantInfo({ selectedRole: '', jumlahPeserta: '', participants: [] });
      setActiveTab('general');
    }
  };

  // 2. FUNGSI UTAMA: PENGIRIMAN DATA KE FIRESTORE (PERBAIKAN FINAL)
  const handleFinalSubmit = async () => {
    setIsLoading(true);
    let materiURL = null;

    try {
        // Placeholder untuk Upload File ke Firebase Storage
        if (generalInfo.materi) {
            materiURL = `/materi/${generalInfo.noReg}/${generalInfo.materi.name}`; 
        }

        // PERBAIKAN ERROR FIREBASE (TIDAK MENGIRIM UNDEFINED/OBJEK FILE)
        const { materi, ...generalInfoToSave } = generalInfo;

        // Data yang akan disimpan ke koleksi 'trainingapp'
        const registrationData = {
            ...generalInfoToSave, // Menyimpan semua field General Info kecuali 'materi'
            participants: participantInfo.participants, // Menyimpan array peserta
            totalHari: totalHari,
            totalJam: totalJam,
            
            // Field terkait File/URL
            materiFileName: generalInfo.materi ? generalInfo.materi.name : null,
            materiURL: materiURL, 
            
            // Status dan Timestamp
            status: 'Pending', // Status awal untuk Approval Manager
            createdAt: serverTimestamp(), 
        };
        
        // Menyimpan data ke koleksi 'trainingapp'
        const docRef = await addDoc(collection(db, 'trainingapp'), registrationData); 
        
        alert(`Registrasi berhasil dikirim! ID Dokumen: ${docRef.id}`);
        
        // Setelah berhasil, reset form dan kembali ke General Info
        setGeneralInfo(prev => ({
            ...prev,
            judulTraining: '', area: '', kelasTraining: '', tanggalMulai: '', tanggalSelesai: '', 
            jamMulai: '', jamSelesai: '', instrukturType: '', namaInstruktur: '', noSAP: '', 
            instansi: '', materi: null, approvalManager: ''
        }));
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

  // --- KOMPONEN RINGKASAN INSTRUKTUR ---
  const InstructorSummary = () => {
    const { namaInstruktur, instrukturType, noSAP, instansi } = generalInfo;
    
    // Periksa apakah data instruktur sudah terisi valid
    if (!namaInstruktur) {
        return (
            <p className="text-sm text-red-500 flex items-center">
                <Info className="w-4 h-4 mr-2" />
                Lengkapi detail Instruktur di tab General Info untuk melanjutkan.
            </p>
        );
    }

    const detail = instrukturType === 'internal' 
        ? `No. SAP: ${noSAP || 'N/A'}`
        : `Instansi: ${instansi || 'N/A'}`;
        
    return (
        <div className="bg-white p-4 border border-blue-200 rounded-lg shadow-sm">
            <h4 className="font-semibold text-blue-800 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Instruktur ({instrukturType.toUpperCase()}): {namaInstruktur}
            </h4>
            <p className="text-sm text-gray-600 mt-1 pl-6">
                {detail}
            </p>
        </div>
    );
  };
  // ------------------------------------


  if (showPreview) {
    // ... (Preview JSX tetap sama)
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-blue-900 mb-6 flex items-center">
              <Eye className="mr-3" />
              Preview Data Registrasi
            </h2>

            <div className="space-y-6">
              <div className="border-b border-blue-200 pb-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">General Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">No. Registrasi:</span> {generalInfo.noReg}</div>
                  <div><span className="font-medium">Judul Training:</span> {generalInfo.judulTraining}</div>
                  <div><span className="font-medium">Area/Unit:</span> {generalInfo.area}</div>
                  <div><span className="font-medium">Kelas:</span> {generalInfo.kelasTraining}</div>
                  <div><span className="font-medium">Tanggal:</span> {generalInfo.tanggalMulai} - {generalInfo.tanggalSelesai}</div>
                  <div><span className="font-medium">Jam:</span> {generalInfo.jamMulai} - {generalInfo.jamSelesai}</div>
                  <div><span className="font-medium">Total Hari:</span> {totalHari} hari</div>
                  <div><span className="font-medium">Total Jam:</span> {totalJam.toFixed(1)} jam</div>
                  {/* Perubahan di sini untuk konsistensi Preview */}
                  <div><span className="font-medium">Instruktur:</span> {generalInfo.namaInstruktur} ({generalInfo.instrukturType})</div>
                  {generalInfo.instrukturType === 'internal' && <div><span className="font-medium">No. SAP Instruktur:</span> {generalInfo.noSAP}</div>}
                  {generalInfo.instrukturType === 'external' && <div><span className="font-medium">Instansi:</span> {generalInfo.instansi}</div>}
                  {/* Akhir Perubahan Preview */}
                  <div><span className="font-medium">Approval Manager:</span> {generalInfo.approvalManager}</div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-blue-800 mb-3">Participants ({participantInfo.participants.length} orang)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse border border-blue-200">
                    <thead>
                      <tr className="bg-blue-50">
                        <th className="border border-blue-200 p-2">No</th>
                        <th className="border border-blue-200 p-2">Nama</th>
                        <th className="border border-blue-200 p-2">NIK</th>
                        <th className="border border-blue-200 p-2">Role</th>
                        <th className="border border-blue-200 p-2">Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participantInfo.participants.map((p, index) => (
                        <tr key={index}>
                          <td className="border border-blue-200 p-2 text-center">{index + 1}</td>
                          <td className="border border-blue-200 p-2">{p.nama}</td>
                          <td className="border border-blue-200 p-2">{p.nik}</td>
                          <td className="border border-blue-200 p-2">{p.role}</td>
                          <td className="border border-blue-200 p-2">{p.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-4 mt-8">
              <button
                onClick={() => setShowPreview(false)}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Kembali Edit
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={isLoading}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Memproses...</span>
                  </div>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Kirim Registrasi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Alert Banner */}
      {showAlert && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce">
          <div className="flex items-center">
            <div className="w-5 h-5 border-2 border-white rounded-full flex items-center justify-center mr-3">
              <span className="text-xs font-bold">!</span>
            </div>
            Semua kolom wajib diisi terlebih dahulu.
          </div>
        </div>
      )}

      <div className="container mx-auto p-4 lg:p-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white p-6 shadow-md">
            <h1 className="text-3xl font-bold">Registrasi Training</h1>
            <p className="text-blue-100 mt-2">Silakan lengkapi form registrasi training di bawah ini</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <button
              onClick={() => setActiveTab('general')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-all ${activeTab === 'general'
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-500 hover:text-blue-600'
                }`}
            >
              <FileText className="w-5 h-5 inline-block mr-2" />
              General Info
            </button>
            <button
              onClick={handleParticipantTabClick}
              className={`flex-1 py-4 px-6 text-center font-medium transition-all ${activeTab === 'participant'
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-500 hover:text-blue-600'
                }`}
            >
              <Users className="w-5 h-5 inline-block mr-2" />
              Participants
            </button>
          </div>
          {/* Content */}
          <div className="p-4 lg:p-8">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-blue-900 mb-6">General Information</h2>

                {/* --- SISA GENERAL INFO TETAP SAMA --- */}
                {/* No Registrasi */}
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">No. Registrasi</label>
                  <input
                    type="text"
                    value={generalInfo.noReg}
                    disabled
                    className="w-full p-3 border border-blue-200 rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>

                {/* Judul Training */}
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Judul Training *</label>
                  <input
                    type="text"
                    value={generalInfo.judulTraining}
                    onChange={(e) => handleGeneralInfoChange('judulTraining', e.target.value)}
                    className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Masukkan judul training"
                  />
                </div>

                {/* Area/Unit */}
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Area/Unit *</label>
                  <select
                    value={generalInfo.area}
                    onChange={(e) => handleGeneralInfoChange('area', e.target.value)}
                    className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Pilih Area/Unit</option>
                    {areaOptions.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>

                {/* Kelas Training */}
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Kelas Training *</label>
                  <select
                    value={generalInfo.kelasTraining}
                    onChange={(e) => handleGeneralInfoChange('kelasTraining', e.target.value)}
                    className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Pilih Kelas Training</option>
                    {kelasOptions.map(kelas => (
                      <option key={kelas.nama} value={kelas.nama}>
                        {kelas.nama} (Kapasitas: {kelas.kapasitas} orang)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tanggal dan Jam */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">Tanggal Mulai *</label>
                    <input
                      type="date"
                      value={generalInfo.tanggalMulai}
                      onChange={(e) => handleGeneralInfoChange('tanggalMulai', e.target.value)}
                      className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">Tanggal Selesai *</label>
                    <input
                      type="date"
                      value={generalInfo.tanggalSelesai}
                      onChange={(e) => handleGeneralInfoChange('tanggalSelesai', e.target.value)}
                      className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">Jam Mulai *</label>
                    <input
                      type="time"
                      value={generalInfo.jamMulai}
                      onChange={(e) => handleGeneralInfoChange('jamMulai', e.target.value)}
                      className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">Jam Selesai *</label>
                    <input
                      type="time"
                      value={generalInfo.jamSelesai}
                      onChange={(e) => handleGeneralInfoChange('jamSelesai', e.target.value)}
                      className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Total Hari dan Jam */}
                {totalHari > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                        <span className="text-blue-800 font-medium">Total Hari: {totalHari} hari</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-5 h-5 text-blue-600 mr-2" />
                        <span className="text-blue-800 font-medium">Total Jam: {totalJam.toFixed(1)} jam</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Instruktur */}
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Tipe Instruktur *</label>
                  <select
                    value={generalInfo.instrukturType}
                    onChange={(e) => handleGeneralInfoChange('instrukturType', e.target.value)}
                    className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
                  >
                    <option value="">Pilih Tipe Instruktur</option>
                    <option value="internal">Internal</option>
                    <option value="external">External</option>
                  </select>

                  {/* Conditional Fields untuk Instruktur */}
                  {generalInfo.instrukturType && (
                    <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-blue-500">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Detail Instruktur {generalInfo.instrukturType === 'internal' ? 'Internal' : 'External'}
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nama Instruktur *
                          </label>
                          <input
                            type="text"
                            value={generalInfo.namaInstruktur}
                            onChange={(e) => handleGeneralInfoChange('namaInstruktur', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Masukkan nama instruktur"
                            required
                          />
                        </div>

                        {generalInfo.instrukturType === 'internal' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              No. SAP *
                            </label>
                            <input
                              type="text"
                              value={generalInfo.noSAP}
                              onChange={(e) => handleGeneralInfoChange('noSAP', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Masukkan nomor SAP"
                              required
                            />
                          </div>
                        )}

                        {generalInfo.instrukturType === 'external' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Asal Instansi *
                            </label>
                            <input
                              type="text"
                              value={generalInfo.instansi}
                              onChange={(e) => handleGeneralInfoChange('instansi', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Masukkan nama instansi"
                              required
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Upload Materi */}
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Materi Training</label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                      <Upload className="w-6 h-6 text-blue-500 mr-2" />
                      <span className="text-blue-600">Upload file (PPT, Word, PDF)</span>
                      <input
                        type="file"
                        accept=".ppt,.pptx,.doc,.docx,.pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {generalInfo.materi && (
                    <p className="text-sm text-green-600 mt-2">File terupload: {generalInfo.materi.name}</p>
                  )}
                </div>

                {/* Approval */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">Approval Manager *</label>
                    <input
                      type="text"
                      value={generalInfo.approvalManager}
                      onChange={(e) => handleGeneralInfoChange('approvalManager', e.target.value)}
                      className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nama manager"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">Last Approval</label>
                    <input
                      type="text"
                      value={generalInfo.lastApproval}
                      disabled
                      className="w-full p-3 border border-blue-200 rounded-lg bg-gray-100 text-gray-600"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveGeneral}
                    disabled={!isGeneralFormValid()}
                    className={`px-6 py-3 rounded-lg transition-colors flex items-center ${isGeneralFormValid()
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    title={!isGeneralFormValid() ? "Mohon lengkapi semua kolom yang wajib diisi" : ""}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save & Continue
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'participant' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-blue-900 mb-6">Participants Information</h2>
                
                {/* ========================================================= */}
                {/* PERBAIKAN: TAMBAH RINGKASAN INSTRUKTUR DI HALAMAN PARTICIPANTS */}
                {/* ========================================================= */}
                <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                        <Info className="w-5 h-5 mr-2 text-blue-500"/>
                        Ringkasan Instruktur & Training
                    </h3>
                    
                    {/* Tampilkan Ringkasan Instruktur */}
                    <InstructorSummary />

                    {/* Ringkasan Training Dasar */}
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mt-3 border-t pt-3">
                        <p><span className="font-medium">Judul:</span> {generalInfo.judulTraining || '-'}</p>
                        <p><span className="font-medium">Area/Unit:</span> {generalInfo.area || '-'}</p>
                        <p><span className="font-medium">Tanggal:</span> {generalInfo.tanggalMulai || '-'} s/d {generalInfo.tanggalSelesai || '-'}</p>
                        <p><span className="font-medium">Kelas:</span> {generalInfo.kelasTraining || '-'}</p>
                    </div>
                </div>
                {/* ========================================================= */}
                
                {/* Role Selection */}
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4">Tambah Peserta Training</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Role Selection */}
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-2">Pilih Role *</label>
                      <select
                        value={participantInfo.selectedRole}
                        onChange={(e) => setParticipantInfo(prev => ({ ...prev, selectedRole: e.target.value }))}
                        className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Pilih Role</option>
                        <option value="T">Trainer (T)</option>
                        <option value="I">Instructor (I)</option>
                      </select>
                    </div>

                    {/* Jumlah Peserta */}
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-2">
                        Jumlah {participantInfo.selectedRole === 'T' ? 'Trainer' : participantInfo.selectedRole === 'I' ? 'Instructor' : 'Peserta'} *
                      </label>
                      <input
                        type="number"
                        value={participantInfo.jumlahPeserta}
                        onChange={(e) => setParticipantInfo(prev => ({ ...prev, jumlahPeserta: e.target.value }))}
                        className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Masukkan jumlah"
                        min="1"
                        disabled={!participantInfo.selectedRole}
                      />
                    </div>

                    {/* Add Button */}
                    <div className="flex items-end">
                      <button
                        onClick={addMoreParticipants}
                        disabled={!participantInfo.selectedRole || !participantInfo.jumlahPeserta}
                        className={`w-full p-3 rounded-lg transition-colors flex items-center justify-center ${participantInfo.selectedRole && participantInfo.jumlahPeserta
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                      >
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
                      <h3 className="text-lg font-semibold text-blue-800">
                        Daftar Peserta ({participantInfo.participants.length} orang)
                      </h3>

                      {/* Summary by Role */}
                      <div className="flex space-x-4 text-sm">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                          Trainer: {participantInfo.participants.filter(p => p.role === 'T').length}
                        </span>
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                          Instructor: {participantInfo.participants.filter(p => p.role === 'I').length}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {participantInfo.participants.map((participant, index) => (
                        <div key={index} className="bg-white border border-blue-200 p-4 rounded-lg shadow-sm">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-medium text-blue-700 flex items-center">
                              <span className={`inline-block w-6 h-6 rounded-full text-white text-xs flex items-center justify-center mr-2 ${participant.role === 'T' ? 'bg-green-500' : 'bg-blue-500'
                                  }`}>
                                {participant.role}
                              </span>
                              {participant.role === 'T' ? 'Trainer' : 'Instructor'} #{index + 1}
                            </h4>
                            <button
                              onClick={() => removeParticipant(index)}
                              className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                            >
                              <FileX className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-blue-700 mb-1">Nama *</label>
                              <input
                                type="text"
                                value={participant.nama}
                                onChange={(e) => handleParticipantChange(index, 'nama', e.target.value)}
                                className="w-full p-2 border border-blue-200 rounded focus:ring-1 focus:ring-blue-500"
                                placeholder="Nama peserta"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-blue-700 mb-1">NIK *</label>
                              <input
                                type="text"
                                value={participant.nik}
                                onChange={(e) => handleParticipantChange(index, 'nik', e.target.value)}
                                className="w-full p-2 border border-blue-200 rounded focus:ring-1 focus:ring-blue-500"
                                placeholder="Nomor NIK"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-blue-700 mb-1">Unit/Area *</label>
                              <select
                                value={participant.unit}
                                onChange={(e) => handleParticipantChange(index, 'unit', e.target.value)}
                                className="w-full p-2 border border-blue-200 rounded focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="">Pilih Unit/Area</option>
                                {areaOptions.map(area => (
                                  <option key={area} value={area}>{area}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="bg-blue-50 p-6 rounded-lg">
                  <p className="text-sm text-blue-700 mb-4">
                    <strong>Informasi:</strong> Pastikan semua kolom terisi dengan benar sebelum mengirim registrasi.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className={`px-6 py-3 rounded-lg transition-colors flex items-center ${isLoading
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                        } text-white`}
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                          Memproses...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Kirim Registrasi
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleDraft}
                      disabled={isLoading}
                      className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center disabled:opacity-50"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Simpan Draft
                    </button>
                    <button
                      onClick={handleReset}
                      disabled={isLoading}
                      className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center disabled:opacity-50"
                    >
                      <FileX className="w-4 h-4 mr-2" />
                      Reset Form
                    </button>
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