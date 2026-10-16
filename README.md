# HRIS Enterprise Frontend Web Portal

[![CI Build Suite](https://github.com/YOUR_GITHUB_USERNAME/hris-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_GITHUB_USERNAME/hris-frontend/actions)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)
![Hugeicons](https://img.shields.io/badge/Icons-Hugeicons%20Free-7C3AED)

Portal antarmuka web modern untuk HRIS Enterprise Platform. Dibangun dengan fokus pada kecepatan performa, estetika tampilan premium, dan alur kerja mandiri karyawan (ESS) serta manajemen manajerial HR yang responsif.

---

## 🎨 Fitur Antarmuka Utama

- **Employee Self-Service (ESS):**
  - **Widget Presensi & GPS Geolocation:** Sinkronisasi jam server WIB real-time, deteksi koordinat HTML5, kalkulasi jarak Haversine ke titik kantor HQ Jakarta (-6.225014, 106.809657), dan simulasi lokasi 0m.
  - **Riwayat & Rekap Kehadiran:** Filter bulan kalender, ringkasan total hadir, keterlambatan, dan jam kerja.
  - **Permohonan Cuti:** Pengecekan saldo cuti, batas pengajuan H-3, dan unggah surat sakit dokter (maks 1MB).
  - **Pengajuan Lembur:** Panduan kompensasi Depnaker (1.5x jam 1, 2.0x jam ke-2+), batas max 4 jam.
  - **Slip Gaji Digital:** Pratinjau rincian gaji pokok, tunjangan, potongan BPJS & PPh 21, serta 1-click download PDF resmi.
- **Portal Manajer Divisi:**
  - **Monitoring Presensi Tim:** Pantau jam masuk/pulang, jarak GPS, dan status keterlambatan anggota tim bawahan langsung.
  - **Persetujuan Tim:** Evaluasi dan verifikasi permohonan cuti dan lembur tahap 1.
- **Portal Administrasi HR:**
  - **Dashboard Analitik SDM:** Metrik beban gaji bulanan, kepatuhan toleransi jam kerja, grafik bar distribusi departemen, dan komposisi kontrak PKWT/PKWTT.
  - **Direktori Master Karyawan:** Pencarian instan nama/NIK, filter departemen/status, form tambah karyawan baru, dan modal inspeksi detail profil.
  - **Audit Anomali Presensi:** Deteksi keterlambatan >15 menit toleransi shift kerja dan otomatisasi estimasi denda potongan gaji.
  - **Engine Payroll Bulanan:** Pembuatan periode baru, 1-Click Generate Draf kalkulasi gaji seluruh karyawan, dan 1-Click Otorisasi & Publikasi oleh HR Manager.
- **Desain & Notifikasi:**
  - Full icon stroke rounded eksklusif dari **Hugeicons** (`@hugeicons/core-free-icons`).
  - Sistem **Floating Toast** elegan untuk feedback aksi pengguna.
  - 1-Click Quick Demo Role Switcher di bagian header.

---

## 🌿 Alur Percabangan (GitFlow)

- `main`: Cabang produksi (*production-ready bundle*).
- `dev`: Cabang integrasi pengembangan frontend aktif.
- `feature/<fitur-baru>`: Cabang pengerjaan komponen sebelum di-Pull Request ke `dev`.
- `hotfix/<perbaikan-ui>`: Cabang perbaikan cepat tampilan yang langsung disinkronkan ke `main` dan `dev`.

---

## 🤖 Robot Pengujian Otomatis (GitHub Actions CI)

Robot CI frontend (`.github/workflows/ci.yml`) akan otomatis memeriksa setiap push atau PR ke `main` dan `dev`:
1. Menyiapkan environment Node.js 22.
2. Menginstall dependensi proyek (`npm install`).
3. Menjalankan audit tipe ketat TypeScript dan pembuatan production bundle (`npm run build` / `tsc -b && vite build`).
4. Memastikan tidak ada kode yang menyebabkan *broken build* atau *runtime crash*.

---

## 💻 Panduan Instalasi Lokal

### 1. Kebutuhan Sistem
- Node.js >= 20.x (disarankan v22.x)
- NPM >= 10.x

### 2. Langkah Setup
```bash
# 1. Clone repositori
git clone https://github.com/YOUR_GITHUB_USERNAME/hris-frontend.git
cd hris-frontend

# 2. Install dependensi
npm install

# 3. Salin environment config
cp .env.example .env

# 4. Pastikan VITE_API_BASE_URL mengarah ke backend Laravel
# VITE_API_BASE_URL=http://127.0.0.1:8000/api

# 5. Jalankan dev server Vite
npm run dev
# Buka peramban di http://localhost:5173
```

### 3. Build Versi Produksi
```bash
npm run build
# Hasil bundle tersedia di folder /dist
```

---

## 🔑 Demo Kredensial Langsung (Password: `password`)

Gunakan tombol switcher demo pada halaman login atau header navigasi:
- **HR Manager:** `hrmanager@hris.local`
- **Line Manager:** `manager@hris.local`
- **HR Staff:** `hrstaff@hris.local`
- **Karyawan:** `employee@hris.local`
