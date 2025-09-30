// src/components/HalamanHR/HRLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import HRHeader from "./HRHeader";

const HRLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header khusus HR */}
      <HRHeader />

      {/* Konten utama */}
      <main className="w-full max-w-[2000px] mx-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default HRLayout;
