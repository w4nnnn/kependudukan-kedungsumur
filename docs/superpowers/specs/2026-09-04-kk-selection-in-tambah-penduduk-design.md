# Spesifikasi Desain: Pemilihan Kartu Keluarga pada Form Tambah Penduduk

## 1. Konteks & Latar Belakang
Pada form **Tambah Penduduk** (`web/app/kependudukan/tambah/page.tsx`), field Nomor Kartu Keluarga (KK) saat ini hanya berupa input teks manual. Pengguna menginginkan alur yang mirip dengan form **Tambah KK** (`web/app/kk/tambah/page.tsx`), di mana pengguna dapat memilih data yang sudah ada di database melalui pencarian interaktif atau mengisi nomor KK secara mandiri jika diperlukan.

## 2. Tujuan Desain
- Menyediakan 2 mode pengisian Kartu Keluarga pada form Tambah Penduduk:
  1. **Pilih Kartu Keluarga Terdaftar** (Default):
     - Input pencarian interaktif (bisa mencari berdasarkan Nomor KK 16 digit atau Nama Kepala Keluarga).
     - Menampilkan daftar KK hasil pencarian (No KK, Nama Kepala Keluarga, RT/RW, Dusun).
     - Ketika suatu KK dipilih, form otomatis mengisi nilai `noKk` dan juga meng-autofill field domisili (`alamat`, `rt`, `rw`) agar operator tidak perlu mengetik ulang.
  2. **Input Nomor KK Manual**:
     - Membuka input teks 16 digit Nomor KK secara manual jika keluarga belum terdaftar di sistem.
- Menjaga tampilan UI tetap konsisten dengan kartu pilihan mode di `web/app/kk/tambah/page.tsx` (menggunakan tombol berikon dan border active styling).

## 3. Rincian Teknis & Arsitektur

### 3.1 State & Komponen
- Menambahkan state `modeKk: "select" | "manual"` (default: `"select"`).
- State pencarian: `kkSearch: string`, `kkList: CandidateKK[]`, `selectedKkId: string`.
- Interface `CandidateKK`:
  ```ts
  interface CandidateKK {
    id: string
    noKk: string
    kepalaKeluargaNama: string | null
    alamat: string
    rt: string
    rw: string
    dusun?: string | null
  }
  ```
- Menggunakan endpoint `GET /api/kk?limit=10&search=...` (atau `nokk=...` jika 16 digit angka) untuk mengambil daftar kandidat KK secara debounce.

### 3.2 Interaksi & Autofill
- Saat pengguna memilih sebuah KK dari dropdown list:
  1. `setValue("noKk", kk.noKk)`
  2. Jika field `alamat` masih kosong atau diupdate: `setValue("alamat", kk.alamat)`
  3. `setValue("rt", kk.rt)`
  4. `setValue("rw", kk.rw)`
  5. Menampilkan badge/kartu ringkasan bahwa penduduk ini akan terhubung ke KK terpilih.

### 3.3 Validasi Form (Zod)
- Skema tetap mewajibkan `noKk: z.string().length(16, "No KK harus tepat 16 digit")`.
- Baik dari mode `select` maupun `manual`, `noKk` akan terisi 16 digit valid sebelum submit.

## 4. Rencana Pengujian
1. Buka form Tambah Penduduk.
2. Cek apakah kartu pilihan mode (Pilih KK Terdaftar vs Input Manual) muncul rapi.
3. Coba cari KK berdasarkan nomor atau nama kepala keluarga, pilih salah satu, pastikan No KK, Alamat, RT, dan RW terisi otomatis.
4. Ganti ke mode Input Manual, pastikan bisa mengetik No KK 16 digit secara bebas.
5. Jalankan `npm --prefix web run build` untuk memverifikasi tidak ada error sintaks atau tipe data.
