// src/pages/HalamanUser/HomePageHR.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HRHeader from "../../components/HalamanHR/HRHeader"; // ✅ perbaikan path

export default function HomePageHR() {
  const navigate = useNavigate();

  useEffect(() => {
    const handlePopState = () => {
      navigate("/", { replace: true });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate]);

  return (
    <div className="relative min-h-screen">
      {/* Navbar */}
      <HRHeader />

      {/* Background image */}
      <img
        src="/images/cover.jpg"
        alt="Cover"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30"></div>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center min-h-screen px-4 pt-20">
        <h3 className="text-lg text-white font-light mb-2">
          Tingkatkan Skill Anda Bersama Kami
        </h3>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Daftar Training Profesional Sekarang!
        </h1>
        <p className="text-gray-200 max-w-xl mb-6">
          Ikuti program training yang dirancang untuk membantu Anda menguasai
          keterampilan baru, meningkatkan kompetensi, dan siap menghadapi
          tantangan kerja.
        </p>
      </div>
    </div>
  );
}