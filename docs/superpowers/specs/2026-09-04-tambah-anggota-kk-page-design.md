# Spesifikasi Desain: Halaman Tambah Anggota Kartu Keluarga (`/kk/[id]/anggota/tambah`)

## 1. Konteks & Latar Belakang
Sebelumnya, penambahan anggota pada halaman detail Kartu Keluarga (`/kk/[id]`) dilakukan melalui popup/dialog modal sederhana yang hanya mengizinkan pemilihan penduduk yang sudah terdaftar. Pengguna menginginkan tombol "Tambah Anggota" membuka halaman mandiri (*dedicated page*) agar proses penginputan lebih lengkap, leluasa, dan terstruktur.

## 2. Tujuan Desain
- Membuat halaman baru **`/kk/[id]/anggota/tambah`** (atau `/kk/[id]/tambah-anggota`).
- Mengubah tombol "Tambah Anggota" di `/kk/[id]` untuk bernavigasi ke halaman tersebut (`router.push('/kk/${data.id}/anggota/tambah')`).
- Menyediakan dua mode fleksibel pada halaman baru:
  1. **Mode 1: Pilih Penduduk Terdaftar (Existing)**:
     - Pencarian cepat NIK 16 digit atau Nama Penduduk secara debounce.
     - Dropdown daftar penduduk yang belum masuk ke KK atau ingin dipindahkan ke KK ini.
     - Pengaturan SHDK (Suami, Istri, Anak, Cucu, Orang Tua, Mertua, Famili Lain, dll.).
     - Pengaturan nomor urut di KK.
  2. **Mode 2: Buat Penduduk Baru Langsung Masuk KK**:
     - Formulir data kependudukan lengkap (NIK 16 digit, Nama Lengkap, Tempat Lahir, Tanggal Lahir, Jenis Kelamin, Agama, Status Perkawinan, Pekerjaan, Foto Pasfoto).
     - Alamat, RT, RW, dan No KK otomatis dikunci (*read-only*) sesuai data Kartu Keluarga tujuan.
     - Pengaturan SHDK dan Nomor Urut di KK.
- Navigasi kembali yang aman (`router.push('/kk/${id}')`) setelah data berhasil disimpan atau saat membatalkan.

## 3. Rincian Teknis & Arsitektur

### 3.1 Routing Next.js
- File: `web/app/kk/[id]/anggota/tambah/page.tsx`
- Membaca param `id` dari route untuk memuat data ringkasan KK (No KK, Alamat, RT/RW, Dusun, dan total anggota).

### 3.2 Endpoint Backend yang Digunakan
1. **Mode 1 (Penduduk Existing)**:
   - `POST /api/kk/:id/anggota`
   - Payload: `{ pendudukId, shdk, urutanKk }`
2. **Mode 2 (Penduduk Baru)**:
   - `POST /api/penduduk`
   - Payload data penduduk lengkap dengan `kartuKeluargaId: id`, `noKk: targetKk.noKk`, `alamat: targetKk.alamat`, `rt: targetKk.rt`, `rw: targetKk.rw`, `shdk`, `urutanKk`.
   - Upload foto opsional ke `POST /api/penduduk/:id/foto`.

### 3.3 Validasi & UI Form
- Menggunakan skema Zod ketat dengan filter regex dan key blocker `blockNonNumericKeyDown` dari `web/lib/validation.ts`.
- Format tanggal Indonesia (`formatDateId`) dan popover kalender Indonesia.
- Tombol aksi: Batal (kembali ke `/kk/[id]`) dan Simpan Anggota Keluarga.

## 4. Rencana Pengujian
1. Buka halaman detail KK di `/kk/[id]`.
2. Klik tombol "Tambah Anggota", pastikan berpindah ke halaman `/kk/[id]/anggota/tambah`.
3. Uji Mode 1: Cari dan tambahkan penduduk yang sudah ada, cek apakah berhasil diarahkan kembali ke detail KK dan anggota bertambah.
4. Uji Mode 2: Daftarkan penduduk baru dari form tersebut, cek apakah penduduk baru otomatis masuk dan terhubung ke KK tersebut.
5. Jalankan `npm --prefix web run build` untuk memverifikasi build Next.js.
