# Spesifikasi Desain: Pembuatan Kartu Keluarga Lengkap pada Form Tambah Penduduk

## 1. Konteks & Latar Belakang
Pada form **Tambah Penduduk** (`web/app/kependudukan/tambah/page.tsx`), ketika operator memilih opsi untuk tidak menggunakan KK yang sudah terdaftar, operator sebelumnya hanya memasukkan 16 digit Nomor KK. Pengguna menginginkan opsi ini diperluas menjadi pembuatan data Kartu Keluarga secara lengkap (Nomor KK, Alamat Domisili, RT, RW, Dusun, Kode Pos, dan Tanggal Dikeluarkan KK) seperti pada form **Tambah KK** (`web/app/kk/tambah/page.tsx`).

## 2. Tujuan Desain
- Mengubah mode kedua pada form Tambah Penduduk dari sekadar "Input No KK Manual" menjadi **"Buat Kartu Keluarga Baru"**.
- Menyediakan sub-form lengkap data Kartu Keluarga:
  1. Nomor Kartu Keluarga (16 Digit)
  2. Alamat Domisili Keluarga
  3. RT (3 Digit) & RW (3 Digit)
  4. Dusun (Opsional, default: "Dusun Krajan")
  5. Kode Pos (Opsional, default: "65171")
  6. Tanggal Dikeluarkan KK (Opsional, dengan popover kalender Bahasa Indonesia)
- Mengotomatiskan pengisian alamat penduduk dari data alamat KK yang diisikan, sehingga operator tidak perlu mengetik alamat dua kali.
- Menyediakan dukungan di backend (`POST /api/penduduk`) untuk menerima payload `createKk` sehingga pembuatan KK dan penduduk dilakukan secara atomik/transaksional dalam satu request.
- Jika status hubungan (SHDK) penduduk yang dibuat adalah "KEPALA KELUARGA", KK baru tersebut otomatis menetapkan `kepalaKeluargaId` ke penduduk baru yang dibuat.

## 3. Rincian Teknis & Arsitektur

### 3.1 Backend API (`server/src/routes/penduduk.routes.ts`)
Endpoint `POST /api/penduduk` diperluas:
- Request body dapat menyertakan properti opsional `createKk`:
  ```ts
  createKk?: {
    noKk: string;
    alamat: string;
    rt: string;
    rw: string;
    dusun?: string;
    kodePos?: string;
    tanggalDikeluarkan?: string;
  }
  ```
- Alur pemrosesan:
  1. Jika `createKk` ada:
     - Validasi keunikan `noKk` via `hashKependudukan(createKk.noKk)`. Jika sudah ada di `kartu_keluarga`, tolak dengan status 400 ("Nomor KK sudah terdaftar").
     - Buat baris baru di `kartu_keluarga`.
     - Gunakan ID KK baru tersebut sebagai `kartuKeluargaId` untuk penduduk yang akan dibuat.
  2. Simpan data penduduk ke `pendudukTable`.
  3. Jika `body.shdk === "KEPALA KELUARGA"` dan memiliki `kartuKeluargaId`, perbarui `kartuKeluargaTable.kepalaKeluargaId = createdPenduduk.id`.
  4. Seluruh operasi dibungkus dengan `db.transaction` (atau rollback aman) untuk mencegah data *orphan*.
  5. Jika `createKk` tidak ada, perilaku lama tetap berjalan normal (backward compatibility 100%).

### 3.2 Frontend (`web/app/kependudukan/tambah/page.tsx`)
- Form schema Zod diperbarui untuk mengakomodasi field KK baru saat `modeKk === "create"`:
  - `kkAlamat`, `kkRt`, `kkRw`, `kkDusun`, `kkKodePos`, `kkTanggalDikeluarkan`.
- Tombol mode KK diubah menjadi:
  - **"Pilih KK Terdaftar"** (`modeKk === "select"`)
  - **"Buat KK Baru Lengkap"** (`modeKk === "create"`)
- Sinkronisasi instan:
  - Ketika operator mengetik alamat, RT, dan RW di formulir KK baru, nilai tersebut otomatis mengisi field Alamat, RT, dan RW pada penduduk.
- Payload yang dikirim ke `POST /api/penduduk`:
  - Jika `modeKk === "create"`, sertakan objek `createKk`.
  - Jika `modeKk === "select"`, sertakan `noKk` dan `kartuKeluargaId`.

## 4. Rencana Pengujian & Verifikasi
1. **API Automated Tests**: Jalankan `npm --prefix server run test:api` untuk memastikan semua pengujian lama tetap passing.
2. **Frontend Build**: Jalankan `npm --prefix web run build` untuk memverifikasi kompatibilitas Next.js 16.
3. **End-to-End Verification**:
   - Buka form Tambah Penduduk.
   - Pilih mode "Buat KK Baru Lengkap".
   - Isi data KK (No KK baru, Alamat, RT 001, RW 002, Dusun, Tanggal terbit).
   - Isi data Penduduk (NIK, Nama, SHDK "KEPALA KELUARGA").
   - Simpan data dan verifikasi bahwa KK baru dan penduduk baru berhasil dibuat dan saling terhubung.
