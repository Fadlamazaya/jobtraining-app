// HRHeader.jsx

import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, Factory } from 'lucide-react'; 

// ⭐️ PERUBAHAN: Maintenance Plant dihapus
const PLANT_UNITS = [
    "Energi Power Plant",
    "Water Treatment Plant",
    "Environment Protection Plant",
    "Raw Material Plant",
];

// --- Komponen Navigasi Kustom untuk item dengan Dropdown ---
const DropdownNavItem = ({ label, items, basePath, navigate }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Fungsi untuk mengarahkan ke rute unit yang difilter
    const handleUnitClick = (unit) => {
        setIsOpen(false); 
        
        let targetPath = basePath;
        
        // Logika routing unit spesifik
        if (unit === "Energi Power Plant") {
            targetPath = "/employee-energi"; 
        } else if (unit === "Water Treatment Plant") {
            targetPath = "/employee-water"; 
        } else if (unit === "Environment Protection Plant") {
            targetPath = "/employee-environment"; 
        } else if (unit === "Raw Material Plant") {
            // ⭐️ PEMASTIAN: Rute untuk Raw Material Plant
            targetPath = "/employee-raw-material";
        } 
        // Logic untuk Maintanance Plant (yang dihapus dari list) tidak perlu lagi di sini, sehingga kode lebih bersih.
        
        navigate(targetPath);
    };

    // Fungsi navigasi base path saat diklik: Langsung ke /employee-status
    const handleBaseClick = () => {
        navigate(basePath); 
    };

    // Fungsi untuk membuka dropdown saat hover
    const handleMouseEnter = () => {
        setIsOpen(true);
    };
    
    return (
        <div 
            className="relative" 
            onMouseLeave={() => setIsOpen(false)} 
        >
            <NavLink
                to={basePath}
                onClick={handleBaseClick} 
                onMouseEnter={handleMouseEnter} 
                className={({ isActive }) =>
                    `relative transition-all duration-300 flex items-center gap-1
                    ${isActive ? "text-blue-200 font-semibold" : "!text-white"} 
                    hover:text-blue-200 group`
                }
            >
                {label}
                <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
                <span
                    className="absolute left-0 -bottom-1 w-0 h-[2px] bg-blue-400 transition-all duration-300 group-hover:w-full"
                ></span>
            </NavLink>

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
                            onClick={() => handleUnitClick(item)} 
                            className="flex items-center justify-between px-4 py-3 text-gray-800 text-sm font-medium hover:bg-blue-50 hover:text-blue-600 transition duration-150 cursor-pointer"
                        >
                            <span className="flex items-center gap-2">
                                <Factory size={16} className="text-blue-500" />
                                {item}
                            </span>
                            <ChevronRight size={14} className="text-gray-400" />
                        </div>
                    ))}
                </div>
            )}
            <style jsx="true">{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fadeIn 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
};


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
                        items={PLANT_UNITS} 
                        basePath="/employee-status" 
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
                            ></span>
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
        </nav>
    );
};

export default HRHeader;