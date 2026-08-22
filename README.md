# 🏛️ Sistem Informasi Kependudukan Desa Kedungsumur

Aplikasi modern untuk pengelolaan administrasi data penduduk desa dengan enkripsi data sensitif (AES-256-GCM), autentikasi berbasis sesi (Better Auth), penyimpanan berkas pasfoto berbasis Object Storage (MinIO S3), dan antarmuka web yang responsif (Next.js 16 + Tailwind CSS + Radix/Base UI).

---

## 📑 Daftar Isi
- [Fitur Utama](#-fitur-utama)
- [Arsitektur & Teknologi](#-arsitektur--teknologi)
- [Struktur Direktori](#-struktur-direktori)
- [Persyaratan Sistem](#-persyaratan-sistem)
- [Panduan Instalasi & Menjalankan Aplikasi](#-panduan-instalasi--menjalankan-aplikasi)
  - [1. Menjalankan Layanan Database & MinIO (Docker Compose)](#1-menjalankan-layanan-database--minio-docker-compose)
  - [2. Konfigurasi Environment Variable](#2-konfigurasi-environment-variable)
  - [3. Menjalankan Backend Server (Fastify)](#3-menjalankan-backend-server-fastify)
  - [4. Menjalankan Frontend Web (Next.js)](#4-menjalankan-frontend-web-nextjs)
- [Testing & Validasi API](#-testing--validasi-api)
- [Dokumentasi API](#-dokumentasi-api)

---

## ✨ Fitur Utama

1. **Keamanan Data Penduduk (Enkripsi & Hashing):**
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
- **Infrastruktur & Database:** PostgreSQL 16, MinIO S3 Object Storage, Docker & Docker Compose.

---

## 📁 Struktur Direktori

```text
kependudukan-kedungsumur/
├── docker-compose.yml          # Konfigurasi container PostgreSQL & MinIO
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
- **Docker & Docker Compose:** Versi terbaru
- **NPM:** Versi 10.x atau lebih baru

---

## 🚀 Panduan Instalasi & Menjalankan Aplikasi

### 1. Menjalankan Layanan Database & MinIO (Docker Compose)
Jalankan container PostgreSQL dan MinIO dari direktori root proyek:

```bash
docker compose up -d
```

Layanan yang akan aktif:
- **PostgreSQL:** `localhost:5432` (User: `admin`, Password: `admin123`, DB: `kependudukan-kedungsumur`)
- **MinIO API:** `http://localhost:9000` (Access Key: `admin`, Secret Key: `admin123`)
- **MinIO Console UI:** `http://localhost:9001` (Dashboard web untuk melihat bucket & file)

---

### 2. Konfigurasi Environment Variable

#### Backend (`server/.env`):
Salin `server/.env.example` ke `server/.env` dan pastikan nilainya sesuai:
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
Pastikan `web/.env` mengarah ke backend Fastify:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

### 3. Menjalankan Backend Server (Fastify)

1. Masuk ke folder server dan install dependensi:
   ```bash
   cd server
   npm install
   ```

2. Jalankan migrasi schema database Drizzle ke PostgreSQL:
   ```bash
   npx drizzle-kit push
   ```

3. Buat akun Administrator pertama:
   ```bash
   npm run create-admin
   ```

4. Jalankan server dalam mode development:
   ```bash
   npm run dev
   ```
   *Server berjalan di `http://localhost:4000`.*

---

### 4. Menjalankan Frontend Web (Next.js)

1. Buka terminal baru, masuk ke folder web dan install dependensi:
   ```bash
   cd web
   npm install
   ```

2. Jalankan Next.js dalam mode development:
   ```bash
   npm run dev
   ```
   *Buka browser di `http://localhost:3000`.*

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
