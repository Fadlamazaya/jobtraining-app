import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import UserLayout from "./components/HalamanUser/UserLayout.jsx";
import HRLayout from "./components/HalamanHR/HRLayout.jsx";

// Import Pages
import LoginPage from "./pages/HalamanAdmintr/LoginPage.jsx";
import HomePage from "./pages/HalamanAdmintr/HomePage.jsx";
import RegistrasiPage from "./pages/HalamanAdmintr/RegistrasiPage.jsx";
import ApprovalPage from "./pages/HalamanAdmintr/ApprovalPage.jsx";
import AssesmentPage from "./pages/HalamanAdmintr/AssesmentPage.jsx";

import Dashbaord from "./pages/HalamanNotifikasi/Dashbaord.jsx";
import Reminder from "./pages/HalamanNotifikasi/Reminder.jsx";
import Kompetensi from "./pages/HalamanNotifikasi/Kompetensi.jsx";
import ReminderEnergi from "./pages/HalamanNotifikasi/ReminderEnergi.jsx";
import ReminderWater from "./pages/HalamanNotifikasi/ReminderWater.jsx";
import ReminderEnvironment from "./pages/HalamanNotifikasi/ReminderEnvironment.jsx";
import ReminderRawMaterial from "./pages/HalamanNotifikasi/ReminderRawMaterial.jsx";
import EnergiPower from "./pages/HalamanNotifikasi/EnergiPower.jsx";
import WaterTreatment from "./pages/HalamanNotifikasi/WaterTreatment.jsx";
import Environment from "./pages/HalamanNotifikasi/Environment.jsx";
import RawMaterial from "./pages/HalamanNotifikasi/RawMaterial.jsx";
import KonfirmasiPage from "./pages/HalamanNotifikasi/KonfirmasiPage.jsx";

import EmployeeStatus from "./pages/HalamanUser/EmployeeStatus.jsx";
import TrainingImplementation from "./pages/HalamanUser/TrainingImplementation.jsx";
import TrainingRoom from "./pages/HalamanUser/TrainingRoom.jsx";
import HomePageHR from "./pages/HalamanUser/HomePageHR.jsx";
import TrainingRecords from "./pages/HalamanUser/TrainingRecords.jsx";
import FormEvaluation from "./pages/HalamanUser/FormEvaluation.jsx";
import EmployeeEnergi from "./pages/HalamanUser/EmployeeEnergi.jsx";
import EmployeeWater from "./pages/HalamanUser/EmployeeWater.jsx";
import EmployeeEnvironment from "./pages/HalamanUser/EmployeeEnvironment.jsx";
import EmployeeRawMaterial from "./pages/HalamanUser/EmployeeRawMaterial.jsx";

// Import Custom Components
import ProtectedRoute from "./components/ProtectedRoute";
import AccessDenied from "./pages/HalamanAdmintr/AccessDenied"; // Import AccessDenied

// Fungsi Helper untuk menentukan rute berdasarkan role
const getRouteByRole = (role) => {
    if (["Manager", "FO", "DO", "SL"].includes(role)) {
        return "/home";
    }
    if (role === "HR") {
        return "/homepagehr";
    }
    if (role === "Admin") {
        return "/Dashboard";
    }
    return "/";
};


function App() {
    const navigate = useNavigate();
    // State untuk menandakan apakah pemeriksaan sesi sudah selesai
    const [isSessionChecked, setIsSessionChecked] = useState(false);

    // Role Karyawan biasa (FO, DO, SL)
    const KaryawanBiasaRoles = ["FO", "DO", "SL"];

    // Semua role yang diizinkan untuk Home & Registrasi (Akses universal)
    const AllAuthenticatedRoles = ["Manager", "HR", "Admin", ...KaryawanBiasaRoles];


    // 💡 LOGIKA UTAMA PERSISTENSI SESI SAAT APLIKASI DIMUAT
    useEffect(() => {
        const checkSession = () => {
            const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";
            const role = sessionStorage.getItem("userRole");
            const currentPath = window.location.pathname;

            if (isLoggedIn && role) {
                // Jika pengguna sudah login, tapi mencoba ke /access-denied, 
                // arahkan kembali ke dashboard
                if (currentPath === '/access-denied') {
                    const targetRoute = getRouteByRole(role);
                    navigate(targetRoute, { replace: true });
                }

                // HAPUS LOGIKA REDIRECT JIKA currentPath === '/'
                // Biarkan LoginPage di-render, tapi akan menampilkan "sudah login"
                // Dan biarkan ProtectedRoute menangani rute terproteksi.

            } else if (currentPath !== '/') {
                // Jika TIDAK login dan mencoba mengakses rute terproteksi, paksa ke login
                if (currentPath !== '/access-denied') {
                    navigate('/', { replace: true });
                }
            }

            setIsSessionChecked(true);
        };

        checkSession();
    }, [navigate]);


    // Tampilkan loading screen sementara sesi diverifikasi
    if (!isSessionChecked) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-blue-600 flex items-center space-x-2">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <span className="text-lg">Memverifikasi sesi...</span>
                </div>
            </div>
        );
    }

    return (
        <Routes>
            {/* Rute 1: LOGIN PAGE (PUBLIC) - Pengguna akan diarahkan keluar dari sini jika sudah login (lihat useEffect) */}
            <Route path="/" element={<LoginPage />} />

            {/* Rute 2: ACCESS DENIED PAGE (PUBLIC) - Tetap diperlukan untuk pesan penolakan akses */}
            <Route path="/access-denied" element={<AccessDenied />} />


            {/* ========================= USER/KARYAWAN ROUTES (DIBUNGKUS USERLAYOUT) ========================= */}
            {/* UserLayout adalah layout default untuk Manager & Karyawan Biasa */}
            <Route element={<UserLayout />}>

                {/* Home Page (Akses untuk Semua Role Valid) */}
                <Route
                    path="home"
                    element={<ProtectedRoute allowedRoles={AllAuthenticatedRoles}><HomePage /></ProtectedRoute>}
                />

                {/* Registrasi Page (Akses untuk Semua Role Valid) */}
                <Route
                    path="registrasi"
                    element={<ProtectedRoute allowedRoles={AllAuthenticatedRoles}><RegistrasiPage /></ProtectedRoute>}
                />

                {/* Rute KHUSUS MANAGER: Approval */}
                <Route
                    path="approval"
                    // HANYA MANAGER yang diizinkan, role lain akan AccessDenied
                    element={<ProtectedRoute allowedRoles={["Manager"]}><ApprovalPage /></ProtectedRoute>}
                />

                {/* Rute KHUSUS MANAGER: Assesment */}
                <Route
                    path="assesment"
                    // HANYA MANAGER yang diizinkan
                    element={<ProtectedRoute allowedRoles={["Manager"]}><AssesmentPage /></ProtectedRoute>}
                />

                {/* Rute Edit Registrasi (Asumsi Manager) */}
                <Route
                    path="registration/edit/:noReg"
                    element={<ProtectedRoute allowedRoles={["Manager"]}><RegistrasiPage /></ProtectedRoute>}
                />
            </Route>


            {/* ========================= ADMIN ROUTES (DIBUNGKUS MAINLAYOUT) ========================= */}
            <Route
                element={
                    <ProtectedRoute allowedRoles={["Admin"]}>
                        <MainLayout />
                    </ProtectedRoute>
                }
            >
                <Route path="Dashboard" element={<Dashbaord />} />
                <Route path="Reminder" element={<Reminder />} />
                <Route path="Kompetensi" element={<Kompetensi />} />
                <Route path="Reminder/EnergiPowerPlant" element={<ReminderEnergi />} />
                <Route path="Reminder/WaterTreatmentPlant" element={<ReminderWater />} />
                <Route path="Reminder/EnvironmentProtectionPlant" element={<ReminderEnvironment />} />
                <Route path="Reminder/RawMaterialPlant" element={<ReminderRawMaterial />} />
                <Route path="Kompetensi/EnergiPowerPlant" element={<EnergiPower />} />
                <Route path="Kompetensi/WaterTreatmentPlant" element={<WaterTreatment />} />
                <Route path="Kompetensi/EnvironmentProtectionPlant" element={<Environment />} />
                <Route path="Kompetensi/RawMaterialPlant" element={<RawMaterial />} />
                <Route path="KonfirmasiPage" element={<KonfirmasiPage />} />
            </Route>



            <Route
                element={
                    <ProtectedRoute allowedRoles={["HR"]}>
                        <HRLayout/>
                    </ProtectedRoute>
                }
            >
                {/* Catatan: Rute HR menggunakan path absolute dimulai dari root ('/') */}
                <Route path="/homepagehr" element={<HomePageHR />} />
                <Route path="/employee-status" element={<EmployeeStatus />} />
                <Route path="/training-implementation" element={<TrainingImplementation />} />
                <Route path="/training-room" element={<TrainingRoom />} />
                <Route path="/training-records" element={<TrainingRecords />} />
                <Route path="/attendance" element={<FormEvaluation />} />
                <Route path="/employee-energi" element={<EmployeeEnergi />} />
                <Route path="/employee-water" element={<EmployeeWater />} />
                <Route path="/employee-environment" element={<EmployeeEnvironment />} />
                <Route path="/employee-raw-material" element={<EmployeeRawMaterial />} />
            </Route>


            <Route path="*" element={<Navigate to="/home" replace />} />

        </Routes>
    );
}

export default App;