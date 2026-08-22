# Design Spec: Integrasi Foto Penduduk pada Frontend Web

- **Tanggal:** 2026-08-22
- **Target:** `web/` (Next.js App Router)
- **Modul:** Data Kependudukan (`web/app/kependudukan/`)

---

## 1. Ringkasan
Menambahkan integrasi visual dan manajemen foto/gambar penduduk pada antarmuka pengguna (Frontend Next.js):
- Menampilkan thumbnail/avatar foto penduduk pada tabel daftar kependudukan (`/kependudukan`).
- Menampilkan pasfoto ukuran besar pada halaman detail penduduk (`/kependudukan/[id]`).
- Menyediakan input upload foto dengan pratinjau (*preview*) pada formulir tambah penduduk (`/kependudukan/tambah`).
- Menyediakan manajemen foto (ganti foto dan hapus foto) pada formulir edit penduduk (`/kependudukan/edit/[id]`).

---

## 2. Antarmuka Komponen & Tipe Data

### 2.1 Update Interface `Penduduk`
Perbarui tipe/interface `Penduduk` di setiap halaman terkait:
```typescript
interface Penduduk {
  id: string
  nik: string
  noKk: string
  namaLengkap: string
  tempatLahir: string
  tanggalLahir: string
  jenisKelamin: string
  alamat: string
  rt: string
  rw: string
  agama: string
  statusPerkawinan: string
  pekerjaan: string
  foto?: string | null
  fotoUrl?: string | null
}
```

---

## 3. Detail Perubahan Halaman

### 3.1 Daftar Penduduk (`web/app/kependudukan/page.tsx`)
- Menggunakan komponen `Avatar`, `AvatarImage`, dan `AvatarFallback` dari `@/components/ui/avatar`.
- Pada kolom Nama Lengkap:
  - Tampilkan avatar lingkaran ukuran `sm` / `default` (32px) dengan gambar dari `penduduk.fotoUrl`.
  - Jika tidak ada foto (`fotoUrl` kosong/null), tampilkan inisial 2 huruf dari nama lengkap sebagai fallback (misal: "Budi Santoso" -> "BS").
  - Susun avatar dan nama lengkap berdampingan (`flex items-center gap-3`).

### 3.2 Detail Penduduk (`web/app/kependudukan/[id]/page.tsx`)
- Pada Card "Identitas Utama":
  - Tampilkan foto penduduk dalam ukuran besar (ukuran `size-24` atau `size-28`, rasio 1:1 atau pasfoto dengan `rounded-xl` / avatar).
  - Tampilkan fallback ikon atau inisial jika foto belum diunggah.
  - Berikan tata letak yang rapi dan elegan bersanding dengan informasi NIK, No KK, dan Nama Lengkap.

### 3.3 Tambah Penduduk (`web/app/kependudukan/tambah/page.tsx`)
- Menambahkan area input file foto (mendukung klik atau drag-and-drop sederhana) dengan pratinjau gambar (*client-side preview* via `URL.createObjectURL`).
- Batasan file di sisi klien: Tipe gambar (`image/jpeg`, `image/png`, `image/webp`) dan ukuran maksimum 5MB.
- Tombol reset/batal pilihan foto jika pengguna salah memilih berkas.
- **Alur Penyimpanan:**
  1. Kirim data form teks ke `POST /api/penduduk`.
  2. Jika berhasil dan terdapat file foto yang dipilih, kirim file via `multipart/form-data` ke `POST /api/penduduk/${newId}/foto`.
  3. Tampilkan toast sukses dan arahkan pengguna kembali ke `/kependudukan`.

### 3.4 Edit Penduduk (`web/app/kependudukan/edit/[id]/page.tsx`)
- Menampilkan foto saat ini (dari `data.fotoUrl`).
- Menyediakan tombol / file input untuk mengganti foto penduduk.
- Menyediakan tombol hapus foto jika penduduk sudah memiliki foto (`DELETE /api/penduduk/${id}/foto`).
- Pembaruan foto dapat langsung dieksekusi atau terintegrasi saat form disimpan.

---

## 4. Penanganan Error & UX
- Validasi ukuran file > 5MB menampilkan toast peringatan "Ukuran file terlalu besar (maksimal 5MB)".
- Validasi format file non-gambar menampilkan toast peringatan "Format file harus berupa gambar (JPG, PNG, atau WebP)".
- Loading state indikator spinner saat proses upload file berlangsung.
