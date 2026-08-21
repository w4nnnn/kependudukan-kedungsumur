# Dokumentasi API Kependudukan (CRUD)

Dokumen ini menjelaskan *endpoint* (titik akhir) untuk mengelola data Penduduk Desa Kedungsumur. 
Semua *endpoint* di bawah ini **terproteksi**. Anda **wajib login** terlebih dahulu (memiliki *session cookie* aktif dari Better Auth) untuk dapat mengakses rute-rute ini.

> **Base URL:** `http://localhost:4000` (atau sesuai konfigurasi `PORT`/`BETTER_AUTH_URL` pada server)

---

## 1. Menampilkan & Mencari Data Penduduk (Paginasi)
Mengambil daftar penduduk dari database. Mendukung fitur pencarian dinamis dan paginasi untuk mencegah kelebihan beban server.

*   **URL:** `/api/penduduk`
*   **Method:** `GET`
*   **Query Parameters (Opsional):**
    *   `search` (string): Mencari berdasarkan nama (menggunakan `ILIKE` / abaikan huruf besar-kecil).
    *   `nik` (string): Mencari spesifik berdasarkan NIK. Pencarian NIK harus *exact match* (tepat 16 digit).
    *   `nokk` (string): Mencari spesifik berdasarkan No KK.
    *   `page` (number): Halaman data (default: `1`).
    *   `limit` (number): Jumlah data per halaman (default: `100`).

**Contoh Penggunaan URL:**
*   `/api/penduduk?page=1&limit=50` (Tampilkan 50 orang pertama)
*   `/api/penduduk?search=budi` (Cari orang bernama budi)
*   `/api/penduduk?nik=3573010000000001` (Cari spesifik dari NIK)

**Response Sukses (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "e4a2f8b1-3c9d-4e2b-8a5f-7c1e3d2a1b0c",
      "nik": "3573010000000001", // Otomatis didekripsi oleh server
      "noKk": "3573011111111111",
      "namaLengkap": "Budi Santoso",
      "tempatLahir": "Malang",
      "tanggalLahir": "1990-05-15",
      "jenisKelamin": "Laki-laki",
      "alamat": "Jl. Raya Kedungsumur No. 1",
      "rt": "001",
      "rw": "002",
      "agama": "Islam",
      "statusPerkawinan": "Kawin",
      "pekerjaan": "PNS"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 100,
    "totalPages": 2
  }
}
```

---

## 2. Menampilkan Data Satu Penduduk (Berdasarkan ID)
Mengambil detail informasi satu orang penduduk spesifik menggunakan UUID mereka.

*   **URL:** `/api/penduduk/:id`
*   **Method:** `GET`
*   **URL Params:** `id` (UUID dari penduduk)

**Response Sukses (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "e4a2f8b1-3c9d...",
    "nik": "3573010000000001",
    "namaLengkap": "Budi Santoso"
  }
}
```

---

## 3. Menambahkan Data Penduduk Baru (Insert)
Digunakan oleh Admin untuk mendaftarkan penduduk baru ke dalam sistem. 
> **Keamanan:** NIK dan No KK yang dikirimkan (*plain text*) akan **otomatis dienkripsi** dengan AES-256 dan di-hash (Blind Indexing) sebelum disimpan ke database oleh Drizzle ORM.

*   **URL:** `/api/penduduk`
*   **Method:** `POST`
*   **Headers:** `Content-Type: application/json`

**Body Request (JSON):**
```json
{
  "nik": "3573010000000001",
  "noKk": "3573011111111111",
  "namaLengkap": "Budi Santoso",
  "tempatLahir": "Malang",
  "tanggalLahir": "1990-05-15",
  "jenisKelamin": "Laki-laki",
  "alamat": "Jl. Raya Kedungsumur No. 1",
  "rt": "001",
  "rw": "002",
  "agama": "Islam",
  "statusPerkawinan": "Kawin",
  "pekerjaan": "PNS"
}
```

**Response Sukses (201 Created):**
```json
{
  "success": true,
  "message": "Data penduduk berhasil ditambahkan.",
  "data": {
    "id": "baru-uuid-1234...",
    "namaLengkap": "Budi Santoso"
  }
}
```

**Response Gagal (400 Bad Request - NIK Ganda):**
```json
{
  "success": false,
  "message": "NIK sudah terdaftar."
}
```

---

## 4. Mengubah Data Penduduk (Update)
Digunakan untuk memperbarui data penduduk yang sudah ada (misalnya: pindah RT/RW, perubahan status perkawinan). Anda bisa mengirimkan sebagian data (*Partial*) saja. Jika Anda mengirim NIK baru, sistem akan otomatis mengenkripsi dan menghash ulang.

*   **URL:** `/api/penduduk/:id`
*   **Method:** `PUT`
*   **URL Params:** `id` (UUID penduduk yang akan diubah)
*   **Headers:** `Content-Type: application/json`

**Body Request (Contoh Partial Update):**
```json
{
  "statusPerkawinan": "Cerai Hidup",
  "pekerjaan": "Wiraswasta"
}
```

**Response Sukses (200 OK):**
```json
{
  "success": true,
  "message": "Data penduduk berhasil diperbarui.",
  "data": {
    "id": "e4a2f8b1-3c9d...",
    "statusPerkawinan": "Cerai Hidup"
  }
}
```

---

## 5. Menghapus Data Penduduk (Delete)
Digunakan untuk menghapus data penduduk secara permanen dari database.

*   **URL:** `/api/penduduk/:id`
*   **Method:** `DELETE`
*   **URL Params:** `id` (UUID penduduk yang akan dihapus)

**Response Sukses (200 OK):**
```json
{
  "success": true,
  "message": "Data penduduk berhasil dihapus."
}
```