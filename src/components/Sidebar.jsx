import { BsDot } from "react-icons/bs";
import { LayoutDashboard, BellRing } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { FaUserShield } from "react-icons/fa";

const Sidebar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const [isReminderOpen, setReminderOpen] = useState(false);
  const [isKompetensiOpen, setKompetensiOpen] = useState(false);

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-white shadow-xl px-4 py-6 flex flex-col z-30 hidden md:block">
      {/* Logo */}
      <NavLink
        to="/Dashboard"
        className="flex items-center gap-3 text-2xl font-bold mb-8 text-gray-800 px-3"
      >
        <img
          src="/images/logo_indah_kiat.svg"
          alt="Logo UPT"
          className="w-[200px] h-[72px] object-contain"
        />
      </NavLink>

      <div className="flex-grow overflow-y-auto pr-2">
        {/* Dashboard */}
        <div className="mb-6 space-y-2">
          <NavLink
            to="/Dashboard"
            className={`flex items-center gap-4 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive("/Dashboard")
                ? "bg-blue-600 !text-white shadow-md"
                : "!text-gray-600 hover:bg-blue-100 hover:!text-blue-800"
              }`}
          >
            <LayoutDashboard size={20} className="text-current" />
            <span className="font-medium text-sm">Dashboard</span>
          </NavLink>
        </div>

        {/* Reminder */}
        <div className="mb-6">
          <button
            onClick={() => setReminderOpen(!isReminderOpen)}
            className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all duration-200 ${location.pathname.includes("/Reminder")
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-600 hover:bg-blue-100 hover:text-blue-800"
              }`}
          >
            <div className="flex items-center gap-4">
              <BellRing size={20} className="text-current" />
              <span className="font-medium text-sm">Reminder</span>
            </div>
            <span
              className={`transition-transform duration-300 ${isReminderOpen ? "rotate-180" : ""
                }`}
            >
              ▼
            </span>
          </button>

          {/* Submenu Reminder */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${isReminderOpen ? "max-h-60 mt-1" : "max-h-0"
              }`}
          >
            <div className="pl-5 space-y-1">
              {[
                "Energi Power Plant",
                "Water Treatment Plant",
                "Environment Protection Plant",
                "Raw Material Plant",
                // "Maintenance Plant",
              ].map((sub) => {
                const slug = sub.replace(/\s+/g, ""); // hapus semua spasi

                return (
                  <NavLink
                    key={slug}
                    to={`/Reminder/${slug}`}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${isActive(`/Reminder/${slug}`)
                        ? "bg-blue-600 !text-white shadow-md"
                        : "!text-gray-600 hover:bg-blue-100 hover:!text-blue-800"
                      }`}
                  >
                    <BsDot size={20} /> {sub}
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>

        {/* Kompetensi */}
        <div className="mb-6">
          <button
            onClick={() => setKompetensiOpen(!isKompetensiOpen)}
            className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all duration-200 ${location.pathname.includes("/Kompetensi")
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-600 hover:bg-blue-100 hover:text-blue-800"
              }`}
          >
            <div className="flex items-center gap-4">
              <FaUserShield size={20} className="text-current" />
              <span className="font-medium text-sm">Kompetensi</span>
            </div>
            <span
              className={`transition-transform duration-300 ${isKompetensiOpen ? "rotate-180" : ""
                }`}
            >
              ▼
            </span>
          </button>

          {/* Submenu Kompetensi */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${isKompetensiOpen ? "max-h-60 mt-1" : "max-h-0"
              }`}
          >
            <div className="pl-5 space-y-1">
              {[
                "Energi Power Plant",
                "Water Treatment Plant",
                "Environment Protection Plant",
                "Raw Material Plant",
                // "Maintenance Plant",
              ].map((sub) => {
                const slug = sub.replace(/\s+/g, ""); // hapus semua spasi

                return (
                  <NavLink
                    key={slug}
                    to={`/Kompetensi/${slug}`}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${isActive(`/Kompetensi/${slug}`)
                        ? "bg-blue-600 !text-white shadow-md"
                        : "!text-gray-600 hover:bg-blue-100 hover:!text-blue-800"
                      }`}
                  >
                    <BsDot size={20} /> {sub}
                  </NavLink>
                );
              })}
            </div>

          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
