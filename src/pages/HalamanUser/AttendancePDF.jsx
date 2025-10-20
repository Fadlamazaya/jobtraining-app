// src/pages/hr/AttendancePDF.jsx (Dengan 3 Kolom Kosong Baru)
import React from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Download } from 'lucide-react';

// Helper untuk memformat tanggal YYYY-MM-DD
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date)) return dateString; 
        return date.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch (e) {
        return dateString; 
    }
};

const AttendancePDF = ({ 
    participantsData = [], 
    trainingTitle = "N/A", 
    registrationData = {} 
}) => {
    
    const participantCount = participantsData.length;
    const isDisabled = participantCount === 0;

    const handleDownloadPDF = () => {
        if (isDisabled) {
            alert("Tidak ada peserta yang terdaftar dalam sesi yang disetujui ini.");
            return;
        }

        try {
            const doc = new jsPDF({ unit: "mm", format: "a4" });
            const datePrinted = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ", " + new Date().toLocaleTimeString('id-ID');

            const { noReg = 'N/A', area = 'N/A', namaInstruktur = 'N/A', tanggalMulai, tanggalSelesai, jamMulai = 'N/A', jamSelesai = 'N/A', totalHari = 1 } = registrationData;
            
            const formattedTglMulai = formatDate(tanggalMulai);
            const formattedTglSelesai = formatDate(tanggalSelesai);

            // --- LOGIKA PDF ---
            doc.setFontSize(14);
            doc.text("ATTENDANCE LIST", 105, 12, { align: "center" });
            
            doc.setFontSize(8);
            doc.text("Session: TE 6", 180, 10, { align: 'right' });
            doc.text(`Date: ${formatDate(new Date().toISOString())}`, 180, 15, { align: 'right' });

            // HEADER INFORMASI DINAMIS
            doc.setFontSize(9);
            const printLine = (label, value) => {
                doc.text(`${label}`, 14, yPosition);
                doc.text(`: ${value}`, 14 + 36, yPosition);
                yPosition += 6;
            };
            
            let yPosition = 20;
            
            const jam = `${jamMulai} - ${jamSelesai}`;
            const tanggalRange = `${formattedTglMulai} - ${formattedTglSelesai}`;
            const trainerCount = participantsData.filter(p => p.role === 'T').length;
            
            // Mencetak Baris per Baris
            printLine("Registration No", noReg);
            printLine("Event Title", trainingTitle);
            printLine("Event Organizer", area);
            printLine("Event Duration", `${tanggalRange} ${jam} | ${totalHari} Hari`);
            printLine("Participant", `Instructor (${namaInstruktur}), Trainee (T) = ${trainerCount}`);
            printLine("Group No.", `1 | ${tanggalRange} ${jam}`);
            
            
            // Kolom tabel MULTI-BARIS
            const tableHead = [
                [
                    { content: "No", rowSpan: 2 }, 
                    { content: "SAP ID", rowSpan: 2 }, 
                    { content: "Name", rowSpan: 2 }, 
                    { content: "Sect", rowSpan: 2 }, 
                    { content: "Role", rowSpan: 2 }, 
                    { content: "", rowSpan: 2 }, // KOLOM KOSONG BARU 1
                    { content: "", rowSpan: 2 }, // KOLOM KOSONG BARU 2
                    { content: "", rowSpan: 2 }, // KOLOM KOSONG BARU 3
                    { content: "Signature", rowSpan: 2 }, 
                    { content: "Pre Test", rowSpan: 2 }, 
                    { content: "Post Test", rowSpan: 2 }, 
                    { content: "Evaluation", colSpan: 4, styles: { fillColor: [220, 220, 220], textColor: 20 } }, 
                ],
                [ // Baris kedua untuk skala penilaian
                    { content: "1" }, { content: "2" }, { content: "3" }, { content: "4" }
                ]
            ];

            // Isi tabel
            const tableRows = participantsData.map((p, idx) => [
                idx + 1,
                p.nik || "-", p.nama || "-",
                p.unit || "-", p.role || "-",
                // Tambahkan 3 kolom kosong
                "", "", "", 
                // Kolom lainnya
                "", "", "", 
                // 4 kolom kosong untuk Penilaian 1, 2, 3, 4
                "", "", "", "" 
            ]);

            // Panggil autoTable
            autoTable(doc, {
                head: tableHead,
                body: tableRows,
                startY: yPosition + 3, // Lanjutkan dari posisi terakhir header
                theme: "grid",
                headStyles: { fillColor: [220, 220, 220], textColor: 20, halign: 'center' },
                styles: { fontSize: 8, cellPadding: 2, lineWidth: 0.2 }, // Garis dipertebal
                columnStyles: {
                    0: { cellWidth: 8 },
                    1: { cellWidth: 15 },
                    2: { cellWidth: 35, halign: "left" }, 
                    3: { cellWidth: 12 },
                    4: { cellWidth: 10 },
                    // 3 Kolom Kosong Tambahan
                    5: { cellWidth: 10 },
                    6: { cellWidth: 10 },
                    7: { cellWidth: 10 }, 
                    // Kolom lainnya
                    8: { cellWidth: 20 }, // Signature
                    9: { cellWidth: 10 },  // Pre Test
                    10: { cellWidth: 10 }, // Post Test
                    // Skala Penilaian (Evaluation)
                    11: { cellWidth: 10 },  // 1
                    12: { cellWidth: 10 },  // 2
                    13: { cellWidth: 10 }, // 3
                    14: { cellWidth: 10 }, // 4
                },
            });

            const finalY = doc.lastAutoTable?.finalY || 70;

            // Footer
            doc.setFontSize(9);
            doc.text("Supervision from HR Personnel", 14, finalY + 8);
            doc.text(`Date Printed: ${datePrinted}`, 14, finalY + 24); 
            doc.text(`Page: 1 of ${doc.internal.pages.length}`, 180, finalY + 24);

            doc.save(`Absensi_${trainingTitle.replace(/\s/g, '_')}.pdf`);
        } catch (err) {
            console.error("generate PDF error:", err);
            alert("Gagal membuat PDF. Cek log konsol.");
        }
    };

    return (
        <button
            onClick={handleDownloadPDF}
            disabled={isDisabled}
            className={`inline-flex items-center px-4 py-2 text-white rounded-lg shadow-sm transition 
                        ${isDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
        >
            <Download className="w-4 h-4 mr-2" />
            Download Absensi (PDF)
        </button>
    );
};

export default AttendancePDF;