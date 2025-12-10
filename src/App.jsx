import React from "react";
import { Routes, Route, Navigate } from "react-router-dom"; 
import MainLayout from "./layouts/MainLayout";
import UserLayout from "./components/HalamanUser/UserLayout";
import HRLayout from "./components/HalamanHR/HrLayout";

// Import Pages
import LoginPage from "./pages/HalamanAdmintr/LoginPage";
import HomePage from "./pages/HalamanAdmintr/HomePage";
import RegistrasiPage from "./pages/HalamanAdmintr/RegistrasiPage";
import ApprovalPage from "./pages/HalamanAdmintr/ApprovalPage";
import AssesmentPage from "./pages/HalamanAdmintr/AssesmentPage";

import Dashbaord from "./pages/HalamanNotifikasi/Dashbaord";
import Reminder from "./pages/HalamanNotifikasi/Reminder";
import Kompetensi from "./pages/HalamanNotifikasi/Kompetensi";
import ReminderEnergi from "./pages/HalamanNotifikasi/ReminderEnergi";
import ReminderWater from "./pages/HalamanNotifikasi/ReminderWater";
import ReminderEnvironment from "./pages/HalamanNotifikasi/ReminderEnvironment";
import ReminderRawMaterial from "./pages/HalamanNotifikasi/ReminderRawMaterial";
import EnergiPower from "./pages/HalamanNotifikasi/EnergiPower";
import WaterTreatment from "./pages/HalamanNotifikasi/WaterTreatment";
import Environment from "./pages/HalamanNotifikasi/Environment";
import RawMaterial from "./pages/HalamanNotifikasi/RawMaterial";

import EmployeeStatus from "./pages/HalamanUser/EmployeeStatus";
import TrainingImplementation from "./pages/HalamanUser/TrainingImplementation";
import TrainingRoom from "./pages/HalamanUser/TrainingRoom";
import HomePageHR from "./pages/HalamanUser/HomePageHR";
import TrainingRecords from "./pages/HalamanUser/trainingRecords";
import FormEvaluation from "./pages/HalamanUser/FormEvaluation";
import EmployeeEnergi from "./pages/HalamanUser/EmployeeEnergi";
import EmployeeWater from "./pages/HalamanUser/EmployeeWater";
import EmployeeEnvironment from "./pages/HalamanUser/EmployeeEnvironment";
import EmployeeRawMaterial from "./pages/HalamanUser/EmployeeRawMaterial.jsx";

// Import Custom Components
import ProtectedRoute from "./components/ProtectedRoute";
import AccessDenied from "./pages/HalamanAdmintr/AccessDenied"; 

function App() {
    // Role Karyawan biasa + Manager (yang hanya mengakses home/registrasi)
    const KaryawanRoles = ["Manager", "FO", "DO", "SL"]; 
    
    // Semua role yang diizinkan untuk Home & Registrasi
    const AllAuthenticatedRoles = ["Admin", "HR", ...KaryawanRoles];


    return (
        <Routes>
            {/* Rute 1: LOGIN PAGE (PUBLIC) */}
            <Route path="/" element={<LoginPage />} />

            {/* Rute 2: ACCESS DENIED PAGE (PUBLIC, digunakan oleh ProtectedRoute) */}
            <Route path="/access-denied" element={<AccessDenied />} />


            {/* ======================= RUTE UNIVERSAL (HOME & REGISTRASI) ======================= */}
            {/* Kita bungkus di sini untuk memastikan Home dan Registrasi terproteksi bagi semua yang login */}
            
            {/* Home Page (Akses untuk semua role yang valid) */}
            <Route path="home" element={<ProtectedRoute allowedRoles={AllAuthenticatedRoles}><HomePage /></ProtectedRoute>} />
            
            {/* Registrasi Page (Akses untuk semua role yang valid) */}
            <Route path="registrasi" element={<ProtectedRoute allowedRoles={AllAuthenticatedRoles}><RegistrasiPage /></ProtectedRoute>} />


            {/* ========================= ADMIN ROUTES ========================= */}
            {/* Catatan: Karena Admin juga bisa akses 'home' dan 'registrasi', pastikan MainLayout memiliki link ke sana */}
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
            </Route>

            
            {/* ========================= MANAGER/KARYAWAN LANJUTAN ROUTES ========================= */}
            {/* Hanya Manager yang bisa mengakses Approval dan Assesment */}
            <Route
                element={
                    <ProtectedRoute allowedRoles={["Manager"]}>
                        <UserLayout />
                    </ProtectedRoute>
                }
            >
                {/* Home dan Registrasi sudah di atas. Manager hanya menambah rute ini: */}
                <Route path="approval" element={<ApprovalPage />} />
                <Route path="assesment" element={<AssesmentPage />} />
            </Route>


            {/* ========================= HR ROUTES ========================= */}
            <Route
                element={
                    <ProtectedRoute allowedRoles={["HR"]}>
                        <HRLayout />
                    </ProtectedRoute>
                }
            >
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

            {/* Rute 4: CATCH-ALL / 404 Not Found */}
            {/* Semua URL yang tidak terdefinisi akan diarahkan ke home. */}
            <Route path="*" element={<Navigate to="/home" replace />} />

        </Routes>
    );
}

export default App;