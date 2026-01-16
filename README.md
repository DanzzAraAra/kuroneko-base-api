[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/colored.png)](#table-of-contents)

# KuroNeko API

> Simple, Fast, and Dynamic REST API Base built with Express & TypeScript.

> demo: https://kuronekoapy.vercel.app

> Rest Api: https://nekoapy.zone.id

Project ini adalah template dasar untuk membuat REST API yang modern, rapi, dan mudah dikembangkan. 
Dilengkapi dengan Auto-Load Router berbasis konfigurasi JSON, penghitung pengunjung (visitor counter), dan antarmuka dokumentasi (Docs UI) yang aesthetic.

✨ Fitur Utama

· 🚀 TypeScript: Coding lebih aman, rapi, dan minim bug.
· ⚙️ Dynamic Routing: Tambah endpoint via src/config.json tanpa perlu edit index.ts.
· 📖 Auto Documentation: Halaman /docs otomatis ter-generate dari config.
· 🎨 UI: Tampilan Landing page & Docs yang modern dan lucu.
· 📊 Visitor Counter: Simple database untuk menghitung traffic.
· 📂 Modular Structure: Susunan folder yang dikelompokkan berdasarkan kategori.
· 🔧 Build System: Kompilasi otomatis dari TypeScript ke JavaScript untuk production.

---

📂 Project Structure

Struktur folder ini:

```text
.
├── index.ts                   # Entry point utama server (TypeScript source)
├── dist/                      # Compiled JavaScript files for production
│   ├── index.js              # Compiled main server file
│   ├── src/                  # Compiled source files
│   │   ├── *.js              
│   │   └── *.json           # Config files
│   └── router/               # Compiled route handlers
├── package-lock.json
├── package.json              # Project dependencies & scripts
├── tsconfig.json             # TypeScript configuration
├── vercel.json               # Vercel deployment config
├── visitors.json             # Database simple visitor count
├── public/                   # Frontend static files
│   ├── 404.html
│   ├── docs.html            # Halaman dokumentasi API
│   ├── donasi.html
│   ├── landing.html         # Halaman utama
│   ├── script.js            # Logic frontend
│   └── style.css
├── router/                   # Folder Endpoint (Kategori - TypeScript)
│   ├── ai/
│   │   └── kuroneko.ts
│   ├── download/
│   │   ├── facebook.ts
│   │   ├── instagram.ts
│   │   └── tiktok.ts
│   ├── maker/
│   │   └── brat.ts
│   ├── random/
│   │   └── waifu.ts
│   ├── search/
│   │   ├── pinterest.ts
│   │   ├── tiktok.ts
│   │   └── yts.ts
│   └── tools/
│       ├── shorturl.ts
│       └── ssweb.ts
└── src/                      # Source files (TypeScript)
    ├── autoload.ts          # Logic auto load router
    ├── config.json          # Konfigurasi router/endpoint
    ├── danzz.jpg
    ├── logger.ts
    ├── qris.ts
    ├── reminder.json
    └── thumbnail.jpg
```

---

📦 Build System & Folder dist/

Apa itu Folder dist/?

dist/ (singkatan dari distribution) adalah folder yang berisi versi terkompilasi dari kode TypeScript menjadi JavaScript. Ini diperlukan karena:

1. Node.js hanya bisa menjalankan JavaScript - bukan TypeScript langsung
2. Optimasi untuk production - kode yang sudah dikompilasi lebih cepat
3. Portabilitas - mudah untuk deployment ke berbagai server

Proses Build: TypeScript → JavaScript

```
index.ts (TypeScript) → npm run build → dist/index.js (JavaScript)
src/qris.ts           →               → dist/src/qris.js
router/ai/kuroneko.ts →               → dist/router/ai/kuroneko.js
```

Perbedaan Development vs Production:

Mode Command Folder Keterangan
Development npm run dev Tidak perlu dist/ Langsung jalankan TypeScript dengan ts-node
Production npm run build + npm start Menggunakan dist/ TypeScript dikompilasi dulu ke JavaScript

---

🛠️ Installation & Running

Pastikan kamu sudah menginstall Node.js (versi 18+).

1. Clone Repository & Install Dependencies

```bash
git clone https://github.com/DanzzAraAra/kuroneko-base-api.git
cd kuroneko-base-api
npm install
```

2. Jalankan Mode Development:

```bash
npm run dev
```

Server akan berjalan di http://localhost:3000 dengan hot-reload (otomatis restart saat ada perubahan).

3. Build untuk Production:

```bash
npm run build
```

Perintah ini akan:

· Membersihkan folder dist/ (jika ada)
· Mengkompilasi semua file TypeScript (.ts) ke JavaScript (.js)
· Menyalin file statis (JSON, gambar, HTML) ke folder dist/
· Membuat struktur folder yang siap untuk deployment

4. Jalankan Production Server:

```bash
npm start
```

Server akan berjalan dari file JavaScript yang sudah dikompilasi di folder dist/.

---

📝 Scripts di package.json

```json
{
  "scripts": {
    "clean": "rm -rf dist",                     // Hapus folder dist
    "prebuild": "npm run clean",                // Otomatis jalan sebelum build
    "build": "tsc && npm run copy-assets",      // Kompilasi + salin assets
    "copy-assets": "mkdir -p dist/src dist/router && cp -r src/*.json src/*.jpg dist/src/ 2>/dev/null || true && cp -r public dist/ 2>/dev/null || true",
    "start": "node dist/index.js",              // Jalankan production
    "dev": "ts-node index.ts",                  // Development mode
    "dev:watch": "nodemon --exec ts-node index.ts" // Development dengan auto-reload
  }
}
```

---

⚡ Adding a New Router / Endpoint

Kamu tidak perlu membuat route manual di index.ts. Sistem akan otomatis membaca dari src/config.json dan meload file yang sesuai di folder router/.

Step 1: Edit src/config.json

Buka file src/config.json dan tambahkan metadata endpoint kamu di dalam object "tags". Pilih kategori yang sesuai (misal: games, ai, tools).

```json
{
  "tags": {
    // ... kategori lain ...
    "games": [ 
      {
        "name": "Tebak Gambar",          // Nama fitur di Docs
        "endpoint": "/api/games/tebak",  // URL Endpoint
        "filename": "tebak",             // Nama file logic (tanpa .ts)
        "method": "GET",                 // Method (GET/POST)
        "params": [                      // Parameter input (opsional)
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

Step 2: Buat File Logic

Berdasarkan contoh config di atas:

· Kategori: games
· Filename: tebak

Maka, kamu harus membuat folder games di dalam router/ (jika belum ada) dan buat file tebak.ts.

Example file: router/games/tebak.ts

```typescript
import { Request, Response } from 'express';

export default async function (req: Request, res: Response) {
    // Ambil parameter dari query (GET) atau body (POST)
    const { level } = req.query; 

    // Logic kamu di sini...
    
    if (!level) return res.json({ status: false, message: "Level required!" });

    res.json({
        status: true,
        result: {
            message: `Kamu memilih level ${level}`,
            image: "https://example.com/img.jpg"
        }
    });
};
```

Step 3: Build & Restart (Jika perlu)

Development mode: Otomatis reload (tidak perlu restart)
Production mode: Jalankan npm run build lalu npm start

Selesai! Endpoint baru akan otomatis muncul di halaman /docs.

---

🔧 Konfigurasi TypeScript

File tsconfig.json mengatur bagaimana TypeScript dikompilasi:

```json
{
  "compilerOptions": {
    "target": "ES2020",           // Versi JavaScript output
    "module": "commonjs",         // Format module (Node.js compatible)
    "outDir": "./dist",           // Output folder untuk file .js
    "rootDir": "./",              // Root folder untuk file .ts
    "strict": false,              // Mode strict (false untuk lebih fleksibel)
    "esModuleInterop": true,      // Kompatibilitas module
    "skipLibCheck": true          // Skip check library types
  }
}
```

---

🚀 Deployment

Vercel (Recommended)

1. Push ke GitHub
2. Import ke Vercel
3. Vercel akan otomatis detect vercel.json

Manual Deployment

```bash
# 1. Build project
npm run build

# 2. Upload folder dist/ ke server
scp -r dist/ user@server:/path/to/app

# 3. Install dependencies di server
npm install --production

# 4. Jalankan
npm start
```

PM2 (Production Process Manager)

```bash
# Install PM2 global
npm install -g pm2

# Jalankan dengan PM2
pm2 start dist/index.js --name "kuroneko-api"

# Simpan konfigurasi
pm2 save
pm2 startup
```

---

🖼️ Dokumentasi UI

Project ini dilengkapi dengan tampilan dokumentasi yang otomatis terupdate.

· Akses / untuk Landing Page
· Akses /docs untuk mencoba API
· Akses /donasi untuk support creator
· Akses /config untuk melihat konfigurasi API

---

🐛 Troubleshooting

Error: "Cannot find module './src/qris'"

```bash
# Pastikan sudah build
npm run build

# Cek apakah file ada
ls -la dist/src/qris.js
```

Error TypeScript Compilation

```bash
# Cek error
npx tsc --noEmit

# Nonaktifkan strict mode di tsconfig.json
# Ubah "strict": true menjadi "strict": false
```

QRIS Tidak Berfungsi

Pastikan STATIC_QRIS di src/qris.ts sudah diisi dengan string QRIS static yang valid.

---

📄 License

MIT License

---

<div align="center">
<b>Created by Danzz</b>
<br>
<i>Danzz | KuroNeko</i>
</div>
