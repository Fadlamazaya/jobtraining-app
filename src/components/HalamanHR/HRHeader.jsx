import React, { useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";

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
    { path: "/employee-status", label: "Employee Status" },
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
