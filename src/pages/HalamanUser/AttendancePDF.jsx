// src/pages/hr/AttendancePDF.jsx (Koreksi Final untuk Alignment Label)
import React from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Download } from 'lucide-react';

// Fungsi helper untuk memformat tanggal YYYY-MM-DD menjadi DD/MM/YYYY
const formatDate = (dateString) => {
    if (!dateString || dateString.includes('N/A')) return 'N/A';
    try {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
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
            const today = new Date().toLocaleDateString('id-ID', {day: '2-digit', month: '2-digit', year: 'numeric'});

            // --- DESTRUCTURING AMAN DARI FIRESTORE ---
            const { 
                noReg = 'N/A', 
                area = 'N/A', 
                namaInstruktur = 'N/A',
                tanggalMulai,
                tanggalSelesai,
                jamMulai = 'N/A',
                jamSelesai = 'N/A',
                totalHari = 1
            } = registrationData;
            
            // Format Tanggal untuk Tampilan PDF
            const formattedTglMulai = formatDate(tanggalMulai);
            const formattedTglSelesai = formatDate(tanggalSelesai);
            // -----------------------------------------------------------------

            // --- LOGIKA PDF ---
            doc.setFontSize(14);
            doc.text("ATTENDANCE LIST", 105, 12, { align: "center" });
            
            doc.setFontSize(8);
            doc.text("Session: TE 6", 180, 10, { align: 'right' });
            doc.text("Date: " + today, 180, 15, { align: 'right' });

            // HEADER INFORMASI DINAMIS
            doc.setFontSize(9);
            
            // Menggunakan spasi tetap (monospace style) untuk memastikan alignment rapi
            const labelSpacer = (label) => {
                const spaces = 17 - label.length; 
                return label + ' '.repeat(spaces) + ': ';
            };
            
            let yPosition = 20;
            const xPosition = 14;

            // 1. Registration No
            doc.text(labelSpacer("Registration No") + noReg, xPosition, yPosition); yPosition += 6;
            
            // 2. Event Title
            doc.text(labelSpacer("Event Title") + trainingTitle, xPosition, yPosition); yPosition += 6;
            
            // 3. Event Organizer (Area/Unit)
            doc.text(labelSpacer("Event Organizer") + area, xPosition, yPosition); yPosition += 6;
            
            // 4. Event Duration
            const jam = `${jamMulai} - ${jamSelesai}`;
            const tanggalRange = `${formattedTglMulai} - ${formattedTglSelesai}`;
            doc.text(labelSpacer("Event Duration") + `${tanggalRange} ${jam} | ${totalHari} Hari`, xPosition, yPosition); yPosition += 6;
            
            // 5. Participant Summary
            const trainerCount = participantsData.filter(p => p.role === 'T').length;
            doc.text(labelSpacer("Participant") + `Instructor (${namaInstruktur}), Trainee (T) = ${trainerCount}`, xPosition, yPosition); yPosition += 6;
            
            // 6. Group No.
            doc.text(labelSpacer("Group No.") + `1 | ${tanggalRange} ${jam}`, xPosition, yPosition); yPosition += 6; 
            
            // Kolom tabel (TETAP SAMA)
            const tableColumn = [
                "No", "SAP ID", "Name", "Sect", "Role", "Signature", 
                "Pre Test", "Post Test", "Practical Test",
            ];

            // Isi tabel
            const tableRows = participantsData.map((p, idx) => [
                idx + 1,
                p.nik || "-", p.nama || "-",
                p.unit || "-", p.role || "-",
                "", "", "", "" 
            ]);

            // Panggil autoTable
            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 56, // Posisi startY sudah diatur di bawah Header Info
                theme: "grid",
                headStyles: { fillColor: [200, 200, 200], textColor: 20 },
                styles: { fontSize: 8, cellPadding: 2, lineWidth: 0.1 },
                columnStyles: {
                    0: { cellWidth: 8, halign: 'center' },
                    1: { cellWidth: 20, halign: 'center' },
                    2: { cellWidth: 50, halign: "left" },
                    3: { cellWidth: 15 },
                    4: { cellWidth: 10, halign: 'center' },
                    5: { cellWidth: 30 }, 
                    6: { cellWidth: 15, halign: 'center' }, 
                    7: { cellWidth: 15, halign: 'center' }, 
                    8: { cellWidth: 22, halign: 'center' }, 
                },
            });

            const finalY = doc.lastAutoTable?.finalY || 70;

            // Footer
            doc.setFontSize(9);
            doc.text("Supervision from HR Personnel", 14, finalY + 8);
            doc.text("Date Printed: " + new Date().toLocaleString(), 14, finalY + 24);
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