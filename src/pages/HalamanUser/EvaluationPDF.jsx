import React from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Download } from "lucide-react";

// Helper function untuk format tanggal
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
};

const EvaluationPDF = ({ trainingData }) => {
  const {
    judulTraining,
    namaInstruktur,
    tanggalMulai,
    tanggalSelesai,
    noReg,
  } = trainingData;

  // Placeholder tanggal yang rapi
  const dateRange =
    tanggalMulai && tanggalSelesai
      ? `${new Date(tanggalMulai).getDate()} - ${new Date(
          tanggalSelesai
        ).getDate()} ${new Date(tanggalSelesai).toLocaleString("id-ID", {
          month: "long",
          year: "numeric",
        })}`
      : "22 - 22 Oktober 2025"; 

  const handleGenerateForm = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Styling dasar
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    let currentY = 10;
    const margin = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    const tableWidth = pageWidth - 2 * margin; // 190mm
    
    // === LEBAR KOLOM (TANPA NA) ===
    const colScoreWidth = 10; // 4 * 10mm = 40mm
    const colCommentWidth = 45; 
    
    // Total lebar fixed (Score + Comment) = 40 + 45 = 85mm
    // Sisa lebar untuk Kolom Kriteria: 190mm - 85mm = 105mm
    const colCriteriaWidth = tableWidth - (colScoreWidth * 4) - colCommentWidth; // 190 - 85 = 105mm

    const lineColor = [0, 0, 0];
    const textColor = [0, 0, 0];
    const cellMinHeight = 6; 
    
    const tableMargin = { left: margin, right: margin };

    // === HEADER UTAMA & INFO PELATIHAN ===
    doc.setFontSize(8);

    // Tabel Paling Atas (Judul Training, Tanggal)
    autoTable(doc, {
      body: [
        [
          {
            content: judulTraining || "Sertifikasi Operator Pallet Mover & Scissor Lift",
            styles: {
              fontStyle: "bold",
              fontSize: 9,
              halign: "left",
              cellWidth: 95, 
              minCellHeight: cellMinHeight,
            },
            rowSpan: 1, 
          },
          {
            content: "Tanggal Pelaksanaan :",
            styles: {
              halign: "right", 
              cellWidth: 35,
              valign: "middle",
              minCellHeight: cellMinHeight,
            },
          },
          {
            content: dateRange,
            styles: {
              halign: "center",
              cellWidth: 60, 
              fontStyle: "bold",
              minCellHeight: cellMinHeight,
            },
          },
        ],
      ],
      theme: "grid",
      startY: currentY,
      margin: tableMargin,
      styles: {
        fontSize: 7,
        cellPadding: 1,
        lineColor: lineColor,
        lineWidth: 0.1,
        textColor: textColor,
      },
    });

    currentY = doc.lastAutoTable.finalY;

    // Tabel Informasi Peserta (Nama, SAP ID, Position, Unit)
    autoTable(doc, {
      body: [
        [
          { content: "Nama Peserta :", styles: { halign: "left", cellWidth: 95, minCellHeight: cellMinHeight } },
          { content: "Position :", styles: { halign: "right", cellWidth: 35, minCellHeight: cellMinHeight } },
          { content: "", styles: { cellWidth: 60, minCellHeight: cellMinHeight } }, 
        ],
        [
          { content: "SAP ID :", styles: { halign: "left", cellWidth: 95, minCellHeight: cellMinHeight } },
          { content: "Unit :", styles: { halign: "right", cellWidth: 35, minCellHeight: cellMinHeight } },
          { content: "", styles: { cellWidth: 60, minCellHeight: cellMinHeight } }, 
        ],
      ],
      theme: "grid",
      startY: currentY,
      margin: tableMargin,
      styles: {
        fontSize: 7,
        cellPadding: 1,
        lineColor: lineColor,
        lineWidth: 0.1,
        textColor: textColor,
      },
    });

    currentY = doc.lastAutoTable.finalY + 2; 

    // === UTILITY FUNCTIONS FOR TABLE HEADERS & CONFIG (TANPA KOLOM NA) ===
    
    const getEvaluationHead = (title, scaleType) => {
        const agreementLabels = ["Sangat\nTidak\nSetuju\n1", "Tidak\nSetuju\n2", "Setuju\n3", "Sangat\nSetuju\n4"];
        
        let scaleLabels;
        let scaleTitle;

        if (scaleType === 'agreement') {
            scaleLabels = agreementLabels;
            scaleTitle = "Tingkat Persetujuan";
        } else if (scaleType === 'time_value') {
            scaleLabels = ["Tidak\nEfektif\n1", "Kurang\nEfektif\n2", "Efektif\n3", "Sangat\nEfektif\n4"];
            scaleTitle = "Tingkat Efektivitas";
        }
        else { // effectiveness
            scaleLabels = ["Sangat\nTidak\nEfektif\n1", "Tidak\nEfektif\n2", "Efektif\n3", "Sangat\nEfektif\n4"];
            scaleTitle = "Tingkat Efektivitas";
        }

        return [
            // Baris 1: Judul Bagian
            [
                { 
                    content: title, 
                    colSpan: 5, // Disesuaikan, sekarang mencakup Kriteria + 4 Skor
                    styles: { 
                        halign: "left", 
                        fontStyle: "bold",
                        fillColor: [255, 255, 255], 
                        textColor: textColor,
                        fontSize: 8,
                        minCellHeight: cellMinHeight - 2
                    } 
                },
                { content: "", styles: { fillColor: [255, 255, 255] } }, // Kolom Komentar Kosong
            ],
            // Baris 2: Judul Kriteria + Tingkat Persetujuan/Efektivitas + Komentar
            [
                { content: "Kriteria Evaluasi", styles: { cellWidth: colCriteriaWidth, halign: "center", fontStyle: "bold", fillColor: [245, 245, 245] } }, 
                { content: scaleTitle, colSpan: 4, styles: { halign: "center", fontStyle: "bold", fillColor: [245, 245, 245] } },
                { content: "Komentar", styles: { cellWidth: colCommentWidth, halign: "center", fontStyle: "bold", fillColor: [245, 245, 245] } },
            ],
            // Baris 3: Nilai Skala (1, 2, 3, 4)
            [
                { content: "", styles: { cellWidth: colCriteriaWidth, fillColor: [245, 245, 245], minCellHeight: cellMinHeight } }, 
                { content: scaleLabels[0], styles: { cellWidth: colScoreWidth, fontStyle: "bold", fillColor: [245, 245, 245], fontSize: 6 } },
                { content: scaleLabels[1], styles: { cellWidth: colScoreWidth, fontStyle: "bold", fillColor: [245, 245, 245], fontSize: 6 } },
                { content: scaleLabels[2], styles: { cellWidth: colScoreWidth, fontStyle: "bold", fillColor: [245, 245, 245], fontSize: 6 } },
                { content: scaleLabels[3], styles: { cellWidth: colScoreWidth, fontStyle: "bold", fillColor: [245, 245, 245], fontSize: 6 } },
                { content: "", styles: { cellWidth: colCommentWidth, fillColor: [245, 245, 245], minCellHeight: cellMinHeight } },
            ]
        ];
    };

    const baseTableConfig = (head, body, startY) => ({
      head: head,
      body: body,
      startY: startY,
      theme: "grid",
      headStyles: {
        fillColor: [245, 245, 245],
        fontStyle: "normal",
        fontSize: 7,
        halign: "center",
        valign: "middle",
        lineColor: lineColor,
        lineWidth: 0.1,
        minCellHeight: cellMinHeight,
        textColor: textColor, 
      },
      styles: {
        fontSize: 7,
        cellPadding: 1,
        halign: "center",
        valign: "middle",
        lineColor: lineColor,
        lineWidth: 0.1,
        minCellHeight: cellMinHeight,
        textColor: textColor, 
      },
      columnStyles: {
        0: { cellWidth: colCriteriaWidth, halign: "left" }, // Kriteria (Baru di Index 0)
        1: { cellWidth: colScoreWidth },
        2: { cellWidth: colScoreWidth },
        3: { cellWidth: colScoreWidth },
        4: { cellWidth: colScoreWidth },
        5: { cellWidth: colCommentWidth, halign: "left" }, // Komentar (Baru di Index 5)
      },
      margin: tableMargin,
    });

    // Data Body disesuaikan (NA dihapus)
    const dataRow = (text, values = ["", "", "", ""]) => [text, ...values, ""];

    // === BAGIAN 1: PENILAIAN UMUM ===
    const criteriaGeneral = [
      dataRow("Program ini sangat berguna bagi saya."),
      dataRow("Nilai untuk waktu yang dihabiskan di Program ini sangat tinggi."),
      dataRow("Saya akan merekomendasikan Program ini ke rekan kerja lain."),
      dataRow("Tim Trainer/Fasilitator dari Program ini sangat efektif."),
    ];

    autoTable(
      doc,
      baseTableConfig(
        getEvaluationHead("Silahkan menilai program pelatihan ini secara keseluruhan:", "agreement"),
        criteriaGeneral,
        currentY
      )
    );

    currentY = doc.lastAutoTable.finalY + 2; 

    // === BAGIAN 2: LOGISTIK ===
    const logisticCriteria = [
      dataRow("Durasi dari sesi ini memuaskan."),
      dataRow("Lokasi training sudah optimal."),
      dataRow("Makanan dan konsumsi memuaskan."),
      dataRow("Materi/Bahan yang digunakan berkualitas baik."),
    ];

    autoTable(
      doc,
      baseTableConfig(
        getEvaluationHead("Logistik:", "agreement"),
        logisticCriteria,
        currentY
      )
    );

    currentY = doc.lastAutoTable.finalY + 2; 

    // === BAGIAN 3: NILAI / WAKTU YANG DIHABISKAN ===
    const timeValueCriteria = [
      dataRow("       "),
      dataRow("       "),
      dataRow("       "), 
    ];

    autoTable(
      doc,
      baseTableConfig(
          getEvaluationHead("Silakan menilai setiap sesi dalam hal Nilai / Waktu yang dihabiskan", "time_value"), 
          timeValueCriteria, 
          currentY
      )
    );

    currentY = doc.lastAutoTable.finalY + 2; 

    // === BAGIAN 4: EFEKTIVITAS PEMBAWAAN PROGRAM OLEH TRAINER/INSTRUKTUR ===
    const trainerCriteria = [
        dataRow("Instruktur secara keseluruhan"),
    ];

    autoTable(
      doc,
      baseTableConfig(
        getEvaluationHead("Silahkan menilai Trainer kami dalam hal: Efektivitas pembawaan program pelatihan", "effectiveness"),
        trainerCriteria,
        currentY
      )
    );

    currentY = doc.lastAutoTable.finalY + 2; 

    // === BAGIAN 5: NAMA INSTRUKTUR & VENDOR ===
    autoTable(doc, {
      head: [
        [
          { content: "Nama Instruktur", styles: { halign: "left" } },
          { content: "Disnaker dan Team Arpindo", styles: { halign: "left" } },
        ],
      ],
      body: [
        [
          { content: namaInstruktur || "" }, 
          { content: "" }, 
        ],
      ],
      startY: currentY,
      theme: "grid",
      headStyles: {
        fillColor: [245, 245, 245],
        fontStyle: "bold",
        fontSize: 7,
        lineColor: lineColor,
        lineWidth: 0.1,
        minCellHeight: cellMinHeight,
        textColor: textColor,
      },
      styles: {
        fontSize: 7,
        cellPadding: 2,
        halign: "left",
        lineColor: lineColor,
        lineWidth: 0.1,
        minCellHeight: cellMinHeight,
        textColor: textColor,
      },
      columnStyles: {
        0: { cellWidth: tableWidth / 2 },
        1: { cellWidth: tableWidth / 2 },
      },
      margin: tableMargin,
    });

    currentY = doc.lastAutoTable.finalY + 2; 

    // === BAGIAN 6: MINAT JADI FASILITATOR ===
    autoTable(doc, {
      head: [
        [
          {
            content:
              "Saya ingin terlibat/menjadi fasilitator untuk program yang akan datang/pelatihan lainnya",
            styles: { halign: "left" },
          },
          { content: "Ya" },
          { content: "Tidak" },
          { content: "Topik\nspesifik yg\ndiminati" },
        ],
      ],
      body: [["", "", "", ""]],
      startY: currentY,
      theme: "grid",
      headStyles: {
        fillColor: [245, 245, 245],
        fontStyle: "bold",
        fontSize: 7,
        halign: "center",
        valign: "middle",
        lineColor: lineColor,
        lineWidth: 0.1,
        minCellHeight: cellMinHeight,
        textColor: textColor,
      },
      styles: {
        fontSize: 7,
        cellPadding: 2,
        halign: "center",
        lineColor: lineColor,
        lineWidth: 0.1,
        minCellHeight: cellMinHeight,
        textColor: textColor,
      },
      columnStyles: {
        0: { cellWidth: 120, halign: "left" },
        1: { cellWidth: 15 },
        2: { cellWidth: 15 },
        3: { cellWidth: 40 },
      },
      margin: tableMargin,
    });

    currentY = doc.lastAutoTable.finalY + 5; // Jarak 5mm setelah tabel Minat Fasilitator (Untuk Kesan)

    // === BAGIAN 7: KOMENTAR & SARAN (DENGAN BOX) ===
    const boxWidth = tableWidth; // 190mm
    const boxHeight = 12; // Tinggi kotak 12mm

    doc.setFontSize(8);

    // 1. Kotak Isian Kesan
    doc.text("Apakah kesan dan saran anda terhadap program pelatihan ini?", margin, currentY);
    doc.rect(margin, currentY + 3, boxWidth, boxHeight); // +3mm jarak dari teks ke garis atas kotak
    currentY += boxHeight + 5; // Jarak 5mm ke pertanyaan Saran berikutnya

    // 2. Kotak Isian Saran
    // doc.text(
    //   "Apakah saran anda untuk meningkatkan efektivitas program pelatihan ini?", 
    //   margin,
    //   currentY
    // );
    // doc.rect(margin, currentY + 3, boxWidth, boxHeight); // +3mm jarak dari teks ke garis atas kotak

    // Menyimpan dokumen PDF
    doc.save(`Form_Evaluasi_${noReg || "Training"}.pdf`);
  };

  return (
    <button
      onClick={handleGenerateForm}
      className="px-4 py-2 text-white font-semibold rounded-lg shadow-md transition flex items-center bg-indigo-600 hover:bg-indigo-700"
    >
      <Download className="w-5 h-5 mr-2" />
      Download Form Evaluasi
    </button>
  );
};

export default EvaluationPDF;