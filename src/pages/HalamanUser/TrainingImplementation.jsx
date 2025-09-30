// src/pages/hr/TrainingImplementation.jsx
import React, { useState, useEffect } from "react";
import AttendancePDF from "./AttendancePDF"; // harus ada di folder yang sama
import HRHeader from "../../components/HalamanHR/HRHeader";

const TrainingImplementation = () => {
  const dummyRequests = [
    { id: 1, nama: "Andi Saputra" },
    { id: 2, nama: "Budi Santoso" },
    { id: 3, nama: "Citra Dewi" },
    { id: 4, nama: "Dedi Firmansyah" },
  ];

  const [requests, setRequests] = useState(dummyRequests);
  const [approvedRequests, setApprovedRequests] = useState([]);

  // 🔹 Load data dari localStorage saat pertama kali render
  useEffect(() => {
    const savedApproved = localStorage.getItem("approvedRequests");
    if (savedApproved) {
      setApprovedRequests(JSON.parse(savedApproved));
    }
  }, []);

  // 🔹 Simpan ke localStorage setiap kali approvedRequests berubah
  useEffect(() => {
    localStorage.setItem("approvedRequests", JSON.stringify(approvedRequests));
  }, [approvedRequests]);

  // Fungsi buat dummy absensi 20 orang
  const generateDummyAttendance = (trainerName) => {
    const attendance = [];
    for (let i = 1; i <= 20; i++) {
      attendance.push({
        id: i,
        nama: `Peserta ${i} - ${trainerName}`,
        hadir: Math.random() > 0.2 ? "Hadir" : "Tidak Hadir",
        nilai: Math.floor(Math.random() * 41) + 60,
      });
    }
    return attendance;
  };

  const handleApprove = (id) => {
    const found = requests.find((r) => r.id === id);
    if (!found) return;

    const dummyAttendance = generateDummyAttendance(found.nama);

    setApprovedRequests((prev) => [
      ...prev,
      { ...found, managerStatus: "approved", attendance: dummyAttendance },
    ]);

    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 pt-24 pb-12 flex justify-center">
         <HRHeader />
      <div className="w-full max-w-5xl bg-white shadow-lg rounded-2xl p-8">
        <h2 className="text-xl font-bold text-center text-gray-800 mb-6 border-b pb-3">
            Training Implementation
        </h2>

        {/* Pending list */}
        <div className="mb-10">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            ⏳ Pending Approval
          </h3>
          {requests.length === 0 ? (
            <p className="text-gray-500 italic">Tidak ada request pending.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg shadow-sm">
              <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <tr>
                    <th className="px-4 py-3 text-center font-medium">ID</th>
                    <th className="px-4 py-3 text-center font-medium">Nama</th>
                    <th className="px-4 py-3 text-center font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr
                      key={req.id}
                      className="bg-white hover:bg-blue-50 transition"
                    >
                      <td className="border px-4 py-3 text-center">{req.id}</td>
                      <td className="border px-4 py-3 text-center font-medium text-gray-700">
                        {req.nama}
                      </td>
                      <td className="border px-4 py-3 text-center">
                        <button
                          onClick={() => handleApprove(req.id)}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm text-sm transition"
                        >
                          ✅ Approve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Approved list */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            ✅ Approved Participants
          </h3>
          {approvedRequests.length === 0 ? (
            <p className="text-gray-500 italic">
              Belum ada peserta yang disetujui.
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {approvedRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-5 border rounded-xl shadow-sm bg-gray-50 hover:shadow-md transition"
                >
                  <p className="font-semibold text-gray-800 text-lg mb-3">
                    {req.nama}
                  </p>
                  {/* Tombol download absensi */}
                  <AttendancePDF approvedRequests={req.attendance} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainingImplementation;
