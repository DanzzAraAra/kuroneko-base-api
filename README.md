[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/colored.png)](#table-of-contents)

<div align="center">

# KuroNeko API

**Simple, Fast, and Dynamic REST API Base built with Express & TypeScript.**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)](https://expressjs.com/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

[**Demo Website**](https://kuronekoapy.vercel.app) • [**Rest Api**](https://nekoapy.zone.id) • [**Bug report**](https://github.com/DanzzAraAra/kuroneko-base-api/issues)

</div>

---

## 📖 Introduction

**KuroNeko API** adalah template dasar (boilerplate) untuk membuat REST API yang modern, rapi, dan mudah dikembangkan.

Project ini dirancang untuk mengatasi kerumitan setup awal dengan menyediakan fitur **Auto-Load Router** berbasis konfigurasi JSON, penghitung pengunjung (*visitor counter*), dan antarmuka dokumentasi (*Docs UI*) yang estetik secara otomatis.

### ✨ Fitur Utama

| Fitur | Deskripsi |
| :--- | :--- |
| 🚀 **TypeScript** | Coding lebih aman, rapi, dan minim bug dengan static typing. |
| ⚙️ **Dynamic Routing** | Tambah endpoint via `src/config.json` tanpa perlu mengubah `index.ts`. |
| 📖 **Auto Documentation** | Halaman `/docs` otomatis tergenerate berdasarkan config yang di buat. |
| 🎨 **Modern UI** | Tampilan Landing page & Docs yang bersih, modern, dan responsif. |
| 📊 **Visitor Counter** | Database JSON sederhana untuk melacak traffic API. |
| 📂 **Modular Structure** | Susunan folder dikelompokkan rapi berdasarkan kategori. |
| 🔧 **Build System** | Script otomatis untuk kompilasi TypeScript ke JavaScript (Production Ready). |

---

## 📂 Project Structure

Struktur folder disusun agar mudah dipahami dan dimodifikasi:

```text
.
├── index.ts                   # Entry point utama server (TypeScript source)
├── dist/                      # 📂 Compiled JavaScript files (Production)
│   ├── index.js               # Compiled main server file
│   ├── src/                   # Compiled source files & configs
│   └── router/                # Compiled route handlers
├── public/                    # Frontend files
│   ├── 404.html
│   ├── docs.html              # Halaman docs API
│   ├── landing.html           # Halaman utama
│   └── ...
├── router/                    # Folder Endpoint (Kategori - TypeScript)
│   ├── ai/
│   ├── download/
│   ├── maker/
│   ├── random/
│   ├── search/
│   └── tools/
├── src/                       # Source files & Logic
│   ├── autoload.ts            # Logic auto load router
│   ├── config.json            # Configuration router
│   ├── logger.ts
│   └── ...
├── package.json               # dependencies & scripts
├── tsconfig.json              # TypeScript configuration
└── vercel.json                # Vercel deployment config
```

📦 Build System & Folder dist/
Apa itu Folder dist/?
dist/ (singkatan dari distribution) adalah folder yang berisi hasil kompilasi kode dari TypeScript menjadi JavaScript. Folder ini penting karena:
 * Runtime: Node.js hanya bisa menjalankan JavaScript, bukan TypeScript secara langsung.
 * Performance: Kode yang dikompilasi lebih optimal untuk production.
 * Deploy: Folder ini yang akan dijalankan di server.
Perbandingan Mode
| Mode | Command | Folder | Keterangan |
|---|---|---|---|
| Development | npm run dev | Memory | Langsung jalankan TS dengan ts-node (Hot Reload). |
| Production | npm run build + npm start | dist/ | Kompilasi TS ke JS dulu, lalu jalankan file JS. |
🛠️ Installation & Running
Pastikan kamu sudah menginstall Node.js (versi 18 atau lebih baru).
1. Clone & Install
```bash
git clone [https://github.com/DanzzAraAra/kuroneko-base-api.git](https://github.com/DanzzAraAra/kuroneko-base-api.git)
cd kuroneko-base-api
npm install
```

2. Mode Development
Gunakan ini saat sedang mengedit kode. Server akan restart otomatis jika ada perubahan file.
```bash
npm run dev
```

> Server berjalan di: http://localhost:3000
> 
3. Build untuk Production
Gunakan ini sebelum upload ke server hosting.
```bash
npm run build
```

Script ini akan membersihkan folder dist/, mengkompilasi TS ke JS, dan menyalin file asset (html, json, gambar).
4. Jalankan Production
```bash
npm start
```

📝 Scripts Reference
Berikut adalah penjelasan script yang ada di package.json:
```json
{
  "scripts": {
    "clean": "rm -rf dist",                     // Menghapus folder dist lama
    "prebuild": "npm run clean",                // Dijalankan otomatis sebelum build
    "build": "tsc && npm run copy-assets",      // Kompilasi TS & Salin Assets
    "copy-assets": "...",                       // Logic menyalin file non-TS ke dist
    "start": "node dist/index.js",              // Menjalankan server production
    "dev": "ts-node index.ts",                  // Menjalankan mode dev standar
    "dev:watch": "nodemon --exec ts-node index.ts" // Mode dev dengan auto-reload
  }
}
```

⚡ Adding a New Endpoint
Kamu tidak perlu mengedit index.ts! Cukup ikuti 3 langkah ini:
Step 1: Daftarkan di src/config.json
Buka file src/config.json dan tambahkan metadata endpoint kamu di dalam object "tags".
```json
{
  "tags": {
    "games": [ 
      {
        "name": "Tebak Gambar",          // Judul di Docs
        "endpoint": "/api/games/tebak",  // URL Path
        "filename": "tebak",             // Nama file logic (tanpa .ts)
        "method": "GET",                 // Method HTTP
        "params": [                      // Parameter (muncul di Docs)
          {
            "name": "level",
            "required": true,
            "description": "1-100"
          }
        ]
      }
    ]
  }
}
```
Step 2: Buat Logic File
Buat file TypeScript sesuai struktur folder kategori di router/.
 * Kategori: games
 * Filename: tebak
 * Path: router/games/tebak.ts
<!-- end list -->
```typescript
import { Request, Response } from 'express';

export default async function (req: Request, res: Response) {
    // 1. Ambil parameter
    const { level } = req.query; 

    // 2. Validasi
    if (!level) return res.json({ status: false, message: "Level required!" });

    // 3. Logic & Response
    res.json({
        status: true,
        result: {
            message: `Kamu memilih level ${level}`,
            image: "[https://example.com/img.jpg](https://example.com/img.jpg)"
        }
    });
};
```

Step 3: Test
Jika mode dev, cukup refresh browser. Jika mode prod, lakukan npm run build lagi. Endpoint baru akan otomatis muncul di halaman /docs.
🚀 Deployment
Option A: Vercel (Recommended)
 * Push kode ke GitHub.
 * Import repository ke Vercel.
 * Vercel akan otomatis mendeteksi vercel.json dan melakukan build.
Option B: VPS / Panel (Manual)
# 1. Build project di komputer lokal atau di server
```bash
npm run build
```

# 2. Pastikan folder 'dist/' sudah ada
# 3. Jalankan command start
```bash
npm start
```

Option C: PM2 (Process Manager)
Agar server tetap berjalan di background (VPS):
```bash
npm install -g pm2
pm2 start dist/index.js --name "kuroneko-api"
pm2 save
pm2 startup
```

🖼️ Dokumentasi UI
Project ini dilengkapi GUI bawaan:
 * / : Landing Page
 * /docs : Swagger-like documentation (Auto generated)
 * /config : Cek konfigurasi JSON
 * /donasi : Support creator page
🐛 Troubleshooting Common Issues
<details>
<summary><b>Error: "Cannot find module './src/qris'"</b></summary>

 * Penyebab: Kamu mencoba menjalankan file JS tapi belum melakukan build.
 * Solusi: Jalankan npm run build terlebih dahulu. Cek apakah file dist/src/qris.js sudah terbentuk.

</details>
<details>
<summary><b>Error TypeScript Compilation</b></summary>

 * Solusi: Cek error log. Jika terlalu ketat, kamu bisa mematikan strict mode di tsconfig.json dengan mengubah "strict": true menjadi false.

</details>
<details>
<summary><b>QRIS Image tidak muncul</b></summary>

 * Solusi: Buka src/qris.ts dan pastikan variabel STATIC_QRIS sudah diisi dengan string URL/Base64 QRIS yang valid.

</details>
<div align="center">
Created with ❤️ by Danzz
</div>
