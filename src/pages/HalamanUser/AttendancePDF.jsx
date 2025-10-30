// src/pages/hr/AttendancePDF.jsx (Revisi Akhir: Perbaikan Alignment Data dan Lebar Kolom)
import React from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Download } from 'lucide-react';

// Helper untuk memformat tanggal YYYY-MM-DD menjadi DD/MM/YYYY
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

const generateTrainingDates = (start, end) => {
    const dates = [];
    let currentDate = new Date(start);
    const endDate = new Date(end);

    while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            dates.push(new Date(currentDate));
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
};

const determineTimeSessions = (jamMulai, jamSelesai) => {
    const toMinutes = (time) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    };

    const start = toMinutes(jamMulai);
    const end = toMinutes(jamSelesai);
    const splitPoint = toMinutes('12:00');
    
    const sessions = [];
    const defaultMorningEnd = toMinutes('11:00');

    if (start < splitPoint && end > splitPoint && end > defaultMorningEnd) {
        sessions.push({ label: 'Sesi Pagi', range: `${jamMulai}-11:00` }); 
        sessions.push({ label: 'Sesi Siang', range: `13:00-${jamSelesai}` });
    } else {
        sessions.push({ label: 'Sesi 1', range: `${jamMulai}-${jamSelesai}` });
    }
    
    return sessions;
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
            const { noReg = 'N/A', area = 'N/A', tanggalMulai, tanggalSelesai, jamMulai = 'N/A', jamSelesai = 'N/A', totalHari = 1 } = registrationData;
            
            const mainInstructorName = registrationData.instrukturDetails?.[0]?.nama || registrationData.namaInstruktur || 'N/A';
            
            const formattedTglMulai = formatDate(tanggalMulai);
            const formattedTglSelesai = formatDate(tanggalSelesai);
            const jamRange = `${jamMulai} - ${jamSelesai}`;

            // --- Tentukan Kolom Dinamis ---
            const trainingDates = generateTrainingDates(tanggalMulai, tanggalSelesai);
            const selectedDate = trainingDates[0] ? trainingDates[0].toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' }) : 'N/A';
            
            const timeSessions = determineTimeSessions(jamMulai, jamSelesai);
            const dynamicCols = timeSessions.slice(0, 3); 

            while (dynamicCols.length < 3) {
                dynamicCols.push({ label: '', range: '' });
            }

            // --- PERHITUNGAN PARTISIPAN ---
            const countTrainee = participantsData.filter(p => p.role === 'T').length;
            const instructorInParticipants = participantsData.filter(p => p.role === 'I').length; 
            
            let finalInstructorCount = instructorInParticipants;
            if (finalInstructorCount === 0 && mainInstructorName !== 'N/A') {
                finalInstructorCount = 1;
            }
            const participantString = `Instructor (I)=${finalInstructorCount}, Trainee (T)=${countTrainee}`;

            // --- PERHITUNGAN LEBAR TABEL DAN MARGIN PENENGAHAN ---
            // Total Col Width: 8 + 15 + 25(Name) + 20(Sect) + 10(Role) + (12 * 3) + 20 + 10 + 10 + (8 * 4) = 179 mm
            const totalColWidth = 8 + 15 + 25 + 20 + 10 + (12 * 3) + 20 + 10 + 10 + (8 * 4); 
            const docWidth = doc.internal.pageSize.getWidth(); // 210 mm
            const marginLeft = (docWidth - totalColWidth) / 2; // Margin untuk penengahan tabel
            // --- END PERHITUNGAN ---

            // --- HEADER TITLE ---
            doc.setFontSize(14);
            doc.text("ATTENDANCE LIST", 105, 12, { align: "center" });
            
            // GARIS DI BAWAH JUDUL
            const lineY = 15;
            doc.setLineWidth(0.5);
            const lineLength = 50; 
            const lineStartX = 105 - (lineLength / 2);
            const lineEndX = 105 + (lineLength / 2);
            doc.line(lineStartX, lineY, lineEndX, lineY); 
            
            // TAMBAHKAN SPACE/JARAK EKSTRA
            let yPosition = lineY + 10; 
            doc.setFontSize(9);
            
            // --- HEADER INFORMASI STATIS (Disesuaikan Margingnya) ---
            const textIndent = 36; 
            
            const printLine = (label, value) => {
                doc.text(`${label}`, marginLeft, yPosition); 
                doc.text(`: ${value}`, marginLeft + textIndent, yPosition); 
                yPosition += 5;
            };
            
            printLine("Registration No", noReg);
            printLine("Event Title", trainingTitle);
            printLine("Event Organizer", area);
            printLine("Event Duration", `${formattedTglMulai} - ${formattedTglSelesai} | ${jamRange} | ${totalHari} Hari`);
            printLine("Participant", participantString); 
            
            // --- KONSTRUKSI TABEL ABSENSI ---
            
            // Baris Header 1: Menampilkan Tanggal
            const headRow1 = [
                { content: "No", rowSpan: 2, styles: { cellWidth: 8 } }, 
                { content: "SAP ID", rowSpan: 2, styles: { cellWidth: 15 } }, 
                { content: "Name", rowSpan: 2, styles: { cellWidth: 25, halign: "center" } }, // LEBAR KECIL (25), JUDUL CENTER
                { content: "Sect", rowSpan: 2, styles: { cellWidth: 20, halign: "center" } }, // LEBAR BESAR (20), JUDUL CENTER
                { content: "Role", rowSpan: 2, styles: { cellWidth: 10, halign: "center" } }, 
                
                // Kolom Absensi: Tanggal di baris pertama
                { content: selectedDate, colSpan: 3, styles: { fillColor: [200, 200, 200], textColor: 20 } },
                
                { content: "Signature", rowSpan: 2, styles: { cellWidth: 20 } }, 
                { content: "Pre Test", rowSpan: 2, styles: { cellWidth: 10 } }, 
                { content: "Post Test", rowSpan: 2, styles: { cellWidth: 10 } }, 
                { content: "Evaluation", colSpan: 4, styles: { fillColor: [220, 220, 220], textColor: 20 } }, 
            ];
            
            // Baris Header 2: Menampilkan Jam per Sesi dan Skala Penilaian
            const headRow2 = [
                // Sesi Jam (Kolom 1, 2, 3)
                { content: dynamicCols[0].range || '', styles: { cellWidth: 12 } },
                { content: dynamicCols[1].range || '', styles: { cellWidth: 12 } },
                { content: dynamicCols[2].range || '', styles: { cellWidth: 12 } },
                // Skala Penilaian
                { content: "1", styles: { cellWidth: 8 } }, 
                { content: "2", styles: { cellWidth: 8 } }, 
                { content: "3", styles: { cellWidth: 8 } },
                { content: "4", styles: { cellWidth: 8 } }
            ];

            const tableHead = [headRow1, headRow2];

            // Isi baris (Kosong untuk TTD/Absen)
            const tableRows = participantsData.map((p, idx) => {
                const row = [
                    idx + 1,
                    p.nik || "-", 
                    p.nama || "-",
                    p.unit || "-", 
                    p.role || "-",
                    // Kolom Absensi (Sesi Jam 1, 2, 3) - Kosong
                    "", "", "", 
                    // Kolom Signature, Pre Test, Post Test
                    "", "", "", 
                    // Kolom Evaluation (1, 2, 3, 4)
                    "", "", "", "" 
                ];
                return row.map((cell) => ({ content: cell }));
            });

            // Panggil autoTable
            autoTable(doc, {
                head: tableHead,
                body: tableRows,
                startY: yPosition + 5, 
                theme: "grid",
                
                // Margin kiri dihitung secara manual
                margin: { left: marginLeft, right: marginLeft }, 
                tableWidth: totalColWidth,
                
                headStyles: { 
                    fillColor: [220, 220, 220], 
                    textColor: 20, 
                    halign: 'center', 
                    valign: 'middle',
                },
                styles: { 
                    fontSize: 8, 
                    cellPadding: 2, 
                    lineWidth: 0.2, 
                    minCellHeight: 8
                }, 
                columnStyles: {
                    0: { cellWidth: 8, halign: "center" }, // Data No: Center
                    1: { cellWidth: 15, halign: "center" }, // Data SAP ID: Center
                    2: { cellWidth: 25, halign: "left" }, // Data Name: Rata Kiri
                    3: { cellWidth: 20, halign: "left" }, // Data Sect: Rata Kiri
                    4: { cellWidth: 10, halign: "center" }, // Data Role: Center
                    5: { cellWidth: 12, halign: "center" }, 
                    6: { cellWidth: 12, halign: "center" },
                    7: { cellWidth: 12, halign: "center" }, 
                    8: { cellWidth: 20, halign: "center" }, 
                    9: { cellWidth: 10, halign: "center" }, 
                    10: { cellWidth: 10, halign: "center" }, 
                    11: { cellWidth: 8, halign: "center" }, 
                    12: { cellWidth: 8, halign: "center" }, 
                    13: { cellWidth: 8, halign: "center" },
                    14: { cellWidth: 8, halign: "center" }, 
                },
            });

            const finalY = doc.lastAutoTable?.finalY || 100;

            // Footer (Disesuaikan menggunakan marginLeft)
            doc.setFontSize(9);
            doc.text("Supervision from HR Personnel", marginLeft, finalY + 8); 
            
            const datePrintedText = `Date Printed: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) + " " + new Date().toLocaleTimeString('id-ID')}`;
            const pageNumberText = `Page: 1 of ${doc.internal.pages.length}`;
            
            doc.text(datePrintedText, marginLeft, finalY + 24); 
            doc.text(pageNumberText, docWidth - marginLeft, finalY + 24, { align: 'right' }); 

            doc.save(`Absensi_${trainingTitle.replace(/\s/g, '_')}.pdf`);
        } catch (err) {
            console.error("generate PDF error:", err);
            alert("Gagal membuat PDF. Cek log konsol (F12) untuk detail error.");
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