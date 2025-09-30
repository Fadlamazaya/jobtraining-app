import React, { useEffect, useState } from "react";
import HRHeader from "../../components/HalamanHR/HRHeader";

// Dummy data absensi (contoh)
const dummyAttendance = [
  {
    name: "Alya",
    room: "Da Vinci",
    date: "2025-09-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  {
    name: "Nabila",
    room: "Newton",
    date: "2025-09-16",
    startTime: "13:00",
    endTime: "16:00",
  },
  {
    name: "Zayyan",
    room: "Plato",
    date: "2025-09-16",
    startTime: "10:00",
    endTime: "12:00",
  },
];

const TrainingRoom = () => {
  const [rooms, setRooms] = useState([
    { name: "Da Vinci", capacity: 45 },
    { name: "Newton", capacity: 30 },
    { name: "Edison", capacity: 40 },
    { name: "Coppernicus", capacity: 35 },
    { name: "Aristoteles", capacity: 50 },
    { name: "Archimedes", capacity: 25 },
    { name: "Plato", capacity: 20 },
  ]);

  const [attendance, setAttendance] = useState([]);

 useEffect(() => {
  const today = new Date().toISOString().split("T")[0];
  const updatedAttendance = dummyAttendance.map((a) => ({
    ...a,
    date: today, // samain semua ke tanggal hari ini
  }));
  setAttendance(updatedAttendance);
}, []);


  const getRoomData = (roomName) => {
    const participants = attendance.filter((a) => a.room === roomName);
    const today = new Date().toISOString().split("T")[0];
    const todayParticipant = participants.find((p) => p.date === today);

    return {
      ...rooms.find((r) => r.name === roomName),
      used: todayParticipant ? 1 : 0,
      status: todayParticipant ? "Terpakai" : "Kosong",
      startTime: todayParticipant ? todayParticipant.startTime : "-",
      endTime: todayParticipant ? todayParticipant.endTime : "-",
    };
  };

return (
  <div className="min-h-screen bg-gray-50 flex justify-center items-center px-4">
       <HRHeader />
    <div className="w-full max-w-5xl bg-white shadow-md rounded-xl p-6">
      <h2 className="text-xl font-bold text-center text-gray-800 mb-6 border-b pb-3">
         Daftar Training Room
      </h2>

      <div className="overflow-x-auto mt-2">
        <table className="w-full border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Nama Ruangan</th>
              <th className="px-4 py-3 text-center font-medium">Kapasitas</th>
              <th className="px-4 py-3 text-center font-medium">Terisi</th>
              <th className="px-4 py-3 text-center font-medium">Status</th>
              <th className="px-4 py-3 text-center font-medium">Waktu Mulai</th>
              <th className="px-4 py-3 text-center font-medium">Waktu Selesai</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room, index) => {
              const data = getRoomData(room.name);
              return (
                <tr
                  key={index}
                  className={`${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-blue-50 transition`}
                >
                  <td className="border px-4 py-3 font-semibold text-gray-700">
                    {data.name}
                  </td>
                  <td className="border px-4 py-3 text-center text-gray-600">
                    {data.capacity} orang
                  </td>
                  <td className="border px-4 py-3 text-center text-gray-600">
                    {data.used} orang
                  </td>
                  <td className="border px-4 py-3 text-center">
                    <span
                      className={`px-3 py-1.5 rounded-full text-sm font-medium shadow-sm ${
                        data.status === "Kosong"
                          ? "bg-green-100 text-green-700 border border-green-300"
                          : "bg-red-100 text-red-700 border border-red-300"
                      }`}
                    >
                      {data.status}
                    </span>
                  </td>
                  <td className="border px-4 py-3 text-center text-gray-600">
                    {data.startTime}
                  </td>
                  <td className="border px-4 py-3 text-center text-gray-600">
                    {data.endTime}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);
};

export default TrainingRoom;

