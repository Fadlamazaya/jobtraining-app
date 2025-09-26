import React, { useState } from "react";

export default function ReminderDo() {
  const [reminders] = useState([
    {
      id: 1,
      nama: "Haffydzzh Al Fayyadh",
      tglMulai: "2025-09-05",
      tglSelesai: "2025-09-05",
      jamMulai: "09:00",
      jamSelesai: "11:00",
      lokasi: "Archimedes",
    },
    {
      id: 2,
      nama: "Nabila Syarani",
      tglMulai: "2025-09-06",
      tglSelesai: "2025-09-06",
      jamMulai: "14:00",
      jamSelesai: "16:00",
      lokasi: "Da Vinci",
    },
  ]);

  const handleAlert = (nama) => {
    alert(`Reminder untuk: ${nama}`);
  };

  const handleNotifikasi = (nama) => {
    alert(`Notifikasi  dikirim untuk: ${nama}`);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">📅 Reminder</h1>
      <div className="overflow-x-auto shadow-lg rounded-lg">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="px-4 py-2 text-left">Nama</th>
              <th className="px-4 py-2 text-left">Tanggal Mulai</th>
              <th className="px-4 py-2 text-left">Tanggal Selesai</th>
              <th className="px-4 py-2 text-left">Jam Mulai</th>
              <th className="px-4 py-2 text-left">Jam Selesai</th>
              <th className="px-4 py-2 text-left">Lokasi</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {reminders.map((reminder) => (
              <tr
                key={reminder.id}
                className="border-b hover:bg-blue-50 transition"
              >
                <td className="px-4 py-2">{reminder.nama}</td>
                <td className="px-4 py-2">{reminder.tglMulai}</td>
                <td className="px-4 py-2">{reminder.tglSelesai}</td>
                <td className="px-4 py-2">{reminder.jamMulai}</td>
                <td className="px-4 py-2">{reminder.jamSelesai}</td>
                <td className="px-4 py-2">{reminder.lokasi}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => handleAlert(reminder.nama)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg shadow-md transition"
                  >
                    Alert
                  </button>
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => handleNotifikasi(reminder.nama)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg shadow-md transition"
                  >
                    Kirim Notifikasi 
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
