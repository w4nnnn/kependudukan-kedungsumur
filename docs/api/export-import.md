# 📊 Dokumentasi API Export & Import Data Excel

Dokumentasi lengkap endpoint ekspor, impor, dan template berkas Microsoft Excel (`.xlsx`) di Sistem Informasi Kependudukan Desa Kedungsumur.

Seluruh endpoint di bawah ini memerlukan proteksi autentikasi (Sesi aktif Better Auth via Cookie atau Header `Authorization: Bearer <token>`).

---

## 1. Unduh Template Excel Resmi

Digunakan oleh aparat desa untuk mendapatkan format berkas Excel yang valid sebelum melakukan pengunggahan data secara massal.

- **URL:** `/api/penduduk/template`
- **Method:** `GET`
- **Response Header:**
  - `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - `Content-Disposition: attachment; filename="template_penduduk_kedungsumur.xlsx"`
- **Karakteristik Template:**
  - Header kolom tebal dengan warna hijau desa.
  - Kolom NIK dan Nomor KK terformat sebagai **Text (`@`)** agar tidak terpotong atau menjadi notasi ilmiah.
  - Memuat 2 baris contoh data valid (Kepala Keluarga & Istri).

---

## 2. Ekspor Data Penduduk ke Excel

Mengekspor data seluruh penduduk desa atau terfilter berdasarkan wilayah RT/RW ke format file `.xlsx`.

- **URL:** `/api/penduduk/export`
- **Method:** `GET`
- **Query Parameters (Opsional):**
  - `rt`: Filter nomor RT (contoh: `001`).
  - `rw`: Filter nomor RW (contoh: `002`).
- **Response Header:**
  - `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - `Content-Disposition: attachment; filename="data_penduduk_kedungsumur.xlsx"`
- **Kolom Data:**
  - `No`, `NIK`, `No. KK`, `Nama Lengkap`, `Jenis Kelamin`, `Tempat Lahir`, `Tanggal Lahir`, `Alamat`, `RT`, `RW`, `Agama`, `Status Pernikahan`, `SHDK`, `Pekerjaan`.

---

## 3. Ekspor Data Kartu Keluarga ke Excel

Mengekspor rekapitulasi data Kartu Keluarga beserta informasi Kepala Keluarga dan total jiwa per KK.

- **URL:** `/api/kk/export`
- **Method:** `GET`
- **Query Parameters (Opsional):**
  - `rt`: Filter nomor RT.
  - `rw`: Filter nomor RW.
- **Response Header:**
  - `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - `Content-Disposition: attachment; filename="data_kartu_keluarga_kedungsumur.xlsx"`
- **Kolom Data:**
  - `No`, `Nomor KK`, `Nama Kepala Keluarga`, `NIK Kepala Keluarga`, `Alamat`, `RT`, `RW`, `Dusun`, `Jumlah Anggota`.

---

## 4. Impor Massal Data Penduduk dari Excel (Bulk Upload)

Mengunggah berkas Excel (`.xlsx`) untuk dianalisis, divalidasi, dienkripsi (AES-256-GCM + Blind Index), dan disimpan ke dalam database.

- **URL:** `/api/penduduk/import`
- **Method:** `POST`
- **Content-Type:** `multipart/form-data`
- **Form Data:**
  - `file`: Berkas spreadsheet `.xlsx`
- **Fitur Otomatisasi:**
  - **Auto-create KK**: Jika `No KK` belum terdaftar di tabel master `kartu_keluarga`, sistem otomatis membuat entitas KK baru.
  - **Auto-link Kepala Keluarga**: Anggota dengan `SHDK = KEPALA KELUARGA` otomatis dihubungkan sebagai `kepalaKeluargaId`.
  - **Skip Duplikasi NIK**: Jika NIK sudah terdaftar di database, baris tersebut dilewati secara aman tanpa menghentikan import baris lainnya.
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Proses import selesai. Berhasil menambahkan 45 data, 2 data dilewati (NIK sudah ada).",
    "data": {
      "totalDiproses": 47,
      "berhasil": 45,
      "dilewati": 2,
      "errors": []
    }
  }
  ```
- **Error Response (400 Bad Request):**
  ```json
  {
    "success": false,
    "message": "Tidak ada data valid yang dapat diproses dari file Excel.",
    "errors": [
      "Baris 4: NIK '3573' harus berupa 16 digit angka."
    ]
  }
  ```
