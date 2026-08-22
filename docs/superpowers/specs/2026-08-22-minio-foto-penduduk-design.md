# Design Spec: Fitur Foto Penduduk dengan MinIO Storage

- **Tanggal:** 2026-08-22
- **Target:** `server/` (Fastify + Drizzle ORM + PostgreSQL)
- **Modul:** Penyimpanan & Pengelolaan Foto Penduduk (`/api/penduduk/:id/foto`)

---

## 1. Ringkasan
Menambahkan dukungan penyimpanan dan pengelolaan file foto/gambar penduduk pada sistem kependudukan desa menggunakan **MinIO (S3-compatible Object Storage)**. Fitur ini memungkinkan pengunggahan pasfoto penduduk, pembaruan foto dengan pembersihan file lama otomatis, penghapusan foto, dan penghapusan berkas foto saat data penduduk dihapus dari database.

---

## 2. Skema Database (`server/src/db/schema/schema.ts`)
Menambahkan kolom `foto` pada `pendudukTable` untuk menyimpan key/nama objek file di MinIO (atau URL relatif/lengkap).

```typescript
export const pendudukTable = pgTable(
  "penduduk",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    nik: encryptedVarchar("nik").notNull(),
    nikHash: varchar("nik_hash", { length: 64 }).notNull().unique(),
    noKk: encryptedVarchar("no_kk").notNull(),
    noKkHash: varchar("no_kk_hash", { length: 64 }).notNull(),
    namaLengkap: varchar("nama_lengkap", { length: 255 }).notNull(),
    tempatLahir: varchar("tempat_lahir", { length: 100 }).notNull(),
    tanggalLahir: date("tanggal_lahir").notNull(),
    jenisKelamin: varchar("jenis_kelamin", { length: 20 }).notNull(),
    alamat: varchar("alamat", { length: 255 }).notNull(),
    rt: varchar("rt", { length: 5 }).notNull(),
    rw: varchar("rw", { length: 5 }).notNull(),
    agama: varchar("agama", { length: 50 }).notNull(),
    statusPerkawinan: varchar("status_perkawinan", { length: 50 }).notNull(),
    pekerjaan: varchar("pekerjaan", { length: 100 }),
    
    // Field baru:
    foto: varchar("foto", { length: 500 }), // Menyimpan key objek MinIO (misal: "penduduk/<id>-<timestamp>.<ext>")
  },
  // ... indeks
);
```

---

## 3. Konfigurasi Lingkungan (`.env` & `.env.example`)
Variabel konfigurasi MinIO:
```env
# ==============================================================================
# KONFIGURASI MINIO / OBJECT STORAGE
# ==============================================================================
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=kependudukan
MINIO_PUBLIC_URL=http://localhost:9000/kependudukan
```

---

## 4. Dependensi Baru (`server/package.json`)
- `minio`: Client SDK resmi untuk integrasi MinIO S3 API.
- `@fastify/multipart`: Plugin Fastify untuk menangani parsing file upload `multipart/form-data`.
- `@types/minio` (jika diperlukan untuk devDependencies).

---

## 5. Modul Layanan MinIO (`server/src/lib/minio.ts`)
Bertanggung jawab atas komunikasi dengan server MinIO:
1. **Inisialisasi Client:** Membuat instans `Minio.Client` dengan konfigurasi dari `.env`.
2. **Auto-init Bucket:** Memeriksa keberadaan bucket `kependudukan` saat server mulai, membuatnya jika belum ada, dan mengatur bucket policy (misal: read-only public untuk akses URL langsung atau download policy).
3. **Helper Functions:**
   - `uploadFotoPenduduk(pendudukId: string, fileBuffer: Buffer, mimeType: string, originalExt: string): Promise<string>`
     - Format key objek: `penduduk/${pendudukId}-${Date.now()}.${ext}`.
     - Menyimpan file ke bucket MinIO dengan `putObject`.
     - Mengembalikan nama objek/key yang tersimpan.
   - `deleteFotoPenduduk(objectKey: string): Promise<void>`
     - Menghapus objek dari MinIO dengan `removeObject`.
   - `getPublicFotoUrl(objectKey: string | null): string | null`
     - Menghasilkan URL publik untuk foto jika dikonfigurasi, atau endpoint proxy.

---

## 6. Integrasi & Registrasi Server (`server/src/index.ts`)
- Mendaftarkan plugin `@fastify/multipart` dengan batasan ukuran file (misal: `fileSize: 5 * 1024 * 1024` = 5MB).
- Memanggil fungsi inisialisasi bucket MinIO saat server startup.

---

## 7. Endpoint API Kependudukan (`server/src/routes/penduduk.routes.ts`)

### 7.1 Upload / Update Foto Penduduk
- **Method:** `POST` / `PUT` `/api/penduduk/:id/foto`
- **Auth:** Wajib (`requireAuth`)
- **Body:** `multipart/form-data` dengan field `foto` atau `file`
- **Validasi:**
  - Cek apakah data penduduk dengan `:id` ada.
  - Tipe file harus gambar (`image/jpeg`, `image/png`, `image/webp`).
  - Ukuran file maksimal 5MB.
- **Alur Eksekusi:**
  1. Ambil data penduduk eksisting.
  2. Jika penduduk sudah memiliki foto lama (`data.foto`), panggil `deleteFotoPenduduk(data.foto)` untuk menghapus file lama dari MinIO.
  3. Upload buffer foto baru ke MinIO dan dapatkan key objek baru.
  4. Update field `foto` pada baris penduduk di database.
  5. Kembalikan response JSON sukses berisi data penduduk yang telah diperbarui beserta URL foto.

### 7.2 Hapus Foto Penduduk
- **Method:** `DELETE` `/api/penduduk/:id/foto`
- **Auth:** Wajib (`requireAuth`)
- **Alur Eksekusi:**
  1. Cek apakah data penduduk ada.
  2. Jika ada `data.foto`, hapus objek dari MinIO.
  3. Update field `foto` menjadi `null` di database.
  4. Kembalikan response sukses.

### 7.3 Hapus Data Penduduk (`DELETE /api/penduduk/:id`)
- **Modifikasi alur eksisting:**
  - Sebelum atau sesudah record penduduk dihapus dari database, periksa apakah memiliki `foto`.
  - Jika ada, hapus file fotonya dari MinIO agar tidak meninggalkan orphan objects di storage.

---

## 8. Penanganan Error & Keamanan
- Proteksi seluruh endpoint menggunakan middleware `requireAuth`.
- Validasi mimetype secara ketat untuk mencegah upload file non-gambar (misal file executable/script).
- Sanitasi nama file dan penamaan otomatis berbasis UUID + timestamp agar terhindar dari path traversal dan konflik nama.
- Penanganan jika MinIO offline / down: response status 503/500 dengan pesan error yang jelas tanpa memutus koneksi aplikasi.
