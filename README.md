# 👁️ LuminaEye

<div align="center">

**Smart Eye Care & Circadian Display Control Desktop App for Windows**  
*Built with Tauri v2 (Rust) + React 19 + Vite + Tailwind CSS*

[![Platform](https://img.shields.io/badge/Platform-Windows_10_%2F_11-0078D6?logo=windows)](https://microsoft.com/windows)
[![Tauri](https://img.shields.io/badge/Tauri-v2.12-FFC131?logo=tauri&logoColor=white)](https://tauri.app/)
[![Rust](https://img.shields.io/badge/Backend-Rust_2024-DEA584?logo=rust&logoColor=black)](https://rust-lang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

</div>

---

## 🌟 Fitur Utama (Key Features)

### 1. 🖥️ Real Physical Monitor Blue Light Filter (Hardware GDI LUT)
- Berbeda dari web app yang hanya mewarnai DOM jendela browser, **LuminaEye berinteraksi langsung dengan driver display Windows (`SetDeviceGammaRamp` & `EnumDisplayMonitors`)**.
- Mengubah spektrum suhu warna (Kelvin 1500K – 6500K) dan kecerahan pada seluruh monitor fisik Anda secara real-time tanpa delay dan tanpa beban CPU/GPU.
- Mendukung jadwal circadian otomatis siang & malam.

### 2. 🐱 Cat Gatekeeper Break Timer (20-20-20 Rule)
- Terinspirasi oleh konsep viral [zokuzoku/cat-gatekeeper](https://github.com/zokuzoku/cat-gatekeeper).
- Ketika waktu istirahat tiba, seekor kucing oranye (*ginger cat*) berjalan masuk ke layar dengan **latar belakang transparan** dan duduk memblokir layar monitor secara fullscreen.
- **Interaktif:** Klik / elus kucing untuk memicu suara meow & dengkuran (*purr*) yang disintesis secara offline via Web Audio API + efek hati melayang.
- Tombol **"Tahan untuk Lewati" (Long-press)** dan guard mode ketat untuk memastikan mata benar-benar beristirahat menatap kejauhan (6 meter).

### 3. 📥 Minimize to System Tray
- Tombol silang (**X**) otomatis meminimalkan jendela ke System Tray Windows agar filter layar dan pengingat istirahat tetap aktif berjalan di latar belakang.
- Klik kiri tray icon untuk membuka kembali aplikasi, atau klik kanan untuk menu cepat (*Buka* / *Keluar*).

### 4. 🚀 Launch on StartUp
- Opsi otomatis berjalan saat Windows booting via Windows Registry (`HKCU\Software\Microsoft\Windows\CurrentVersion\Run`), tanpa perlu hak akses Administrator.

### 5. 🎯 Focus & MagicX
- Fitur *reading-line* dan *spotlight* untuk menyorot teks atau area kerja penting sambil meredupkan bagian layar lainnya guna meningkatkan konsentrasi.

---

## 🛠️ Tech Stack

- **Backend:** [Rust](https://www.rust-lang.org/) (Edition 2024), Windows GDI32 / User32 FFI, Windows Registry
- **Framework Desktop:** [Tauri v2](https://v2.tauri.app/)
- **Frontend:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vite.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
- **Audio:** Web Audio API (Synthesized Feline Meow & Purr Sound Engine)

---

## 🚀 Cara Menjalankan (Development)

### Prasyarat
1. [Node.js](https://nodejs.org/) (v18+)
2. [Rust & Cargo](https://rustup.rs/) (v1.85+)
3. Build Tools untuk Visual Studio C++ (diperlukan oleh Rust di Windows)

### Langkah Instalasi

```bash
# 1. Clone repository
git clone https://github.com/username/luminaeye.git
cd luminaeye

# 2. Install dependensi frontend
npm install --legacy-peer-deps

# 3. Jalankan mode Desktop Development (Hot-Reload)
npm run desktop:dev
```

---

## 📦 Membangun Installer (.msi / .exe)

Untuk memproduksi file installer siap pakai untuk Windows:

```bash
npm run desktop:build
```

Hasil build installer akan otomatis tersimpan di:
- `src-tauri/target/release/bundle/msi/LuminaEye_0.1.0_x64_en-US.msi`
- Atau portable `.exe` di `src-tauri/target/release/app.exe`

---

## 📂 Struktur Direktori

```text
luminaeye/
├── public/
│   └── assets/
│       └── cat/              # Asset animasi transparan WebM Cat Gatekeeper
├── src/
│   ├── components/
│   │   ├── BlueLightPage.tsx       # Kontrol spektrum kelvin & filter layar
│   │   ├── BreakTimerPage.tsx      # Manajemen break timer & audio tester
│   │   ├── BrightnessPage.tsx      # Multi-monitor & hardware brightness
│   │   ├── CatGatekeeper.tsx       # Komponen transparan Cat Gatekeeper interaktif
│   │   ├── FocusMagicXPage.tsx     # Fitur fokus baca & spotlight
│   │   ├── OverviewPage.tsx        # Dashboard ringkasan & toggle desktop
│   │   └── ViewportOverlay.tsx     # Overlay transparan monitor & dimmer
│   ├── types/                      # TypeScript definitions
│   └── utils/                      # Color math & sound synthesizer
├── src-tauri/
│   ├── src/
│   │   ├── lib.rs                  # Tray, startup registry, IPC commands
│   │   ├── main.rs                 # Entry point Tauri Windows
│   │   └── monitor_gamma.rs        # Windows GDI SetDeviceGammaRamp engine
│   ├── Cargo.toml                  # Rust dependencies
│   └── tauri.conf.json             # Konfigurasi jendela transparan & packaging
└── package.json
```

---

## 📜 Lisensi (License)

Proyek ini didistribusikan di bawah lisensi **MIT**. Silakan lihat file `LICENSE` untuk informasi lebih lanjut.
Asset video `neko*.webm` merujuk pada karya [zokuzoku/cat-gatekeeper](https://github.com/zokuzoku/cat-gatekeeper).
