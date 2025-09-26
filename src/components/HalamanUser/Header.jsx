import React from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // logic logout di sini
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  return (
    <header className="w-full bg-gradient-to-r from-blue-600 to-blue-800 shadow-md">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => navigate("/")}
        >
          <img
            src="images/logo_indah_kiat.svg"
            alt="Logo IKPP"
            className="h-12 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
          />
          <span className="hidden sm:block text-lg font-semibold tracking-wide text-white">
            E-Training System
          </span>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-6">
          {/* Bisa tambahin menu navigasi di sini */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Log Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
