import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
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
// import Maintenance from "./pages/Maintenance";
import UserLayout from "./components/HalamanUser/UserLayout";
import LoginPage from "./pages/HalamanAdmintr/LoginPage";
import HomePage from "./pages/HalamanAdmintr/HomePage";
import RegistrasiPage from "./pages/HalamanAdmintr/RegistrasiPage";
import ApprovalPage from "./pages/HalamanAdmintr/ApprovalPage";
import EmployeeStatus from "./pages/HalamanUser/EmployeeStatus";
import TrainingImplementation from "./pages/HalamanUser/TrainingImplementation";
import TrainingRoom from "./pages/HalamanUser/TrainingRoom";
import HomePageHR from "./pages/HalamanUser/HomePageHR";
import HRLayout from "./components/HalamanHR/HrLayout";
import TrainingRecords from "./pages/HalamanUser/trainingRecords";
import FormEvaluation from "./pages/HalamanUser/FormEvaluation";
import AssesmentPage from "./pages/HalamanAdmintr/AssesmentPage";
import EmployeeEnergi from "./pages/HalamanUser/EmployeeEnergi";
import EmployeeWater from "./pages/HalamanUser/EmployeeWater";
import EmployeeEnvironment from "./pages/HalamanUser/EmployeeEnvironment";
import EmployeeRawMaterial from "./pages/HalamanUser/EmployeeRawMaterial.jsx";


function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* child routes */}
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
        {/* <Route path="Kompetensi/MaintenancePlant" element={<Maintenance />} /> */}
      </Route>

      {/* Halaman login tanpa layout */}
      <Route path="/" element={<LoginPage />} />

      {/* Semua halaman user dibungkus UserLayout */}
      <Route element={<UserLayout />}>
        <Route path="home" element={<HomePage />} />
        <Route path="registrasi" element={<RegistrasiPage />} />
        <Route path="approval" element={<ApprovalPage />} />
        <Route path="assesment" element={<AssesmentPage />} />
      </Route>

      {/* Semua halaman user dibungkus HRLayout */}
        <Route element={<HRLayout />}>
          <Route path="/homepagehr" element={<HomePageHR />} />
    
      {/* Rute yang sudah ada */}
          <Route path="/employee-status" element={<EmployeeStatus />} />
          <Route path="/training-implementation" element={<TrainingImplementation />} />
          <Route path="/training-room" element={<TrainingRoom />} />
          <Route path="/training-records" element={<TrainingRecords />} />
          <Route path="/attendance" element={<FormEvaluation />} />

    {/* 🌟 TAMBAHAN KRITIS UNTUK MENGATASI ERROR "No routes matched" 🌟 */}
          <Route path="/employee-energi" element={<EmployeeEnergi />} />
          <Route path="/employee-water" element={<EmployeeWater />} />
          <Route path="/employee-environment" element={<EmployeeEnvironment />} />
          <Route path="/employee-raw-material" element={<EmployeeRawMaterial />} />
          </Route>


    </Routes>
  );
}

export default App;
