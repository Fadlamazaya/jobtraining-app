// src/pages/hr/AttendancePDF.jsx
import React from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable"; // v4 pakai function, v3 side-effect

const AttendancePDF = ({ approvedRequests = [] }) => {
  const handleDownloadPDF = () => {
    if (!approvedRequests || approvedRequests.length === 0) {
      alert("Tidak ada registrasi yang disetujui oleh manager untuk diekspor.");
      return;
    }

    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      doc.setFontSize(12);
      doc.text("ATTENDANCE LIST", 105, 12, { align: "center" });

      // Header info
      doc.setFontSize(9);
      doc.text("Registration No : TK25050055", 14, 20);
      doc.text("Event Title     : APP LIFE SAVING RULES", 14, 26);
      doc.text("Event Organizer : V010 (1) - MAINTENANCE CHEMICAL", 14, 32);
      doc.text("Event Duration  : 20/05/2025 13:00 - 17:00 | 1 Group(s)", 14, 38);
      doc.text(
        "Participant     : Instructor (1), Trainee (T) = " + approvedRequests.length,
        14,
        44
      );
      doc.text("Group No. : 1 | 20/05/2025 13:00 - 17:00", 14, 50);

      // Kolom tabel
      const tableColumn = [
        "No",
        "SAP ID",
        "Name",
        "Sect",
        "Role",
        "Signature",
        "Pre Test",
        "Post Test",
        "Practical Test",
      ];

      // Isi tabel
      const tableRows = approvedRequests.map((req, idx) => [
        idx + 1,
        req.sapId || `10${1000 + req.id}`,
        req.nama || "-",
        req.sect || "V010",
        req.role || "T",
        "", "", "", ""
      ]);

      // ✅ Auto detect apakah pakai v3 (doc.autoTable) atau v4 (autoTable function)
      if (typeof doc.autoTable === "function") {
        // v3
        doc.autoTable({
          head: [tableColumn],
          body: tableRows,
          startY: 56,
          theme: "grid",
          headStyles: { fillColor: [200, 200, 200], textColor: 20 },
          styles: { fontSize: 8, cellPadding: 2 },
          columnStyles: {
            0: { cellWidth: 8 },
            1: { cellWidth: 22 },
            2: { cellWidth: 55, halign: "left" },
            3: { cellWidth: 15 },
            4: { cellWidth: 12 },
            5: { cellWidth: 30 },
            6: { cellWidth: 18 },
            7: { cellWidth: 18 },
            8: { cellWidth: 25 },
          },
        });
      } else {
        // v4
        autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 56,
        theme: "grid",
        headStyles: { fillColor: [200, 200, 200], textColor: 20 },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
            0: { cellWidth: 10 },  // No
            1: { cellWidth: 20 },  // SAP ID
            2: { cellWidth: 50 },  // Name
            3: { cellWidth: 15 },  // Sect
            4: { cellWidth: 12 },  // Role
            5: { cellWidth: 25 },  // Signature
            6: { cellWidth: 15 },  // Pre Test
            7: { cellWidth: 15 },  // Post Test
            8: { cellWidth: 25 },  // Practical Test
        },
        });

      }

      // Posisi terakhir tabel
      const finalY = doc.lastAutoTable?.finalY || 70;

      // Footer
      doc.setFontSize(9);
      doc.text("Supervision from HR Personnel", 14, finalY + 8);
      doc.text("Date Printed: " + new Date().toLocaleString(), 14, finalY + 24);
      doc.text("Page: 1 of 1", 180, finalY + 24);

      doc.save("attendance_list.pdf");
    } catch (err) {
      console.error("generate PDF error:", err);
      alert("Gagal membuat PDF — cek console untuk detail.");
    }
  };

  return (
    <button
      onClick={handleDownloadPDF}
      className="px-3 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
    >
      Download Absensi (PDF)
    </button>
  );
};

export default AttendancePDF;