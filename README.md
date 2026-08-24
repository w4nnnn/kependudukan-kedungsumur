# 🏛️ Sistem Informasi Kependudukan Desa Kedungsumur

Aplikasi modern untuk pengelolaan administrasi data penduduk desa dengan enkripsi data sensitif (AES-256-GCM), autentikasi berbasis sesi (Better Auth), penyimpanan berkas pasfoto berbasis Object Storage (MinIO S3), dan antarmuka web yang responsif (Next.js 16 + Tailwind CSS + Radix/Base UI).

---

## 📑 Daftar Isi
- [Fitur Utama](#-fitur-utama)
- [Arsitektur & Teknologi](#-arsitektur--teknologi)
- [Struktur Direktori](#-struktur-direktori)
- [Persyaratan Sistem](#-persyaratan-sistem)
- [Panduan Instalasi & Menjalankan Aplikasi](#-panduan-instalasi--menjalankan-aplikasi)
  - [1. Konfigurasi Environment Variables](#1-konfigurasi-environment-variables)
  - [2. Setup & Menjalankan Backend Server](#2-setup--menjalankan-backend-server)
  - [3. Setup & Menjalankan Frontend Web](#3-setup--menjalankan-frontend-web)
- [Menjalankan Production dengan PM2](#-menjalankan-production-dengan-pm2)
- [Testing & Validasi API](#-testing--validasi-api)
- [Dokumentasi API](#-dokumentasi-api)

---

## ✨ Fitur Utama

1. **Keamanan Data Penduduk (Enkripsi & Blind Indexing):**
   - NIK dan Nomor KK dienkripsi secara simetris menggunakan **AES-256-GCM** sebelum disimpan di database PostgreSQL.
   - Menggunakan teknik **Blind Indexing (HMAC/SHA-256 dengan Salt)** untuk pencarian presisi NIK & KK tanpa membuka dekripsi seluruh tabel.
2. **Manajemen Pasfoto Penduduk (MinIO Object Storage):**
   - Upload, preview, dan hapus pasfoto penduduk (JPG, PNG, WebP hingga 5MB).
   - Sinkronisasi otomatis: penghapusan data penduduk atau penggantian foto secara otomatis membersihkan file objek di MinIO bucket.
3. **Manajemen Pengguna & Hak Akses:**
   - Autentikasi aman berbasis sesi Better Auth.
   - Manajemen akun admin/operator desa (tambah pengguna, ubah password, ban/unban, role permission).
4. **Data Kependudukan (CRUD):**
   - Pencarian cepat nama lengkap dan NIK.
   - Paginasi data dinamis.
   - Halaman detail penduduk yang rapi dan kartu identitas lengkap.

---

## 🛠️ Arsitektur & Teknologi

- **Backend:** Node.js, Fastify v5, TypeScript, Drizzle ORM, Better Auth, MinIO Node SDK, `@fastify/multipart`.
- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Radix UI & Base UI, React Hook Form + Zod, Sonner Toast, Lucide Icons.
- **Database & Storage:** PostgreSQL 16, MinIO S3 Object Storage.
- **Process Manager:** PM2 (`ecosystem.config.cjs`).

---

## 📁 Struktur Direktori

```text
kependudukan-kedungsumur/
├── ecosystem.config.cjs        # Konfigurasi PM2 Process Manager
├── docs/                       # Dokumentasi API & Spesifikasi Desain
│   ├── api/
│   │   ├── auth.md             # Dokumentasi API Autentikasi
│   │   └── penduduk.md         # Dokumentasi API Penduduk & Foto
│   └── superpowers/            # Design specs & implementation plans
├── server/                     # Backend Fastify API
│   ├── drizzle/                # SQL Migration files Drizzle
│   ├── src/
│   │   ├── db/                 # Koneksi DB & Skema Tabel (schema.ts, auth-schema.ts)
│   │   ├── lib/                # Layanan MinIO & Better Auth
│   │   ├── middlewares/        # Proteksi auth middleware
│   │   ├── routes/             # Rute API (penduduk.routes.ts, auth.routes.ts)
│   │   └── index.ts            # Entry point Fastify Server
│   └── scripts/                # Scripts test-api, create-admin, seed data
└── web/                        # Frontend Next.js Application
    ├── app/                    # Next.js App Router (kependudukan, pengguna, login)
    ├── components/             # Komponen UI & Layout Sidebar
    └── lib/                    # Auth client & utility functions
```

---

## 📋 Persyaratan Sistem

- **Node.js:** Versi 20.x atau lebih baru
- **PostgreSQL Database:** Berjalan di port 5432
- **MinIO Storage Server:** Berjalan di port 9000 (API) dan 9001 (Console)
- **PM2:** `npm install -g pm2` (untuk deployment production)

---

## 🚀 Panduan Instalasi & Menjalankan Aplikasi

### 1. Konfigurasi Environment Variables

#### Backend (`server/.env`):
Salin `server/.env.example` ke `server/.env` dan sesuaikan nilainya:
```env
PORT=4000
DATABASE_URL=postgres://admin:admin123@localhost:5432/kependudukan-kedungsumur
BETTER_AUTH_SECRET=rahasia-kunci-auth-minimal-32-karakter
BETTER_AUTH_URL=http://localhost:4000
FRONTEND_URL=http://localhost:3000

ENCRYPTION_SECRET_KEY=kunci-enkripsi-aes-256-minimal-32-karakter
HASH_SALT=garam_hashing_desa_kedungsumur_123

MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=admin123
MINIO_BUCKET_NAME=kependudukan-kedungsumur
MINIO_PUBLIC_URL=http://localhost:9000/kependudukan-kedungsumur

TEST_ADMIN_USERNAME=admin
TEST_ADMIN_PASSWORD=sandi_rahasia_123
```

#### Frontend (`web/.env`):
Pastikan `web/.env` mengarah ke backend API:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

### 2. Setup & Menjalankan Backend Server

1. Masuk ke folder server dan install dependensi:
   ```bash
   cd server
   npm install
   ```

2. Jalankan sinkronisasi / migrasi skema database Drizzle:
   ```bash
   npx drizzle-kit push
   ```

3. Buat akun Administrator:
   ```bash
   npm run create-admin
   ```

4. Jalankan server dalam mode development:
   ```bash
   npm run dev
   ```
   *Server berjalan di `http://localhost:4000`.*

---

### 3. Setup & Menjalankan Frontend Web

1. Masuk ke folder web dan install dependensi:
   ```bash
   cd web
   npm install
   ```

2. Jalankan Next.js dalam mode development:
   ```bash
   npm run dev
   ```
   *Aplikasi web dapat diakses di `http://localhost:3000`.*

---

## ⚡ Menjalankan Production dengan PM2

Untuk menjalankan seluruh layanan (Backend Fastify & Frontend Next.js) secara bersamaan di server production menggunakan PM2:

1. **Build kedua aplikasi terlebih dahulu:**
   ```bash
   npm --prefix server run build
   npm --prefix web run build
   ```

2. **Jalankan dengan PM2 Ecosystem:**
   ```bash
   pm2 start ecosystem.config.cjs
   ```

3. **Perintah PM2 yang berguna:**
   - Melihat status aplikasi: `pm2 status`
   - Melihat realtime logs: `pm2 logs`
   - Restart seluruh aplikasi: `pm2 restart all`
   - Berhenti: `pm2 stop all`

---

## 🧪 Testing & Validasi API

Untuk menjalankan automated contract & response test suite backend:

```bash
cd server
npm run test:api
```

Test suite menguji secara otomatis:
- Proteksi rute & middleware otentikasi.
- Flow Login & Logout Better Auth.
- CRUD data kependudukan (Enkripsi/Dekripsi NIK & KK, validasi NIK duplikat).
- Upload foto penduduk ke MinIO, verifikasi URL gambar, dan penghapusan foto.

---

## 📖 Dokumentasi API

Dokumentasi lengkap mengenai endpoint API dapat dibaca pada folder `docs/`:
- [Dokumentasi API Autentikasi (`docs/api/auth.md`)](docs/api/auth.md)
- [Dokumentasi API Kependudukan & MinIO (`docs/api/penduduk.md`)](docs/api/penduduk.md)
- [Dokumentasi API Kartu Keluarga (`docs/api/kk.md`)](docs/api/kk.md)
- [Dokumentasi API Export & Import Excel (`docs/api/export-import.md`)](docs/api/export-import.md)
