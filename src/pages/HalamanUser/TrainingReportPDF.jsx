// src/pages/hr/TrainingReportPDF.jsx
import React from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Download } from 'lucide-react';

// Helper untuk memformat tanggal YYYY-MM-DD menjadi DD/MM/YYYY
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        // Menggunakan format DD/MM/YYYY
        return date.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch (e) {
        return dateString; 
    }
};

// Helper untuk format display tanggal: DD/MM
const formatDisplayDateDM = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' });
    } catch (e) {
        return 'N/A';
    }
};

// Fungsi dari template Absensi untuk menghitung hari training
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

// Fungsi dari template Absensi untuk menentukan sesi jam
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

const TrainingReportPDF = ({ 
    participantsData = [], // Ini adalah array 'participants' dari Firestore
    trainingTitle = "Training Umum", 
    registrationData = {} 
}) => {
    
    // Mapping data peserta, mengambil pretest/posttest
    const participantsFinal = participantsData
        .map(p => ({
            name: p.nama, 
            sapId: p.nik, // SAP ID (NIK)
            sect: p.unit, // Sect (Unit)
            role: p.role,
            pretest: p.pretest !== undefined && p.pretest !== null ? String(p.pretest) : '', 
            posttest: p.posttest !== undefined && p.posttest !== null ? String(p.posttest) : '',
        }))
        // Urutkan berdasarkan SAP ID
        .sort((a, b) => a.sapId.localeCompare(b.sapId));


    const participantCount = participantsFinal.length;
    const isDisabled = participantCount === 0;

    const handleDownloadPDF = () => {
        if (isDisabled) {
            alert("Tidak ada peserta yang terdaftar.");
            return;
        }
        
        try {
            const doc = new jsPDF({ unit: "mm", format: "a4" });
            const now = new Date();
            const datePrinted = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) + " " + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
            
            // Ambil data registrasi
            const { 
                noReg = 'N/A', 
                area = 'N/A', 
                tanggalMulai, 
                tanggalSelesai, 
                jamMulai = 'N/A', 
                jamSelesai = 'N/A',
                totalHari = 1
            } = registrationData;
            
            const formattedTglMulai = formatDate(tanggalMulai);
            const formattedTglSelesai = formatDate(tanggalSelesai);
            const jamRange = `${jamMulai} - ${jamSelesai}`;
            
            const instructorCount = participantsData.filter(p => p.role === 'I').length;
            const traineeCount = participantsData.filter(p => p.role === 'T').length;
            const participantString = `Instructor (I)=${instructorCount}, Trainee (T)=${traineeCount}`;

            // --- Tentukan Kolom Dinamis Absensi ---
            const trainingDates = generateTrainingDates(tanggalMulai, tanggalSelesai);
            const selectedDateHeader = trainingDates[0] ? formatDisplayDateDM(trainingDates[0]) : 'N/A';
            
            const timeSessions = determineTimeSessions(jamMulai, jamSelesai);
            // Ambil sesi jam pertama untuk header Absensi
            const timeSessionHeader = timeSessions[0]?.range || `${jamMulai}-${jamSelesai}`;

            // --- Perhitungan Margin/Lebar ---
            // Total Col Width harus sama dengan total lebar columnStyles di bawah (175mm)
            const totalColWidth = 8 + 15 + 30 + 30 + 10 + 15 + 20 + 10 + 10 + (8 * 4); // Total 175 mm
            const docWidth = doc.internal.pageSize.getWidth(); // 210 mm
            const marginLeft = (docWidth - totalColWidth) / 2; 

            // --- HEADER TITLE ---
            doc.setFontSize(14);
            doc.text("ATTENDANCE LIST", 105, 12, { align: "center" });
            
            // Garis di bawah judul
            const lineY = 15;
            doc.setLineWidth(0.5);
            const lineLength = 50; 
            doc.line(105 - (lineLength / 2), lineY, 105 + (lineLength / 2), lineY); 
            
            let yPosition = lineY + 10; 
            doc.setFontSize(9);
            
            // --- HEADER INFORMASI STATIS ---
            const textIndent = 36; 
            const printInfo = (label, value) => {
                doc.text(`${label}`, marginLeft, yPosition); 
                doc.text(`: ${value}`, marginLeft + textIndent, yPosition); 
                yPosition += 5;
            };
            
            printInfo("Registration No", noReg);
            printInfo("Event Title", trainingTitle);
            printInfo("Event Organizer", area);
            printInfo("Event Duration", `${formattedTglMulai} - ${formattedTglSelesai} | ${jamRange} | ${totalHari} Hari`);
            printInfo("Participant", participantString); 
            
            // --- KONSTRUKSI TABEL (Sesuai Gambar) ---
            
            // Baris Header 1: Multi-row/colspan
            const headRow1 = [
                { content: "No", rowSpan: 2, styles: { cellWidth: 8 } }, 
                { content: "SAP ID", rowSpan: 2, styles: { cellWidth: 15 } }, 
                { content: "Name", rowSpan: 2, styles: { cellWidth: 30 } }, 
                { content: "Sect", rowSpan: 2, styles: { cellWidth: 30 } }, 
                { content: "Role", rowSpan: 2, styles: { cellWidth: 10 } }, 
                
                // Kolom Absensi: Tanggal di baris pertama
                { content: selectedDateHeader, colSpan: 1, styles: { fillColor: [220, 220, 220], textColor: 20, cellWidth: 15 } },
                
                { content: "Signature", rowSpan: 2, styles: { cellWidth: 20 } }, 
                { content: "Pre Test", rowSpan: 2, styles: { cellWidth: 10 } }, 
                { content: "Post Test", rowSpan: 2, styles: { cellWidth: 10 } }, 
                { content: "Evaluation", colSpan: 4, styles: { fillColor: [220, 220, 220], textColor: 20 } }, 
            ];
            
            // Baris Header 2: Jam Sesi & Skala Penilaian
            const headRow2 = [
                // Sesi Jam (1 Kolom Absen)
                { content: timeSessionHeader, styles: { cellWidth: 15, fontSize: 8 } },
                // Skala Penilaian
                { content: "1", styles: { cellWidth: 8 } }, 
                { content: "2", styles: { cellWidth: 8 } }, 
                { content: "3", styles: { cellWidth: 8 } },
                { content: "4", styles: { cellWidth: 8 } }
            ];

            const tableHead = [headRow1, headRow2];

            // Isi baris (Memasukkan nilai Pre Test/Post Test)
            const tableRows = participantsFinal.map((p, idx) => {
                const row = [
                    idx + 1,
                    p.sapId, 
                    p.name,
                    p.sect, 
                    p.role,
                    // Kolom Absensi - Kosong
                    "", 
                    // Kolom Signature - Kosong
                    "", 
                    // Kolom Pre Test, Post Test (NILAI DI SINI)
                    p.pretest, 
                    p.posttest, 
                    // Kolom Evaluation (1, 2, 3, 4) - Kosong
                    "", "", "", "" 
                ];
                // Data Name dan Sect harus rata kiri
                return row.map((content, index) => ({ 
                    content: content, 
                    styles: (index === 2 || index === 3) ? { halign: 'left' } : {} 
                }));
            });

            // Konfigurasi lebar kolom dan alignment
            const columnStylesConfig = {
                0: { cellWidth: 8, halign: "center" },
                1: { cellWidth: 15, halign: "center" },
                2: { cellWidth: 30, halign: "left" }, // Name
                3: { cellWidth: 30, halign: "left" }, // Sect
                4: { cellWidth: 10, halign: "center" },
                5: { cellWidth: 15, halign: "center" }, // Kolom Absensi
                6: { cellWidth: 20, halign: "center" }, // Signature
                7: { cellWidth: 10, halign: "center" }, // Pre Test (Nilai)
                8: { cellWidth: 10, halign: "center" }, // Post Test (Nilai)
                9: { cellWidth: 8, halign: "center" }, // Eval 1
                10: { cellWidth: 8, halign: "center" }, // Eval 2
                11: { cellWidth: 8, halign: "center" }, // Eval 3
                12: { cellWidth: 8, halign: "center" }, // Eval 4
            };
            
            // Header Styles untuk kolom Pre Test/Post Test/Evaluation
            const specialHeaderStyles = {
                7: { fillColor: [200, 200, 200], textColor: 20 }, // Pre Test
                8: { fillColor: [200, 200, 200], textColor: 20 }, // Post Test
                9: { fillColor: [220, 220, 220], textColor: 20 }, // Eval 1
                10: { fillColor: [220, 220, 220], textColor: 20 }, // Eval 2
                11: { fillColor: [220, 220, 220], textColor: 20 }, // Eval 3
                12: { fillColor: [220, 220, 220], textColor: 20 }, // Eval 4
            };

            // Panggil autoTable
            autoTable(doc, {
                head: tableHead,
                body: tableRows,
                startY: yPosition + 5, 
                theme: "grid",
                margin: { left: marginLeft, right: marginLeft },
                tableWidth: totalColWidth,
                headStyles: { 
                    fillColor: [220, 220, 220], // Default warna abu-abu muda
                    textColor: 20, 
                    halign: 'center', 
                    valign: 'middle',
                    // Gaya untuk header absensi dan evaluation (Baris 1)
                    0: { fillColor: [200, 200, 200] },
                    5: { fillColor: [200, 200, 200] }, // Tanggal Absensi
                    10: { fillColor: [220, 220, 220] }, // Evaluation
                },
                styles: { 
                    fontSize: 8, 
                    cellPadding: 2, 
                    lineWidth: 0.2, 
                    minCellHeight: 8
                }, 
                columnStyles: columnStylesConfig 
            });

            const finalY = doc.lastAutoTable?.finalY || yPosition;

            // Footer (Supervision, Date Printed, Page No)
            doc.setFontSize(9);
            doc.text("Supervision from HR Personnel", marginLeft, finalY + 8); 
            
            const pageNumberText = `Page: 1 of ${doc.internal.pages.length}`;
            
            doc.text(`Date Printed: ${datePrinted}`, marginLeft, finalY + 24); 
            doc.text(pageNumberText, docWidth - marginLeft, finalY + 24, { align: 'right' }); 

            doc.save(`Evaluasi_Absensi_${noReg}.pdf`);
        } catch (err) {
            console.error("generate PDF error:", err);
            alert("Gagal membuat PDF Laporan Nilai. Cek log konsol.");
        }
    };

    return (
        <button
            onClick={handleDownloadPDF}
            disabled={isDisabled}
            className={`inline-flex items-center px-4 py-2 text-white text-xs font-semibold rounded-lg shadow-sm transition 
                        ${isDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
            <Download className="w-4 h-4 mr-1" />
            Download Evaluasi (PDF)
        </button>
    );
};

export default TrainingReportPDF;