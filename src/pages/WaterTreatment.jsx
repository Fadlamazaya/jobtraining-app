import { useState, useEffect } from "react";

export default function WaterTreatment() {
  const defaultData = [
    // {
    //   no: 1,
    //   nama: "Fadla Mazaya",
    //   posisiSekarang: "FO",
    //   posisiBaru: "DO",
    //   kompetensiSekarang: {
    //     teknikal: true,
    //     safety: false,
    //     legal: false,
    //     softSkill: false,
    //   },
    //   kompetensiBaru: {
    //     teknikal: false,
    //     safety: true,
    //     legal: false,
    //     softSkill: false,
    //   },
    // },
  ];

  // ambil dari localStorage kalau ada
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem("kompetensiWaterTreatment");
    return saved ? JSON.parse(saved) : defaultData;
  });

  // simpan ke localStorage setiap kali data berubah
  useEffect(() => {
    localStorage.setItem("kompetensiWaterTreatment", JSON.stringify(data));
  }, [data]);

  // state untuk form input tambah/edit peserta
  const [form, setForm] = useState({
    nama: "",
    posisiSekarang: "",
    posisiBaru: "",
  });

  // untuk mode edit
  const [editIndex, setEditIndex] = useState(null);

  // opsi dropdown
  const posisiOptions = ["FO", "DO", "SL/SPV", "Manager"];

  // fungsi tambah peserta baru
  const handleAddPeserta = () => {
    if (!form.nama || !form.posisiSekarang || !form.posisiBaru) {
      alert("Isi semua field dulu ya!");
      return;
    }

    const newPeserta = {
      no: data.length + 1,
      nama: form.nama,
      posisiSekarang: form.posisiSekarang,
      posisiBaru: form.posisiBaru,
      kompetensiSekarang: {
        teknikal: false,
        safety: false,
        legal: false,
        softSkill: false,
      },
      kompetensiBaru: {
        teknikal: false,
        safety: false,
        legal: false,
        softSkill: false,
      },
    };

    setData([...data, newPeserta]);
    setForm({ nama: "", posisiSekarang: "", posisiBaru: "" }); // reset form
  };

  // fungsi update checkbox
  const handleCheckboxChange = (index, tipe, field) => {
    const newData = [...data];
    newData[index][tipe][field] = !newData[index][tipe][field];
    setData(newData);
  };

  // fungsi kirim notifikasi
  const handleSendNotification = (nama) => {
    alert(`Notifikasi terkirim untuk ${nama}`);
  };

  // fungsi hapus peserta
  const handleDelete = (index) => {
    if (confirm("Yakin ingin hapus data ini?")) {
      const newData = data.filter((_, i) => i !== index);
      // update nomor ulang
      newData.forEach((item, i) => (item.no = i + 1));
      setData(newData);
    }
  };

  // fungsi edit peserta
  const handleEdit = (index) => {
    setEditIndex(index);
    setForm({
      nama: data[index].nama,
      posisiSekarang: data[index].posisiSekarang,
      posisiBaru: data[index].posisiBaru,
    });
  };

  // fungsi simpan update
  const handleUpdate = () => {
    if (!form.nama || !form.posisiSekarang || !form.posisiBaru) {
      alert("Isi semua field dulu ya!");
      return;
    }
    const newData = [...data];
    newData[editIndex].nama = form.nama;
    newData[editIndex].posisiSekarang = form.posisiSekarang;
    newData[editIndex].posisiBaru = form.posisiBaru;

    setData(newData);
    setEditIndex(null);
    setForm({ nama: "", posisiSekarang: "", posisiBaru: "" });
  };

  return (
    <div className="p-6">
       <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-2">Kompetensi</h2>
      <p className="mb-4 font-medium">Unit 2 : Water Treatment Plant</p>

      {/* Form tambah/edit peserta */}
      <div className="mb-6 p-4 border rounded-lg shadow-sm bg-gray-50">
        <h3 className="font-semibold mb-2">
          {editIndex !== null ? "Edit Peserta" : "Tambah Peserta"}
        </h3>
        <div className="flex flex-wrap gap-2">
          {/* Input Nama */}
          <input
            type="text"
            placeholder="Nama"
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
            className="border px-2 py-1 rounded"
          />

          {/* Dropdown Posisi Sekarang */}
          <select
            value={form.posisiSekarang}
            onChange={(e) =>
              setForm({ ...form, posisiSekarang: e.target.value })
            }
            className="border px-2 py-1 rounded"
          >
            <option value="">Pilih Posisi Sekarang</option>
            {posisiOptions.map((posisi) => (
              <option key={posisi} value={posisi}>
                {posisi}
              </option>
            ))}
          </select>

          {/* Dropdown Posisi Baru */}
          <select
            value={form.posisiBaru}
            onChange={(e) => setForm({ ...form, posisiBaru: e.target.value })}
            className="border px-2 py-1 rounded"
          >
            <option value="">Pilih Posisi Baru</option>
            {posisiOptions.map((posisi) => (
              <option key={posisi} value={posisi}>
                {posisi}
              </option>
            ))}
          </select>

          {editIndex !== null ? (
            <button
              onClick={handleUpdate}
              className="bg-yellow-600 text-white px-4 py-1 rounded hover:bg-yellow-700"
            >
              Update
            </button>
          ) : (
            <button
              onClick={handleAddPeserta}
              className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
            >
              Tambah
            </button>
          )}
        </div>
      </div>

      {/* Tabel data */}
      <div className="overflow-x-auto shadow-lg rounded-lg">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="border px-3 py-2 w-12">No</th>
              <th className="border px-3 py-2 w-64">Nama / Posisi</th>
              <th className="border px-3 py-2">Teknikal</th>
              <th className="border px-3 py-2">Safety</th>
              <th className="border px-3 py-2">Legal</th>
              <th className="border px-3 py-2">Soft Skill</th>
              <th className="border px-3 py-2 w-48">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <>
                {/* Baris 1: Nama */}
                <tr
                  key={`row-${row.no}-nama`}
                  className="border-b hover:bg-blue-50 hover:shadow-md transition duration-200"
                >
                  <td
                    className="border px-3 py-2 text-center bg-white"
                    rowSpan={3}
                  >
                    {row.no}
                  </td>
                  <td className="border px-3 py-2 font-semibold">{row.nama}</td>
                  <td className="border px-3 py-2 text-center" colSpan={4}></td>
                  <td
                    className="border px-3 py-2 text-center bg-white"
                    rowSpan={3}
                  >
                    <div className="flex flex-raw gap-1">
                      <button
                        onClick={() => handleSendNotification(row.nama)}
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm"
                      >
                        Kirim Notifikasi
                      </button>
                      <button
                        onClick={() => handleEdit(index)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(index)}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Baris 2: Posisi Sekarang */}
                <tr
                  key={`row-${row.no}-posisi-sekarang`}
                  className="border-b hover:bg-blue-50 hover:shadow-md transition duration-200"
                >
                  <td className="border px-3 py-2 text-xs text-gray-600 ">
                    Posisi Sekarang : {row.posisiSekarang}
                  </td>
                  {Object.keys(row.kompetensiSekarang).map((field) => (
                    <td key={field} className="border px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={row.kompetensiSekarang[field]}
                        onChange={() =>
                          handleCheckboxChange(
                            index,
                            "kompetensiSekarang",
                            field
                          )
                        }
                      />
                    </td>
                  ))}
                </tr>

                {/* Baris 3: Posisi Baru */}
                <tr
                  key={`row-${row.no}-posisi-baru`}
                  className="border-b hover:bg-blue-50 hover:shadow-md transition duration-200"
                >
                  <td className="border px-3 py-2 text-xs text-gray-600">
                    Posisi Baru : {row.posisiBaru}
                  </td>
                  {Object.keys(row.kompetensiBaru).map((field) => (
                    <td key={field} className="border px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={row.kompetensiBaru[field]}
                        onChange={() =>
                          handleCheckboxChange(index, "kompetensiBaru", field)
                        }
                      />
                    </td>
                  ))}
                </tr>
              </>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
