import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/HalamanUser/Header";


export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    setLoading(true);
    // simulasi loading 2 detik
    setTimeout(() => {
      setLoading(false);
      navigate("/registrasi"); // redirect ke halaman registrasi
    }, 2000);
  };

  return (
    <div className="relative min-h-screen">
      {/* Background image */}
      <img
        src="/images/cover.jpg"
        alt="Cover"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Header */}
      <Header />

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center min-h-[80vh] px-4">
        <h3 className="text-lg text-white font-light mb-2">
          Tingkatkan Skill Anda Bersama Kami
        </h3>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Daftar Training Profesional Sekarang!
        </h1>
        <p className="text-gray-200 max-w-xl mb-6">
          Ikuti program training yang dirancang untuk membantu Anda menguasai
          keterampilan baru, meningkatkan kompetensi, dan siap menghadapi tantangan kerja.
        </p>

        {/* Tombol menuju registrasi */}
        <button
          onClick={handleClick}
          disabled={loading}
          className={`${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-700"
          } text-white font-semibold px-6 py-3 rounded-md transition flex items-center gap-2`}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Loading...
            </>
          ) : (
            "REGISTRASI TRAINING"
          )}
        </button>
      </div>
    </div>
  );
}
