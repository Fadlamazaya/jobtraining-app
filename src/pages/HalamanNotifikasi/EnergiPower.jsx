import { useState, useEffect, useCallback } from "react";
import { Edit } from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";

export default function EnergiPower() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔥 Ambil data karyawan dari Firestore
  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      // Ambil semua karyawan dengan areaKerja = "Power Plant"
      const usersQuery = query(
        collection(db, "users"),
        where("areaKerja", "==", "Power Plant")
      );

      const snapshot = await getDocs(usersQuery);

      const employees = snapshot.docs.map((doc, index) => ({
        no: index + 1,
        id: doc.id,
        nama: doc.data().name,
        nik: doc.data().nik,
        posisiSekarang: doc.data().position,
        areaKerja: doc.data().areaKerja,
      }));

      setData(employees);

    } catch (err) {
      console.error("Error fetching data:", err);
      alert("Gagal memuat data dari database!");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUbahPosisi = (user) => {
    alert(`Mengubah posisi untuk ${user.nama} (NIK: ${user.nik}, Posisi: ${user.posisiSekarang})`);
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Memuat data karyawan...
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-2 text-blue-700">Kompetensi Karyawan</h2>
        <p className="mb-6 font-medium text-gray-600">Unit 1 : Energi Power Plant</p>

        <div className="overflow-x-auto shadow-lg rounded-lg">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr className="bg-blue-600 text-white text-sm uppercase tracking-wider">
                <th className="border px-3 py-3 w-12 text-center">No</th>
                <th className="border px-3 py-3 w-48 text-left">Nama Peserta</th>
                <th className="border px-3 py-3 w-32 text-left">NIK</th>
                <th className="border px-3 py-3 w-40 text-left">Posisi Sekarang</th>
                <th className="border px-3 py-3 w-32 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className="border-b hover:bg-blue-50 transition duration-150">
                  <td className="border px-3 py-2 text-center">{row.no}</td>
                  <td className="border px-3 py-2 font-medium text-gray-800">{row.nama}</td>
                  <td className="border px-3 py-2">{row.nik}</td>
                  <td className="border px-3 py-2">
                    <span className="inline-block px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                      {row.posisiSekarang}
                    </span>
                  </td>
                  <td className="border px-3 py-2 text-center">
                    <button
                      onClick={() => handleUbahPosisi(row)}
                      className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 text-sm flex items-center justify-center space-x-1 mx-auto"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Ubah Posisi</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
