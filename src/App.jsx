import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Dashbaord from "./pages/Dashbaord";
import Reminder from "./pages/reminder";
import Kompetensi from "./pages/Kompetensi";
import ReminderFo from "./pages/ReminderFo";
import ReminderDo from "./pages/ReminderDo";
import ReminderSL from "./pages/ReminderSL";
import ReminderManager from "./pages/ReminderManager";
import EnergiPower from "./pages/EnergiPower";
import WaterTreatment from "./pages/WaterTreatment";
import Environment from "./pages/Environment";
import RawMaterial from "./pages/RawMaterial";
import Maintenance from "./pages/Maintenance";
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



function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* child routes */}
        <Route path="Dashboard" element={<Dashbaord />} />
        <Route path="Reminder" element={<Reminder />} />
        <Route path="Kompetensi" element={<Kompetensi />} />
        <Route path="Reminder/FO" element={<ReminderFo />} />
        <Route path="Reminder/DO" element={<ReminderDo />} />
        <Route path="Reminder/SL/SPV" element={<ReminderSL />} />
        <Route path="Reminder/Manager" element={<ReminderManager />} />
        <Route path="Kompetensi/EnergiPowerPlant" element={<EnergiPower />} />
        <Route path="Kompetensi/WaterTreatmentPlant" element={<WaterTreatment />} />
        <Route path="Kompetensi/EnvironmentProtectionPlant" element={<Environment />} />
        <Route path="Kompetensi/RawMaterialPlant" element={<RawMaterial />} />
        <Route path="Kompetensi/MaintenancePlant" element={<Maintenance />} />
      </Route>

      {/* Halaman login tanpa layout */}
      <Route path="/" element={<LoginPage />} />

      {/* Semua halaman user dibungkus UserLayout */}
      <Route element={<UserLayout />}>
        <Route path="home" element={<HomePage />} />
        <Route path="registrasi" element={<RegistrasiPage />} />
        <Route path="approval" element={<ApprovalPage />} />
      </Route>

      {/* Semua halaman user dibungkus HRLayout */}
      <Route element={<HRLayout />}></Route>
        <Route path="/homepagehr" element={<HomePageHR />} />
        <Route path="/employee-status" element={<EmployeeStatus />} />
        <Route path="/training-implementation" element={<TrainingImplementation />} />
        <Route path="/training-room" element={<TrainingRoom />} />
        <Route path="/training-records" element={<TrainingRecords />} />


    </Routes>
  );
}

export default App;
