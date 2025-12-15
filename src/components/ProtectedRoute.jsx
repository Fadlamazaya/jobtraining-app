// src/components/ProtectedRoute.jsx

import { Navigate } from "react-router-dom";
import AccessDenied from "../pages/HalamanAdmintr/AccessDenied"; 

export default function ProtectedRoute({ children, allowedRoles }) {
    const userRole = sessionStorage.getItem("userRole");

    // 1. Tidak login → redirect ke login
    if (!userRole) {
        localStorage.removeItem('userName');
        return <Navigate to="/" replace />;
    }

    // 2. Kalau role tidak sesuai → blokir akses
    if (!allowedRoles.includes(userRole)) {
        return <AccessDenied />; // Merender komponen AccessDenied
    }

    // 3. Izinkan akses
    return children;
}