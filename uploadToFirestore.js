import { initializeApp } from "firebase/app";
import { getFirestore, collection, setDoc, doc } from "firebase/firestore";
import * as fs from "fs";
import csv from "csv-parser";

// Konfigurasi Firebase kamu
const firebaseConfig = {
  apiKey: "AIzaSyBNQInhFZDD4bznrJPIaX2AqcF4ncS59kk",
  authDomain: "jt-db-1e666.firebaseapp.com",
  projectId: "jt-db-1e666",
  storageBucket: "jt-db-1e666.firebasestorage.app",
  messagingSenderId: "543145504557",
  appId: "1:543145504557:web:ace3c4cba9233bcf722da4"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Baca file CSV
fs.createReadStream("karyawan.csv")
  .pipe(csv())
  .on("data", async (row) => {
    try {
      const docRef = doc(collection(db, "users"), row.NIK);
      await setDoc(docRef, {
        name: row.Name,
        nik: row.NIK,
        areaKerja: row["Area Kerja"],
        position: row.Position,
        email: row.Email,
        password: row.Pass,
      });
      console.log(`✅ Berhasil tambah: ${row.Name}`);
    } catch (err) {
      console.error("❌ Gagal tambah data:", err);
    }
  })
  .on("end", () => {
    console.log("🔥 Semua data berhasil diupload!");
  });
