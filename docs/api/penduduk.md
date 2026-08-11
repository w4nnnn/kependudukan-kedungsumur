# Dokumentasi API Kependudukan (CRUD)

Dokumen ini menjelaskan *endpoint* (titik akhir) untuk mengelola data Penduduk Desa Kedungsumur. 
Semua *endpoint* di bawah ini **terproteksi**. Anda **wajib login** terlebih dahulu (memiliki *session cookie* aktif dari Better Auth) untuk dapat mengakses rute-rute ini.

> **Base URL:** `http://localhost:3000`

---

## 1. Menampilkan Semua Data Penduduk
Mengambil daftar seluruh penduduk yang ada di database.
*(Perhatian: Pada aplikasi produksi berskala besar, pastikan untuk mengimplementasikan paginasi di masa depan).*

*   **URL:** `/api/penduduk`
*   **Method:** `GET`

**Response Sukses (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "e4a2f8b1-3c9d...",
      "nik": "3573010000000001", // Otomatis didekripsi dari database
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
    },
    // ... data lainnya
  ]
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
    "namaLengkap": "Budi Santoso",
    // ... data lainnya
  }
}
```

**Response Gagal (404 Not Found):**
```json
{
  "success": false,
  "message": "Data penduduk tidak ditemukan."
}
```

---

## 3. Menambahkan Data Penduduk Baru (Insert)
Digunakan oleh Admin untuk mendaftarkan penduduk baru ke dalam sistem. Data NIK dan KK yang dikirimkan (*plain text*) akan **otomatis dienkripsi** sebelum disimpan ke database oleh Drizzle ORM.

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
    "nik": "3573010000000001",
    "namaLengkap": "Budi Santoso"
    // ...
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
Digunakan untuk memperbarui data penduduk yang sudah ada (misalnya: pindah RT/RW, perubahan status perkawinan). Anda bisa mengirimkan sebagian data (*Partial*) saja, tidak harus seluruhnya.

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
    "statusPerkawinan": "Cerai Hidup",
    // ... sisa data lengkap akan dikembalikan
  }
}
```

---

## 5. Menghapus Data Penduduk (Delete)
Digunakan untuk menghapus data penduduk secara permanen dari database (misal: karena pindah kependudukan / administrasi ganda).

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

**Response Gagal (404 Not Found):**
```json
{
  "success": false,
  "message": "Data penduduk tidak ditemukan."
}
```