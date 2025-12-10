// src/pages/AccessDenied.jsx

import React, { useEffect } from 'react';
import { ShieldOff, LogIn, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AccessDenied = () => {
    const navigate = useNavigate();

    // Ambil data dari localStorage
    const userName = localStorage.getItem('userName') || 'Pengguna';
    const userRole = localStorage.getItem('userRole') || 'Tanpa Role';

    // Fungsi untuk logout dan kembali ke halaman login
    const handleLogout = () => {
        // Hapus data autentikasi
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        // Arahkan ke halaman login
        navigate('/', { replace: true });
    };

    // Opsional: Otomatis logout setelah beberapa detik (misalnya 8 detik)
    useEffect(() => {
        const timer = setTimeout(() => {
            handleLogout();
        }, 8000); 
        
        return () => clearTimeout(timer); // Cleanup timer
    }, []);


    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 text-center p-10 bg-white rounded-xl shadow-2xl border border-red-200">
                <ShieldOff className="mx-auto h-20 w-20 text-red-500 animate-pulse" />
                <h2 className="mt-6 text-4xl font-extrabold text-gray-900">
                    AKSES DITOLAK
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                    Anda saat ini masuk sebagai: <span className="font-bold text-red-600">{userName} ({userRole})</span>
                </p>
                <p className="text-lg text-red-700 font-medium">
                    "Anda tidak memiliki otoritas untuk mengakses halaman ini."
                </p>
                <div className="mt-6">
                    <button
                        onClick={handleLogout}
                        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150 ease-in-out"
                    >
                        <LogIn className="w-5 h-5 mr-2" />
                        Kembali ke Halaman Login (Otomatis dalam 8s)
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-4 w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-100 transition duration-150 ease-in-out"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Kembali ke Halaman Sebelumnya
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AccessDenied;