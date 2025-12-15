import React, { useState } from 'react';
import { Eye, EyeOff, User, Lock, Building2, ArrowRight, Shield, Waves } from 'lucide-react';

import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    noSAP: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.noSAP.trim()) {
      newErrors.noSAP = 'NIK wajib diisi';
    } else if (formData.noSAP.length !== 6) {
      newErrors.noSAP = 'NIK harus 6 angka';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password wajib diisi';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

 const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('nik', '==', formData.noSAP),
        where('password', '==', formData.password)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const user = querySnapshot.docs[0].data();

        // --- PERBAIKAN: GUNAKAN sessionStorage ---
        sessionStorage.setItem("userRole", user.position);
        sessionStorage.setItem("userName", user.name);
        sessionStorage.setItem("isLoggedIn", "true"); // <-- Menggunakan sessionStorage

        alert(`Login berhasil! Selamat datang, ${user.name}`);

        // Routing berdasarkan role (dengan replace: true)
        if (user.position === "Admin") {
          navigate("/Dashboard", { replace: true });
        }
        else if (user.position === "HR") {
          navigate("/homepagehr", { replace: true });
        }
        else if (["Manager", "FO", "DO", "SL"].includes(user.position)) {
          navigate("/home", { replace: true });
        }
        else {
          alert("Role tidak dikenal!");
          sessionStorage.removeItem("userRole"); // <-- Menggunakan sessionStorage
          sessionStorage.removeItem("userName"); // <-- Menggunakan sessionStorage
          sessionStorage.removeItem("isLoggedIn"); // <-- Menggunakan sessionStorage
        }
      
      } else {
        alert('Login gagal! NIK atau password salah.');
      }

    } catch (error) {
      console.error('Error login:', error);
      alert('Terjadi kesalahan saat login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0">
        {/* Animated waves */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1200 120" className="w-full h-32 text-blue-600 opacity-20">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
              fill="currentColor" className="animate-pulse">
              <animateTransform
                attributeName="transform"
                attributeType="XML"
                type="translate"
                values="0 0; 30 0; 0 0"
                dur="6s"
                repeatCount="indefinite" />
            </path>
          </svg>
        </div>

        {/* Floating circles */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-white opacity-5 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-48 h-48 bg-blue-300 opacity-10 rounded-full blur-2xl animate-bounce" style={{ animationDuration: '3s' }}></div>
        <div className="absolute bottom-40 left-1/3 w-32 h-32 bg-white opacity-10 rounded-full blur-xl animate-ping" style={{ animationDuration: '4s' }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-lg">
          {/* Login Card */}
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden transform hover:scale-102 transition-all duration-300">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-center relative">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-lg">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">E-Training System</h1>
                <p className="text-blue-100 text-sm">Silahkan login untuk melanjutkan</p>
              </div>
            </div>

            {/* Form Section */}
            <div className="p-6">
              <div className="space-y-5">
                {/* No. SAP Field */}
                <div className="space-y-2">
                  <label htmlFor="noSAP" className="block text-sm font-semibold text-gray-700">
                    <User className="w-4 h-4 inline-block mr-2 text-blue-600" />
                    No. SAP
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      id="noSAP"
                      name="noSAP"
                      value={formData.noSAP}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl transition-all duration-300 focus:outline-none focus:bg-white focus:shadow-lg ${errors.noSAP
                          ? 'border-red-400 focus:border-red-500'
                          : 'border-gray-200 focus:border-blue-500 hover:border-blue-300'
                        }`}
                      placeholder="Masukkan No. SAP Anda"
                      disabled={isLoading}
                    />
                    <div className="absolute inset-y-0 right-4 flex items-center">
                      <Shield className={`w-5 h-5 transition-colors ${formData.noSAP ? 'text-blue-500' : 'text-gray-400'
                        }`} />
                    </div>
                  </div>
                  {errors.noSAP && (
                    <p className="text-red-500 text-sm font-medium animate-pulse">{errors.noSAP}</p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                    <Lock className="w-4 h-4 inline-block mr-2 text-blue-600" />
                    Password
                  </label>
                  <div className="relative group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 pr-12 bg-gray-50 border-2 rounded-xl transition-all duration-300 focus:outline-none focus:bg-white focus:shadow-lg ${errors.password
                          ? 'border-red-400 focus:border-red-500'
                          : 'border-gray-200 focus:border-blue-500 hover:border-blue-300'
                        }`}
                      placeholder="Masukkan password Anda"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-4 flex items-center text-gray-500 hover:text-blue-600 transition-colors"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-sm font-medium animate-pulse">{errors.password}</p>
                  )}
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 transition-all"
                      disabled={isLoading}
                    />
                    <span className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors">Ingat saya</span>
                  </label>
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline transition-all"
                    disabled={isLoading}
                  >
                    Lupa password?
                  </button>
                </div>

                {/* Login Button */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Memproses...</span>
                    </div>
                  ) : (
                    <>
                      <span>Masuk</span>
                      <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>

              {/* Footer Links */}
              <div className="mt-6 pt-4 border-t border-gray-200 text-center space-y-3">

                <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                  <button className="hover:text-blue-600 transition-colors">Bantuan</button>
                  <span>•</span>
                  <button className="hover:text-blue-600 transition-colors">Kebijakan Privasi</button>
                  <span>•</span>
                  <button className="hover:text-blue-600 transition-colors">Syarat & Ketentuan</button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Info */}
          <div className="mt-6 text-center">
            <p className="text-white/80 text-sm">
              © 2024 E-Training System. All rights reserved.
            </p>
            <div className="mt-2 flex items-center justify-center space-x-2 text-white/60">
              <Waves className="w-4 h-4" />
              <span className="text-xs">Secure & Reliable Platform</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;