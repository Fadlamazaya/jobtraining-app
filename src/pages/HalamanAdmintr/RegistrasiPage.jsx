import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, Clock, Users, Upload, FileText, User, Building, Save, Send, FileX, Eye, Info, Plus, Trash2, ArrowLeft, Download } from 'lucide-react';
import { collection, serverTimestamp, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
// HAPUS: import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../../firebaseConfig'; // TETAPKAN IMPORT db


// --- KONSTANTA CLOUDINARY (Ganti dengan data Anda) ---
const CLOUDINARY_CLOUD_NAME = 'dmzybtzsr'; // Ganti dengan Cloud Name Anda
const CLOUDINARY_UPLOAD_PRESET = 'jt_uploads'; // Ganti dengan Unsigned Preset Anda

// Catatan: Pastikan Cloudinary upload preset 'jt_uploads' adalah *unsigned*.

// --- FUNGSI UTILITAS ---
const isTimeOverlap = (start1, end1, start2, end2) => {
    // Fungsi isTimeOverlap tetap sama
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

const generateNoReg = () => {
    // Fungsi generateNoReg tetap sama
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `REG-${year}${month}${date}-${random}`;
};

// --- FUNGSI UPLOAD KE CLOUDINARY ---
// --- FUNGSI UPLOAD KE CLOUDINARY (Diperbarui untuk Public ID yang aman) ---
const uploadFileToCloudinary = async (file, noReg) => {
    if (!file) return null;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    // 💡 PERBAIKAN PEMBERSIHAN NAMA FILE:
    const originalFileName = file.name;
    const parts = originalFileName.split('.');
    
    // Hapus ekstensi terakhir dari nama file
    const fileExtension = parts.length > 1 ? '.' + parts.pop() : ''; 
    const baseFileName = parts.join('.'); 

    // Bersihkan nama file: Hapus karakter non-alfanumerik/spasi/tanda baca, ganti spasi/titik dengan underscore
    const cleanedBaseName = baseFileName
        .replace(/[^a-zA-Z0-9\s-]/g, '') // Hapus karakter ilegal
        .replace(/[\s\.]/g, '_') // Ganti spasi/titik dengan underscore
        .toLowerCase();

    // Gabungkan NoReg dengan nama file yang bersih. Cloudinary akan menambahkan ekstensi file aslinya.
    const publicIdWithFolder = `materi_training/${noReg}_${cleanedBaseName}`;
    
    formData.append('public_id', publicIdWithFolder);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;

    try {
        const response = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Gagal mengunggah file ke Cloudinary');
        }

        const data = await response.json();
        // Mengembalikan URL yang aman (seperti Secure URL) untuk disimpan di Firestore
        return data.secure_url; 
    } catch (error) {
        console.error('Error saat upload ke Cloudinary:', error);
        throw error;
    }
};


// ... (InstrukturInternalSearchInput dan InstrukturField tetap sama)
const InstrukturInternalSearchInput = ({ index, field, value, placeholder, internalInstructors, onSelect, currentInstrukturDetails }) => {
    const [searchTerm, setSearchTerm] = useState(value);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        setSearchTerm(value);
    }, [value]);

    const handleChange = (e) => {
        const newValue = e.target.value;
        setSearchTerm(newValue);

        if (newValue.length > 0) {
            const filtered = internalInstructors.filter(user =>
                (user.name.toLowerCase().includes(newValue.toLowerCase()) && field === 'nama') ||
                (user.nik.toLowerCase().includes(newValue.toLowerCase()) && field === 'nikInstansi')
            ).filter(user => {
                const isAlreadySelected = currentInstrukturDetails.some((detail, i) =>
                    i !== index && (detail.nama === user.name || detail.nikInstansi === user.nik)
                );
                return !isAlreadySelected;
            });

            setSuggestions(filtered.slice(0, 10));
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
            onSelect(index, field, '');
        }
    };

    const handleSelect = (user) => {
        onSelect(index, 'nama', user.name);
        onSelect(index, 'nikInstansi', user.nik);
        setSearchTerm(field === 'nama' ? user.name : user.nik);
        setSuggestions([]);
        setShowSuggestions(false);
    };

    const handleBlur = () => {
        setTimeout(() => {
            setShowSuggestions(false);

            if (searchTerm.length > 0) {
                const foundUser = internalInstructors.find(user =>
                    (user.name === searchTerm && field === 'nama') ||
                    (user.nik === searchTerm && field === 'nikInstansi')
                );

                if (!foundUser) {
                    onSelect(index, field, '');
                } else {
                    if (field === 'nama' && currentInstrukturDetails[index].nikInstansi !== foundUser.nik) {
                        onSelect(index, 'nikInstansi', foundUser.nik);
                    } else if (field === 'nikInstansi' && currentInstrukturDetails[index].nama !== foundUser.name) {
                        onSelect(index, 'nama', foundUser.name);
                    }
                }
            }
        }, 200);
    };

    return (
        <div className="relative w-full">
            <input
                type="text"
                value={searchTerm}
                onChange={handleChange}
                onFocus={() => { if (searchTerm.length > 0) setShowSuggestions(true); }}
                onBlur={handleBlur}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={placeholder}
                required
                autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto">
                    {suggestions.map((user, idx) => (
                        <li
                            key={user.nik}
                            onMouseDown={(e) => { e.preventDefault(); handleSelect(user); }}
                            className="p-3 cursor-pointer hover:bg-blue-50 flex justify-between items-center text-sm border-b last:border-b-0"
                        >
                            <span>
                                {field === 'nama' ? <strong className="text-blue-600">{user.name}</strong> : user.name}
                                <span className="text-gray-500 block text-xs">
                                    {field === 'nikInstansi' ? `NIK: ` : ` | NIK: `}
                                    {field === 'nikInstansi' ? <strong className="text-blue-600">{user.nik}</strong> : user.nik}
                                </span>
                            </span>
                            <span className="text-xs text-gray-400 ml-2">{user.areaKerja}</span>
                        </li>
                    ))}
                </ul>
            )}
            {showSuggestions && searchTerm.length > 0 && suggestions.length === 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 p-3 text-sm text-red-500">
                    Tidak ada nama/NIK yang cocok ditemukan.
                </div>
            )}
        </div>
    );
};


const InstrukturField = ({ index, detail, generalInfo, handleInstrukturDetailChange, internalInstructors, removeInstrukturField }) => {
    const isInternal = generalInfo.instrukturType === 'internal';

    return (
        <div className="flex flex-col md:flex-row gap-4 border p-4 rounded-lg bg-white relative">
            <h4 className="absolute -top-3 left-4 bg-gray-50 px-2 text-sm font-medium text-blue-600">Instruktur #{index + 1}</h4>

            <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Instruktur *</label>
                {isInternal ? (
                    <InstrukturInternalSearchInput
                        index={index}
                        field="nama"
                        value={detail.nama}
                        placeholder="Ketik nama instruktur..."
                        internalInstructors={internalInstructors}
                        onSelect={handleInstrukturDetailChange}
                        currentInstrukturDetails={generalInfo.instrukturDetails}
                    />
                ) : (
                    <input
                        type="text"
                        value={detail.nama}
                        onChange={(e) => handleInstrukturDetailChange(index, 'nama', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Masukkan nama instruktur"
                        required
                    />
                )}
            </div>

            <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">{isInternal ? 'NIK *' : 'Asal Instansi *'}</label>
                <div className="flex items-center gap-2">
                    {isInternal ? (
                        <InstrukturInternalSearchInput
                            index={index}
                            field="nikInstansi"
                            value={detail.nikInstansi}
                            placeholder="Ketik NIK..."
                            internalInstructors={internalInstructors}
                            onSelect={handleInstrukturDetailChange}
                            currentInstrukturDetails={generalInfo.instrukturDetails}
                        />
                    ) : (
                        <input
                            type="text"
                            value={detail.nikInstansi}
                            onChange={(e) => handleInstrukturDetailChange(index, 'nikInstansi', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Masukkan Nama Instansi"
                            required
                        />
                    )}
                    {generalInfo.jumlahInstruktur > 1 && (
                        <button onClick={() => removeInstrukturField(index)} type="button" className="p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex-shrink-0">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};


// ... (ParticipantSearchInput tetap sama)
const ParticipantSearchInput = ({ index, field, value, placeholder, internalInstructors, onSelect, currentParticipantDetails }) => {
    const [searchTerm, setSearchTerm] = useState(value);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        setSearchTerm(value);
    }, [value]);

    const handleChange = (e) => {
        const newValue = e.target.value;
        setSearchTerm(newValue);

        if (newValue.length > 0) {
            // Logika pencarian: mencari nama, NIK, area, atau posisi yang mengandung searchTerm
            const filtered = internalInstructors.filter(user =>
                (user.name.toLowerCase().includes(newValue.toLowerCase()) && field === 'nama') ||
                (user.nik.toLowerCase().includes(newValue.toLowerCase()) && field === 'nik') ||
                (user.areaKerja.toLowerCase().includes(newValue.toLowerCase()) && field === 'unit') ||
                (user.position.toLowerCase().includes(newValue.toLowerCase()) && field === 'position')
            ).filter(user => {
                // Filter peserta yang sudah dipilih (kecuali kolom saat ini)
                const isAlreadySelected = currentParticipantDetails.some((detail, i) =>
                    i !== index && (detail.nik === user.nik)
                );
                return !isAlreadySelected;
            });

            setSuggestions(filtered.slice(0, 10)); // Batasi 10 saran
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
            // Panggil onSelect dengan data kosong jika input dikosongkan
            onSelect(index, field, '');
        }
    };

    // 💡 PERBAIKAN FUNGSI INI
    const handleSelect = (user) => {
        // Panggil onSelect untuk MENGISI SEMUA field dengan data yang unik dan benar dari saran yang diklik
        onSelect(index, 'nama', user.name);
        onSelect(index, 'nik', user.nik);
        onSelect(index, 'position', user.position);
        onSelect(index, 'unit', user.areaKerja);

        // Tetapkan tampilan input ke nilai yang baru saja dipilih
        setSearchTerm(field === 'nama' ? user.name : field === 'nik' ? user.nik : field === 'unit' ? user.areaKerja : user.position);
        setSuggestions([]);
        setShowSuggestions(false);
    };

    const handleBlur = () => {
        setTimeout(() => {
            setShowSuggestions(false);

            // Logika validasi dan autofill saat blur
            if (searchTerm.length > 0) {
                const foundUser = internalInstructors.find(user =>
                    (user.name === searchTerm && field === 'nama') ||
                    (user.nik === searchTerm && field === 'nik') ||
                    (user.areaKerja === searchTerm && field === 'unit') ||
                    (user.position === searchTerm && field === 'position')
                );

                if (!foundUser) {
                    // Jika tidak ada di database, clear input (sesuai permintaan)
                    onSelect(index, 'nama', '');
                    onSelect(index, 'nik', '');
                    onSelect(index, 'unit', '');
                    onSelect(index, 'position', '');
                } else {
                    // Jika ada di database, pastikan semua field terisi otomatis
                    onSelect(index, 'nama', foundUser.name);
                    onSelect(index, 'nik', foundUser.nik);
                    onSelect(index, 'unit', foundUser.areaKerja);
                    onSelect(index, 'position', foundUser.position);
                }
            }
        }, 200);
    };

    return (
        <div className="relative w-full">
            <input
                type="text"
                value={searchTerm}
                onChange={handleChange}
                onFocus={() => { if (searchTerm.length > 0) setShowSuggestions(true); }}
                onBlur={handleBlur}
                className="w-full p-2 border border-blue-200 rounded focus:ring-1 focus:ring-blue-500"
                placeholder={placeholder}
                required
                autoComplete="off"
                disabled={(field === 'unit' || field === 'position') && currentParticipantDetails[index].nik.length > 0 && field !== 'unit' && field !== 'position'}
            />
            {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto">
                    {suggestions.map((user, idx) => (
                        // 💡 Memasukkan seluruh objek user ke onMouseDown untuk memastikan data unik terambil
                        <li
                            key={user.nik}
                            onMouseDown={(e) => { e.preventDefault(); handleSelect(user); }}
                            className="p-3 cursor-pointer hover:bg-blue-50 flex flex-col items-start text-sm border-b last:border-b-0"
                        >
                            <span className="font-semibold text-blue-600">{user.name}</span>
                            <span className="text-xs text-gray-600">NIK: {user.nik} | **Posisi:** {user.position} | Area: {user.areaKerja}</span>
                        </li>
                    ))}
                </ul>
            )}
            {showSuggestions && searchTerm.length > 0 && suggestions.length === 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 p-3 text-sm text-red-500">
                    Nama/NIK/Area/Posisi tidak ditemukan di database.
                </div>
            )}
        </div>
    );
};

// ... (Rest of the component code)

const RegistrasiPage = () => {
    // ... (States remains the same)
    const [activeTab, setActiveTab] = useState('general');
    const [showPreview, setShowPreview] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [scheduledRooms, setScheduledRooms] = useState([]);
    const [isScheduleLoading, setIsScheduleLoading] = useState(true);

    const [managerList, setManagerList] = useState([]);
    const [isManagerLoading, setIsManagerLoading] = useState(true);

    // State untuk menyimpan SEMUA daftar user/instruktur internal
    const [internalInstructors, setInternalInstructors] = useState([]);

    // State untuk General Info
    const [generalInfo, setGeneralInfo] = useState({
        noReg: generateNoReg(), judulTraining: '', area: '', kelasTraining: '',
        tanggalMulai: '', tanggalSelesai: '', jamMulai: '', jamSelesai: '',
        instrukturType: '',
        jumlahInstruktur: 1,
        instrukturDetails: [{ nama: '', nikInstansi: '' }], // nikInstansi akan menyimpan NIK atau Instansi
        materi: null, // File object for upload
        approvalManager: '', lastApproval: 'Department Head'
    });

    // State untuk Participant
    const [participantInfo, setParticipantInfo] = useState({
        selectedRole: 'T', // Default ke 'T' (Trainee)
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

    // --- FETCH DATA (Sama) ---
    useEffect(() => {
        const fetchManagers = async () => {
            setIsManagerLoading(true);
            try {
                // Ambil Manager untuk dropdown Approval
                const qManager = query(collection(db, 'users'), where('position', '==', 'Manager'));
                const snapshotManager = await getDocs(qManager);
                const managers = snapshotManager.docs.map(doc => {
                    const data = doc.data();
                    return { name: data.name, nik: data.nik, areaKerja: data.areaKerja, position: data.position };
                });
                setManagerList(managers);

                // Ambil SEMUA Users untuk Instruktur Internal & Peserta
                const qUsers = query(collection(db, 'users'));
                const snapshotUsers = await getDocs(qUsers);
                const users = snapshotUsers.docs.map(doc => {
                    const data = doc.data();
                    // 💡 Memasukkan 'position' ke state internalInstructors
                    return { name: data.name, nik: data.nik, areaKerja: data.areaKerja, position: data.position };
                });
                setInternalInstructors(users.sort((a, b) => a.name.localeCompare(b.name)));

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsManagerLoading(false);
            }
        };
        const fetchApprovedSchedules = async () => {
            setIsScheduleLoading(true);
            try {
                const q = query(collection(db, 'trainingapp'), where('status', '==', 'approved')); // Pastikan menggunakan 'approved' jika itu status yang Anda simpan
                const snapshot = await getDocs(q);
                const schedules = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return { room: data.kelasTraining, dateStart: data.tanggalMulai, dateEnd: data.tanggalSelesai, timeStart: data.jamMulai, timeEnd: data.jamSelesai, };
                });
                setScheduledRooms(schedules);
            } catch (error) {
                console.error("Error fetching approved schedules:", error);
            } finally {
                setIsScheduleLoading(false);
            }
        };
        fetchManagers();
        fetchApprovedSchedules();
        setGeneralInfo(prev => ({ ...prev, noReg: generateNoReg() }));
    }, []);

    // ... (useEffect for totalHari/totalJam and isRoomAvailable remains the same)
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

    // ... (All Handlers: Instruktur, Participant, Reset, Draft remains the same)
    const handleJumlahInstrukturChange = (value) => {
        const newJumlah = parseInt(value);
        if (isNaN(newJumlah) || newJumlah < 1) return;

        setGeneralInfo(prev => {
            const currentDetails = prev.instrukturDetails;
            let newDetails;

            if (newJumlah > currentDetails.length) {
                const diff = newJumlah - currentDetails.length;
                const newInstructors = Array.from({ length: diff }, () => ({ nama: '', nikInstansi: '' }));
                newDetails = [...currentDetails, ...newInstructors];
            } else if (newJumlah < currentDetails.length) {
                newDetails = currentDetails.slice(0, newJumlah);
            } else {
                newDetails = currentDetails;
            }

            return { ...prev, jumlahInstruktur: newJumlah, instrukturDetails: newDetails, };
        });
    };

    const handleInstrukturDetailChange = useCallback((index, field, value) => {
        setGeneralInfo(prev => {
            const updatedDetails = prev.instrukturDetails.map((detail, i) => {
                if (i === index) {
                    if (prev.instrukturType === 'internal') {
                        if (field === 'nama') {
                            const foundUser = internalInstructors.find(user => user.name === value);
                            return { ...detail, [field]: value, nikInstansi: foundUser ? foundUser.nik : detail.nikInstansi };
                        }
                        else if (field === 'nikInstansi') {
                            const foundUser = internalInstructors.find(user => user.nik === value);
                            return { ...detail, [field]: value, nama: foundUser ? foundUser.name : detail.nama };
                        }
                    }
                    return { ...detail, [field]: value };
                }
                return detail;
            });

            return { ...prev, instrukturDetails: updatedDetails };
        });
    }, [internalInstructors]);

    const addInstrukturField = () => {
        handleJumlahInstrukturChange(generalInfo.jumlahInstruktur + 1);
    };

    const removeInstrukturField = (index) => {
        if (generalInfo.jumlahInstruktur <= 1) return;

        setGeneralInfo(prev => ({
            ...prev,
            jumlahInstruktur: prev.jumlahInstruktur - 1,
            instrukturDetails: prev.instrukturDetails.filter((_, i) => i !== index),
        }));
    };

    // --- HANDLER UTAMA ---
    const handleGeneralInfoChange = (field, value) => { setGeneralInfo(prev => ({ ...prev, [field]: value })); };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setGeneralInfo(prev => ({ ...prev, materi: file }));
        } else {
            setGeneralInfo(prev => ({ ...prev, materi: null }));
        }
    };

    // --- HANDLER PESERTA ---
    const handleParticipantChange = useCallback((index, field, value) => {
        setParticipantInfo(prev => {
            const updatedParticipants = prev.participants.map((p, i) => {
                if (i === index) {
                    // Cek di internalInstructors untuk autofill
                    if (field === 'nama' || field === 'nik' || field === 'unit' || field === 'position') {
                        let foundUser = null;

                        // Kunci utama autofill adalah menemukan user berdasarkan value yang diinput/dipilih
                        if (field === 'nama') {
                            foundUser = internalInstructors.find(user => user.name === value);
                        } else if (field === 'nik') {
                            foundUser = internalInstructors.find(user => user.nik === value);
                        } else if (field === 'position') {
                            // Mencari berdasarkan posisi, tapi ini kurang unik, lebih baik fokus pada nama/nik
                            foundUser = internalInstructors.find(user => user.position === value && user.nik === p.nik);
                        } else if (field === 'unit') {
                            // Mencari berdasarkan unit, tapi ini kurang unik
                            foundUser = internalInstructors.find(user => user.areaKerja === value && user.nik === p.nik);
                        }

                        // Perbaikan: Jika ditemukan user, gunakan data tersebut untuk mengisi semua field
                        if (foundUser) {
                            return {
                                ...p,
                                nama: foundUser.name,
                                nik: foundUser.nik,
                                unit: foundUser.areaKerja,
                                position: foundUser.position,
                                role: 'T'
                            };
                        }

                        // Jika tidak ada user yang ditemukan (misal user masih mengetik), perbarui hanya field yang sedang diketik
                        return { ...p, [field]: value, role: 'T' };
                    }
                    // Jika field lain yang diubah (tidak mungkin di kasus ini karena role fix)
                    return { ...p, [field]: value, role: 'T' };
                }
                return p;
            });

            return { ...prev, participants: updatedParticipants };
        });
    }, [internalInstructors]);

    const handleTempParticipantChange = (field, value) => {
        setParticipantInfo(prev => ({ ...prev, [field]: value }));
    };

    const generateParticipants = () => {
        const jumlah = parseInt(participantInfo.jumlahPeserta);

        if (jumlah > 0) {
            const newParticipants = Array.from({ length: jumlah }, () => ({
                nama: '', nik: '', role: 'T', unit: '', position: ''
            }));
            setParticipantInfo(prev => ({
                ...prev,
                participants: [...prev.participants, ...newParticipants],
                jumlahPeserta: ''
            }));
        }
    };

    const addMoreParticipants = () => {
        const jumlah = parseInt(participantInfo.jumlahPeserta);
        if (isNaN(jumlah) || jumlah <= 0) {
            alert('Mohon masukkan jumlah Trainee yang valid (min 1).');
            return;
        }
        generateParticipants();
    };

    const removeParticipant = (index) => { setParticipantInfo(prev => ({ ...prev, participants: prev.participants.filter((_, i) => i !== index) })); };

    const handleSubmit = () => {
        if (participantInfo.participants.length === 0) { alert('Mohon tambahkan minimal 1 peserta'); return; }

        // Pastikan Nama/NIK/Posisi/Unit terisi DAN NIK/Nama ada di database
        const incompleteParticipants = participantInfo.participants.some(p => !p.nama || !p.nik || !p.unit || !p.position);
        if (incompleteParticipants) { alert('Mohon lengkapi data semua peserta'); return; }

        const invalidInternalParticipants = participantInfo.participants.some(p => {
            // Cek apakah NIK atau Nama peserta ada di master list (termasuk Posisi)
            return !internalInstructors.some(user => user.nik === p.nik && user.name === p.nama && user.areaKerja === p.unit && user.position === p.position);
        });

        if (invalidInternalParticipants) {
            alert('Data Peserta (Nama, NIK, Posisi, dan Unit) harus sesuai dengan data Trainee Internal yang ada di database.');
            return;
        }

        setShowPreview(true); // Memunculkan preview
    };

    const handleDraft = () => { alert('Data berhasil disimpan sebagai draft'); };

    const handleReset = () => {
        setGeneralInfo(prev => ({
            ...prev, noReg: generateNoReg(), judulTraining: '', area: '', kelasTraining: '', tanggalMulai: '', tanggalSelesai: '', jamMulai: '', jamSelesai: '', instrukturType: '',
            jumlahInstruktur: 1, instrukturDetails: [{ nama: '', nikInstansi: '' }],
            materi: null, approvalManager: ''
        }));
        setParticipantInfo({ selectedRole: 'T', jumlahPeserta: '', participants: [] });
        setActiveTab('general');
    };

    const isInstrukturValid = useCallback(() => {
        if (!generalInfo.instrukturType) return false;

        const allDetailsFilled = generalInfo.instrukturDetails.every(detail =>
            detail.nama && detail.nikInstansi
        );

        if (!allDetailsFilled) return false;

        if (generalInfo.instrukturType === 'internal') {
            const allInternalValid = generalInfo.instrukturDetails.every(detail => {
                const foundByName = internalInstructors.some(user => user.name === detail.nama && user.nik === detail.nikInstansi);
                return foundByName;
            });
            return allInternalValid;
        }

        return true;
    }, [generalInfo.instrukturType, generalInfo.instrukturDetails, internalInstructors]);


    const isGeneralFormValid = useMemo(() => {
        const required = ['judulTraining', 'area', 'kelasTraining', 'tanggalMulai', 'tanggalSelesai', 'jamMulai', 'jamSelesai', 'instrukturType', 'approvalManager'];
        const isBasicValid = required.every(field => generalInfo[field]);
        return isBasicValid && isInstrukturValid();
    }, [generalInfo, isInstrukturValid]);

    const handleParticipantTabClick = () => {
        if (!isGeneralFormValid) { setShowAlert(true); setTimeout(() => setShowAlert(false), 3000); return; }
        setActiveTab('participant');
    };


    const handleSaveGeneral = () => {
        if (!isGeneralFormValid) {
            setShowAlert(true);
            alert('Mohon lengkapi semua kolom wajib, termasuk detail instruktur yang valid dari database.');
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

    // --- FUNGSI SUBMIT FINAL (UPDATED) ---
    const handleFinalSubmit = async () => {
        setIsLoading(true);
        let materiURL = null;

        try {
            const { materi, noReg, ...generalInfoToSave } = generalInfo;

            // 💡 LANGKAH 1: UPLOAD FILE KE CLOUDINARY
            if (materi) {
                materiURL = await uploadFileToCloudinary(materi, noReg);
                console.log("File uploaded to Cloudinary, URL:", materiURL);
            }

            const registrationData = {
                ...generalInfoToSave,
                noReg: noReg,
                participants: participantInfo.participants,
                totalHari: totalHari, totalJam: totalJam,
                materiFileName: generalInfo.materi ? generalInfo.materi.name : null,
                materiURL: materiURL, // 💡 URL Unduhan dari Cloudinary
                status: 'pending',
                createdAt: serverTimestamp(),

                // Tambahan data untuk Manager Review
                namaInstruktur: generalInfo.instrukturDetails?.[0]?.nama || 'N/A',
                instrukturNikOrInstansi: generalInfo.instrukturDetails?.[0]?.nikInstansi || 'N/A',
                submittedBy: 'Current User' // Ganti dengan user yang sedang login
            };

            // 💡 LANGKAH 2: Menggunakan setDoc dengan ID dokumen adalah noReg
            const docRef = doc(db, 'trainingapp', noReg);
            await setDoc(docRef, registrationData);

            alert(`Registrasi berhasil dikirim! ID Dokumen (No. Registrasi): ${noReg}.`);
            handleReset();

        } catch (error) {
            console.error('Error saat menyimpan registrasi: ', error);
            alert(`Gagal mengirim registrasi. Error: ${error.message || 'Cek console untuk detail'}`);
        } finally {
            setIsLoading(false);
            setShowPreview(false);
        }
    };
    // ... (InstructorSummary dan RegistrationPreview tetap sama)
    const InstructorSummary = () => {
        const { instrukturType, instrukturDetails, jumlahInstruktur } = generalInfo;
        const typeLabel = instrukturType === 'internal' ? 'NIK' : 'Instansi';

        if (instrukturDetails.length === 0) {
            return <p className="text-sm text-red-500">Detail Instruktur Belum Diisi.</p>;
        }

        return (
            <div className="bg-white p-4 border border-blue-200 rounded-lg shadow-sm">
                <h4 className="font-semibold text-blue-800 flex items-center mb-2"><User className="w-4 h-4 mr-2" />Instruktur ({instrukturType.toUpperCase()} - {jumlahInstruktur} orang)</h4>
                {instrukturDetails.map((detail, index) => (
                    <div key={index} className="text-sm text-gray-600 mt-1 pl-6">
                        <p><span className="font-medium">{index + 1}. {detail.nama || 'Nama Belum Diisi'}</span></p>
                        <p className="text-xs italic pl-2">{typeLabel}: {detail.nikInstansi || 'N/A'}</p>
                    </div>
                ))}
            </div>
        );
    };

    // --- KOMPONEN PREVIEW SESUAI GAMBAR DARI USER (TETAP SAMA) ---
    const RegistrationPreview = () => {
        const isInternal = generalInfo.instrukturType === 'internal';
        const firstInstruktur = generalInfo.instrukturDetails[0] || {};

        const formatDateRange = (start, end) => `${start || 'N/A'} s/d ${end || 'N/A'}`;

        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
                <div className="max-w-4xl mx-auto border border-blue-100 rounded-xl shadow-2xl p-8 bg-white">
                    <h2 className="text-3xl font-bold text-blue-700 mb-6 border-b pb-3 flex items-center">
                        <Eye className="mr-3 text-blue-500" />
                        Pratinjau Data Registrasi
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 text-sm mb-8">

                        <div className="space-y-3">
                            <h3 className="font-bold text-lg text-blue-600 border-b-2 border-blue-200 pb-1 mb-2">I. Informasi Umum</h3>
                            <p><span className="font-medium text-gray-700">No. Registrasi:</span> {generalInfo.noReg}</p>
                            <p><span className="font-medium text-gray-700">Judul Training:</span> {generalInfo.judulTraining}</p>
                            <p><span className="font-medium text-gray-700">Area/Unit:</span> {generalInfo.area}</p>
                            <p><span className="font-medium text-gray-700">Kelas:</span> {generalInfo.kelasTraining}</p>
                            <p><span className="font-medium text-gray-700">Approval Manager:</span> {generalInfo.approvalManager}</p>
                            <p className="pt-2 text-xs font-medium text-gray-700">File Materi: {generalInfo.materi ? <span className='text-green-600'>✅ Terupload ({generalInfo.materi.name})</span> : 'Tidak Ada'}</p>
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-bold text-lg text-blue-600 border-b-2 border-blue-200 pb-1 mb-2">II. Jadwal & Instruktur</h3>
                            <p><span className="font-medium text-gray-700">Tanggal:</span> {formatDateRange(generalInfo.tanggalMulai, generalInfo.tanggalSelesai)}</p>
                            <p><span className="font-medium text-gray-700">Jam:</span> {generalInfo.jamMulai} - {generalInfo.jamSelesai}</p>
                            <p><span className="font-medium text-gray-700">Durasi:</span> {totalHari} hari / {totalJam.toFixed(1)} jam</p>

                            <div className="border-t pt-2 mt-2">
                                <p><span className="font-medium text-gray-700">Instruktur:</span> {firstInstruktur.nama} ({generalInfo.instrukturType})</p>
                                <p className="text-xs text-gray-500 pl-2">
                                    {isInternal ? `NIK: ${firstInstruktur.nikInstansi}` : `Instansi: ${firstInstruktur.nikInstansi}` || 'N/A'}
                                </p>

                                {generalInfo.jumlahInstruktur > 1 && (
                                    <p className="text-xs italic text-blue-500 pt-1">+{generalInfo.jumlahInstruktur - 1} Instruktur tambahan.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tabel Peserta */}
                    <div className="mb-8">
                        <h3 className="font-bold text-lg text-blue-600 border-b-2 border-blue-200 pb-1 mb-3 flex items-center">
                            <Users className="w-5 h-5 mr-2 text-blue-500" />
                            III. Peserta ({participantInfo.participants.length} Orang)
                        </h3>
                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="bg-blue-50 text-blue-700 font-semibold border-b border-gray-200">
                                        <th className="p-3 border-r border-gray-200">No</th>
                                        <th className="p-3 border-r border-gray-200">Nama</th>
                                        <th className="p-3 border-r border-gray-200">NIK</th>
                                        <th className="p-3 border-r border-gray-200">Posisi</th>
                                        <th className="p-3 border-r border-gray-200">Role</th>
                                        <th className="p-3">Unit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {participantInfo.participants.map((p, index) => (
                                        <tr key={index} className="odd:bg-white even:bg-gray-50 hover:bg-blue-100 transition-colors border-b border-gray-200 last:border-b-0">
                                            <td className="p-3 border-r border-gray-200 text-center">{index + 1}</td>
                                            <td className="p-3 border-r border-gray-200">{p.nama}</td>
                                            <td className="p-3 border-r border-gray-200">{p.nik}</td>
                                            <td className="p-3 border-r border-gray-200">{p.position}</td>
                                            <td className="p-3 border-r border-gray-200 font-medium text-center">{p.role}</td>
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
                        <button
                            onClick={handleFinalSubmit}
                            disabled={isLoading}
                            className={`px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-lg flex items-center space-x-2 disabled:opacity-50`}
                        >
                            {isLoading ? (<><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span>Mengirim...</span></>) : (<><Send className="w-5 h-5" /><span>Kirim Registrasi</span></>)}
                        </button>
                    </div>
                </div>
            </div>
        );
    };


    // --- START JSX RENDER UTAMA ---

    if (showPreview) {
        return <RegistrationPreview />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
            {showAlert && (<div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce"><div className="flex items-center"><div className="w-5 h-5 border-2 border-white rounded-full flex items-center justify-center mr-3"><span className="text-xs font-bold">!</span></div>Semua kolom wajib diisi terlebih dahulu.</div></div>)}

            <div className="container mx-auto p-4 lg:p-6">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white p-6 shadow-md">
                        <h1 className="text-3xl font-bold">Registrasi Training</h1>
                        <p className="text-blue-100 mt-2">Silakan lengkapi form registrasi training di bawah ini</p>
                    </div>

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

                    <div className="p-4 lg:p-8">
                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-blue-900 mb-6">General Information</h2>

                                <div><label className="block text-sm font-medium text-blue-700 mb-2">No. Registrasi</label><input type="text" value={generalInfo.noReg} disabled className="w-full p-3 border border-blue-200 rounded-lg bg-gray-100 text-gray-600" /></div>
                                <div><label className="block text-sm font-medium text-blue-700 mb-2">Judul Training *</label><input type="text" value={generalInfo.judulTraining} onChange={(e) => handleGeneralInfoChange('judulTraining', e.target.value)} className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Masukkan judul training" /></div>
                                <div><label className="block text-sm font-medium text-blue-700 mb-2">Area/Unit *</label><select value={generalInfo.area} onChange={(e) => handleGeneralInfoChange('area', e.target.value)} className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"><option value="">Pilih Area/Unit</option>{areaOptions.map(area => (<option key={area} value={area}>{area}</option>))}</select></div>

                                <div>
                                    <label className="block text-sm font-medium text-blue-700 mb-2">Kelas Training *</label>
                                    <select
                                        value={generalInfo.kelasTraining}
                                        onChange={(e) => handleGeneralInfoChange('kelasTraining', e.target.value)}
                                        className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <RoomOptions />
                                    </select>
                                    {generalInfo.kelasTraining && !isRoomAvailable(generalInfo.kelasTraining) && (
                                        <p className="text-sm text-red-500 mt-2">⚠️ Peringatan: Kelas ini BENTROK dengan jadwal lain pada tanggal/jam yang sama.</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div><label className="block text-sm font-medium text-blue-700 mb-2">Tanggal Mulai *</label><input type="date" value={generalInfo.tanggalMulai} onChange={(e) => handleGeneralInfoChange('tanggalMulai', e.target.value)} className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                                    <div><label className="block text-sm font-medium text-blue-700 mb-2">Tanggal Selesai *</label><input type="date" value={generalInfo.tanggalSelesai} onChange={(e) => handleGeneralInfoChange('tanggalSelesai', e.target.value)} className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                                    <div><label className="block text-sm font-medium text-blue-700 mb-2">Jam Mulai *</label><input type="time" value={generalInfo.jamMulai} onChange={(e) => handleGeneralInfoChange('jamMulai', e.target.value)} className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                                    <div><label className="block text-sm font-medium text-blue-700 mb-2">Jam Selesai *</label><input type="time" value={generalInfo.jamSelesai} onChange={(e) => handleGeneralInfoChange('jamSelesai', e.target.value)} className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                                </div>

                                {totalHari > 0 && (<div className="bg-blue-50 p-4 rounded-lg"><div className="flex items-center space-x-4"><div className="flex items-center"><Calendar className="w-5 h-5 text-blue-600 mr-2" /><span className="text-blue-800 font-medium">Total Hari: {totalHari} hari</span></div><div className="flex items-center"><Clock className="w-5 h-5 text-blue-600 mr-2" /><span className="text-blue-800 font-medium">Total Jam: {totalJam.toFixed(1)} jam</span></div></div></div>)}

                                <div>
                                    <label className="block text-sm font-medium text-blue-700 mb-2">Tipe Instruktur *</label>
                                    <select
                                        value={generalInfo.instrukturType}
                                        onChange={(e) => handleGeneralInfoChange('instrukturType', e.target.value)}
                                        className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
                                    >
                                        <option value="">Pilih Tipe Instruktur</option><option value="internal">Internal</option><option value="external">External</option>
                                    </select>

                                    {generalInfo.instrukturType && (
                                        <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-blue-500">
                                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Detail Instruktur {generalInfo.instrukturType === 'internal' ? 'Internal' : 'External'}</h3>

                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Instruktur *</label>
                                                <div className="flex items-center space-x-2">
                                                    <input
                                                        type="number"
                                                        value={generalInfo.jumlahInstruktur}
                                                        onChange={(e) => handleJumlahInstrukturChange(e.target.value)}
                                                        className="w-20 px-4 py-3 border border-gray-300 rounded-lg text-center"
                                                        min="1"
                                                    />
                                                    <button onClick={addInstrukturField} type="button" className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"><Plus className="w-4 h-4" /></button>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                {generalInfo.instrukturDetails.map((detail, index) => (
                                                    <InstrukturField
                                                        key={index}
                                                        index={index}
                                                        detail={detail}
                                                        generalInfo={generalInfo}
                                                        handleInstrukturDetailChange={handleInstrukturDetailChange}
                                                        internalInstructors={internalInstructors}
                                                        removeInstrukturField={removeInstrukturField}
                                                    />
                                                ))}
                                            </div>

                                        </div>
                                    )}
                                </div>

                                {/* Upload Materi (Tampilan sudah diperbaiki) */}
                                <div><label className="block text-sm font-medium text-blue-700 mb-2">Materi Training</label>
                                    <div className="flex items-center space-x-4"><label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                                        <Upload className="w-6 h-6 text-blue-500 mr-2" /><span className="text-blue-600">Upload file (PPT, Word, PDF)</span><input type="file" accept=".ppt,.pptx,.doc,.docx,.pdf" onChange={handleFileUpload} className="hidden" /></label>
                                    </div>{generalInfo.materi && (<p className="text-sm text-green-600 mt-2 flex items-center">✅ File terupload: {generalInfo.materi.name}</p>)}</div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-blue-700 mb-2">Approval Manager *</label>
                                        <select
                                            value={generalInfo.approvalManager}
                                            onChange={(e) => handleGeneralInfoChange('approvalManager', e.target.value)}
                                            className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            disabled={isManagerLoading}
                                        >
                                            {isManagerLoading && <option value="">Memuat daftar Manager...</option>}
                                            {!isManagerLoading && managerList.length === 0 && <option value="">Tidak ada Manager ditemukan</option>}
                                            {!isManagerLoading && managerList.length > 0 && <option value="">Pilih Approval Manager</option>}
                                            {managerList.map(manager => (
                                                <option key={manager.nik} value={`${manager.name} (${manager.areaKerja})`}>
                                                    {manager.name} ({manager.areaKerja})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-blue-700 mb-2">Last Approval</label>
                                        <input type="text" value={generalInfo.lastApproval} disabled className="w-full p-3 border border-blue-200 rounded-lg bg-gray-100 text-gray-600" />
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button onClick={handleSaveGeneral} disabled={!isGeneralFormValid} className={`px-6 py-3 rounded-lg transition-colors flex items-center ${isGeneralFormValid ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`} title={!isGeneralFormValid ? "Mohon lengkapi semua kolom yang wajib diisi dan pastikan detail instruktur internal valid" : ""}>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save & Continue
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'participant' && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-blue-900 mb-6">Participants Information</h2>

                                <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
                                    <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center"><Info className="w-5 h-5 mr-2 text-blue-500" />Ringkasan Instruktur & Training</h3>
                                    <InstructorSummary />

                                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mt-3 border-t pt-3">
                                        <p><span className="font-medium">Judul:</span> {generalInfo.judulTraining || '-'}</p>
                                        <p><span className="font-medium">Area/Unit:</span> {generalInfo.area || '-'}</p>
                                        <p><span className="font-medium">Tanggal:</span> {generalInfo.tanggalMulai || '-'} s/d {generalInfo.tanggalSelesai || '-'}</p>
                                        <p><span className="font-medium">Kelas:</span> {generalInfo.kelasTraining || '-'}</p>
                                    </div>
                                </div>

                                <div className="bg-blue-50 p-6 rounded-lg">
                                    <h3 className="text-lg font-semibold text-blue-800 mb-4">Tambah Peserta Trainee</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className='md:col-span-2'>
                                            <label className="block text-sm font-medium text-blue-700 mb-2">Role Peserta</label>
                                            <input type="text" value="Trainee (T)" disabled className="w-full p-3 border border-blue-200 rounded-lg bg-gray-100 text-gray-600" />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-blue-700 mb-2">Jumlah Trainee *</label>
                                            <input type="number"
                                                value={participantInfo.jumlahPeserta}
                                                onChange={(e) => handleTempParticipantChange('jumlahPeserta', e.target.value)}
                                                className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Masukkan jumlah"
                                                min="1"
                                            />
                                        </div>

                                        <div className="flex items-end md:col-span-3 lg:col-span-1">
                                            <button onClick={addMoreParticipants} disabled={!participantInfo.jumlahPeserta} className={`w-full p-3 rounded-lg transition-colors flex items-center justify-center ${participantInfo.jumlahPeserta > 0 ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
                                                <User className="w-4 h-4 mr-2" />
                                                Tambah Trainee
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {participantInfo.participants.length > 0 && (
                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-semibold text-blue-800">Daftar Peserta Trainee ({participantInfo.participants.length} orang)</h3>
                                            <div className="flex space-x-4 text-sm">
                                                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">Trainee: {participantInfo.participants.filter(p => p.role === 'T').length}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-4 max-h-96 overflow-y-auto">
                                            {participantInfo.participants.map((participant, index) => (
                                                <div key={index} className="bg-white border border-blue-200 p-4 rounded-lg shadow-sm">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <h4 className="font-medium text-blue-700 flex items-center"><span className={`inline-block w-6 h-6 rounded-full text-white text-xs flex items-center justify-center mr-2 bg-green-500`}>T</span>Trainee #{index + 1}</h4>
                                                        <button onClick={() => removeParticipant(index)} className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"><FileX className="w-4 h-4" /></button>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                                                        <div>
                                                            <label className="block text-sm font-medium text-blue-700 mb-1">Nama *</label>
                                                            <ParticipantSearchInput
                                                                index={index}
                                                                field="nama"
                                                                value={participant.nama}
                                                                placeholder="Ketik Nama Trainee..."
                                                                internalInstructors={internalInstructors}
                                                                onSelect={handleParticipantChange}
                                                                currentParticipantDetails={participantInfo.participants}
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-medium text-blue-700 mb-1">NIK *</label>
                                                            <ParticipantSearchInput
                                                                index={index}
                                                                field="nik"
                                                                value={participant.nik}
                                                                placeholder="Ketik NIK Trainee..."
                                                                internalInstructors={internalInstructors}
                                                                onSelect={handleParticipantChange}
                                                                currentParticipantDetails={participantInfo.participants}
                                                            />
                                                        </div>

                                                        {/* KOLOM POSISI (Read-only, terisi otomatis) */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-blue-700 mb-1">Posisi</label>
                                                            <input
                                                                type="text"
                                                                value={participant.position || 'N/A'}
                                                                className="w-full p-2 border border-blue-200 rounded bg-gray-100 text-gray-600 cursor-default"
                                                                disabled
                                                            />
                                                        </div>

                                                        {/* KOLOM UNIT/AREA (Read-only, terisi otomatis) */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-blue-700 mb-1">Unit/Area *</label>
                                                            <input
                                                                type="text"
                                                                value={participant.unit}
                                                                placeholder="Unit/Area..."
                                                                className="w-full p-2 border border-blue-200 rounded bg-gray-100 text-gray-600 cursor-default"
                                                                disabled
                                                            />
                                                        </div>

                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="bg-blue-50 p-6 rounded-lg">
                                    <p className="text-sm text-blue-700 mb-4"><strong>Informasi:</strong> Pastikan semua kolom terisi dengan benar sebelum mengirim registrasi.</p>
                                    <div className="flex flex-wrap gap-4">

                                        <button onClick={handleSubmit} disabled={isLoading} className={`px-6 py-3 rounded-lg transition-colors flex items-center ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white`}>{isLoading ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>Memproses...</>) : (<><Send className="w-5 h-5" /><span>Kirim Registrasi</span></>)}</button>
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