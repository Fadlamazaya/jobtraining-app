import { useState } from "react";
import HRHeader from "../../components/HalamanHR/HRHeader";

const EmployeeStatus = () => {
  const [employees, setEmployees] = useState([
    { id: 1, name: "Andi Saputra", unit: "Finance" },
    { id: 2, name: "Budi Santoso", unit: "HR" },
    { id: 3, name: "Citra Dewi", unit: "IT" },
  ]);

  const handleChangeUnit = (id, newUnit) => {
    const updatedEmployees = employees.map((emp) =>
      emp.id === id ? { ...emp, unit: newUnit } : emp
    );
    setEmployees(updatedEmployees);
    alert(`✅ Unit karyawan berhasil diubah menjadi: ${newUnit}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-start pt-24 pb-12">
      <HRHeader />
      <div className="w-11/12 max-w-5xl bg-white shadow-lg rounded-2xl p-8">
       <h2 className="text-xl font-bold text-center text-gray-800 mb-6 border-b pb-3">
          Employee Status Management
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <thead>
              <tr className="bg-gradient-to-r from-blue-500 to-blue-700 text-white">
                <th className="px-6 py-4 text-center font-semibold">ID</th>
                <th className="px-6 py-4 text-center font-semibold">Nama</th>
                <th className="px-6 py-4 text-center font-semibold">Unit Sekarang</th>
                <th className="px-6 py-4 text-center font-semibold">Ubah Unit</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr
                  key={emp.id}
                  className="bg-white hover:bg-blue-50 transition duration-200"
                >
                  <td className="border px-6 py-4 text-center">{emp.id}</td>
                  <td className="border px-6 py-4 text-center font-medium text-gray-700">
                    {emp.name}
                  </td>
                  <td className="border px-6 py-4 text-center font-semibold text-blue-600">
                    {emp.unit}
                  </td>
                  <td className="border px-6 py-4 text-center">
                    <select
                      defaultValue={emp.unit}
                      onChange={(e) => handleChangeUnit(emp.id, e.target.value)}
                      className="border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none text-sm"
                    >
                      <option value="Finance">Finance</option>
                      <option value="HR">HR</option>
                      <option value="IT">IT</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Operation">Operation</option>
                      <option value="Pulp">Pulp</option>
                      <option value="Paper">Paper</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeeStatus;