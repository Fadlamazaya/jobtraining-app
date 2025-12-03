import React, { useState, useEffect } from "react";
// Tambahkan useLocation untuk mengecek rute aktif
import { NavLink, useNavigate, useLocation } from "react-router-dom";
// Impor ikon dari lucide-react untuk tampilan yang lebih modern
import { ChevronDown, ChevronRight, Factory } from 'lucide-react';

// Daftar Unit Plant
const PLANT_UNITS = [
  "Energi Power Plant",
  "Water Treatment Plant",
  "Environment Protection Plant",
  "Raw Material Plant",
  // "Maintanance Plant",
];

// --- 1. Komponen Navigasi Kustom untuk item dengan Dropdown (FINAL MODIFIKASI) ---
const DropdownNavItem = ({ label, items, basePath, navigate }) => {
  const location = useLocation(); // Digunakan untuk menentukan status 'active'
  const [isOpen, setIsOpen] = useState(false);

  // Cek apakah salah satu rute unit plant sedang aktif (untuk styling Nav)
  const isEmployeeStatusActive =
    location.pathname.includes("/employee-") || // Cek jika path mengandung /employee-
    location.pathname === basePath; // Meskipun tidak menavigasi ke basePath, ini untuk fallback

  // Fungsi untuk mengarahkan ke rute unit yang difilter
  const handleUnitClick = (unit) => {
    setIsOpen(false); // Tutup dropdown setelah klik

    // LOGIKA NAVIGASI KHUSUS SESUAI NAMA FILE KOMPONEN
    if (unit === "Energi Power Plant") {
      navigate("/employee-energi");
    } else if (unit === "Water Treatment Plant") {
      navigate("/employee-water");
    } else if (unit === "Environment Protection Plant") {
      navigate("/employee-environment");
    } else if (unit === "Raw Material Plant") {
      navigate("/employee-raw-material");
    } else if (unit === "Maintanance Plant") {
      navigate("/employee-maintenance");
    } else {
      const encodedUnit = encodeURIComponent(unit);
      navigate(`${basePath}?unit=${encodedUnit}`);
    }
  };

  // Fungsi INI HANYA UNTUK TOGGLE DROPDOWN
  const handleBaseClick = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div
      className="relative"
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* ⭐ PERUBAHAN KRUSIAL: Diganti dari NavLink menjadi DIV ⭐ */}
      <div
        onClick={handleBaseClick} // Hanya toggle dropdown
        onMouseEnter={() => setIsOpen(true)} // Buka saat kursor masuk (pola hover)
        // Styling active berdasarkan isEmployeeStatusActive
        className={`relative transition-all duration-300 flex items-center gap-1 cursor-pointer
                    ${isEmployeeStatusActive ? "text-blue-200 font-semibold" : "!text-white"}
                    hover:text-blue-200 group`}
      >
        {label}
        {/* Ikon panah yang berputar saat dropdown terbuka */}
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
        />
        {/* underline animasi */}
        <span
          className="absolute left-0 -bottom-1 w-0 h-[2px] bg-blue-400 transition-all duration-300 group-hover:w-full"
        />
      </div>

      {/* Konten Dropdown yang muncul */}
      {isOpen && (
        <div
          className="absolute left-0 top-full mt-1 w-72 bg-white shadow-2xl rounded-xl overflow-hidden py-3 z-50 transform origin-top animate-fade-in border border-gray-200"
        >
          <div className="px-4 py-2 text-xs font-bold uppercase text-gray-500 border-b mb-1">
            Pilih Unit Plant
          </div>
          {items.map((item) => (
            <div
              key={item}
              // MENGGUNAKAN FUNGSI handleUnitClick UNTUK NAVIGASI UNIT
              onClick={() => handleUnitClick(item)}
              className="flex items-center justify-between px-4 py-3 text-gray-800 text-sm font-medium hover:bg-blue-50 hover:text-blue-600 transition duration-150 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                {/* Ikon Pabrik */}
                <Factory size={16} className="text-blue-500" />
                {item}
              </span>
              <ChevronRight size={14} className="text-gray-400" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


// --- 2. Komponen HRHeader (Tanpa Perubahan Logika Navigasi selain menggunakan DropdownNavItem yang baru) ---
const HRHeader = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handlePopState = () => {
      navigate("/", { replace: true });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  const navItems = [
    { path: "/training-implementation", label: "Training Implementation" },
    { path: "/attendance", label: "Attendance & Form Evaluation" },
    { path: "/training-room", label: "Training Room" },
    { path: "/training-records", label: "Training Records" },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full bg-black/40 backdrop-blur-sm text-white px-6 py-3 flex items-center justify-between z-50 shadow-md">
      {/* Left Side: Logo & Navigation */}
      <div className="flex items-center gap-6">
        <img
          src="images/logo_indah_kiat.svg"
          alt="Logo Indah Kiat"
          className="h-10 w-auto object-contain"
        />
        <span className="font-bold text-lg tracking-wide">
          E- TRAINING SYSTEM
        </span>

        {/* Navigation Links */}
        <div className="flex gap-5 ml-4">
          {/* IMPLEMENTASI DROPDOWN EMPLOYEE STATUS */}
          <DropdownNavItem
            label="Employee Status"
            items={PLANT_UNITS} // Memasukkan unit plant
            basePath="/employee-status" // basePath tetap diperlukan untuk logika di handleUnitClick
            navigate={navigate}
          />

          {/* Nav Items lainnya */}
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `relative transition-all duration-300 
                                ${isActive ? "text-blue-200 font-semibold" : "!text-white"} 
                                hover:text-blue-200 group`
              }
            >
              {item.label}
              {/* underline animasi */}
              <span
                className="absolute left-0 -bottom-1 w-0 h-[2px] bg-blue-400 transition-all duration-300 group-hover:w-full"
              />
            </NavLink>
          ))}
        </div>
      </div>

      {/* Right Side: Profile & Logout */}
      <div className="flex gap-3">
        <button className="border border-white px-3 py-1 rounded hover:bg-white/20 transition duration-300">
          Profile
        </button>
        <button
          onClick={handleLogout}
          className="border border-white px-3 py-1 rounded hover:bg-white/20 transition duration-300"
        >
          Logout
        </button>
      </div>

      {/* CSS untuk Animasi Dropdown */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </nav>
  );
};

export default HRHeader;
