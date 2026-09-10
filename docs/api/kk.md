# 📋 Dokumentasi API Kartu Keluarga (KK)

Dokumentasi lengkap mengenai endpoint pengelolaan data Kartu Keluarga di Sistem Informasi Kependudukan Desa Kedungsumur.

Seluruh endpoint di bawah ini memerlukan proteksi autentikasi (Sesi aktif Better Auth via Cookie `better-auth.session_token` atau Header `Authorization: Bearer <token>`).

---

## 1. Daftar Kartu Keluarga

- **URL:** `/api/kk`
- **Method:** `GET`
- **Query Parameters:**
  - `page` (opsional, default: `1`): Halaman data.
  - `limit` (opsional, default: `100`): Jumlah data per halaman.
  - `nokk` (opsional): Pencarian eksak nomor KK (memanfaatkan Blind Indexing SHA-256).
  - `search` (opsional): Pencarian nama Kepala Keluarga atau no KK.
  - `rt` (opsional): Filter nomor RT.
  - `rw` (opsional): Filter nomor RW.
  - `dusun` (opsional): Filter nama dusun.
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "c1f7b76e-526e-44db-bb23-96b6e4e5bcde",
        "noKk": "3573010101800001",
        "noKkHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "kepalaKeluargaId": "a9d8c36b-7128-4034-9ff2-1a2b3c4d5e6f",
        "kepalaKeluargaNama": "Budi Santoso",
        "kepalaKeluargaNik": "3573010101800002",
        "alamat": "Dusun Krajan",
        "rt": "001",
        "rw": "002",
        "dusun": "Dusun Krajan",
        "kodePos": "65171",
        "tanggalDikeluarkan": "2023-01-15",
        "jumlahAnggota": 4
      }
    ],
    "meta": {
      "total": 74,
      "page": 1,
      "limit": 100,
      "totalPages": 1
    }
  }
  ```

---

## 2. Detail Kartu Keluarga & Daftar Anggota

- **URL:** `/api/kk/:id`
- **Method:** `GET`
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "c1f7b76e-526e-44db-bb23-96b6e4e5bcde",
      "noKk": "3573010101800001",
      "alamat": "Dusun Krajan",
      "rt": "001",
      "rw": "002",
      "dusun": "Dusun Krajan",
      "kodePos": "65171",
      "tanggalDikeluarkan": "2023-01-15",
      "jumlahAnggota": 2,
      "kepalaKeluarga": {
        "id": "a9d8c36b-7128-4034-9ff2-1a2b3c4d5e6f",
        "nik": "3573010101800002",
        "namaLengkap": "Budi Santoso",
        "fotoUrl": null
      },
      "anggota": [
        {
          "id": "a9d8c36b-7128-4034-9ff2-1a2b3c4d5e6f",
          "nik": "3573010101800002",
          "namaLengkap": "Budi Santoso",
          "shdk": "KEPALA KELUARGA",
          "urutanKk": "1",
          "jenisKelamin": "Laki-laki",
          "tanggalLahir": "1980-01-01",
          "tempatLahir": "Kedungsumur",
          "agama": "Islam",
          "statusPerkawinan": "Kawin",
          "pekerjaan": "Petani",
          "fotoUrl": null
        }
      ]
    }
  }
  ```

---

## 3. Tambah Kartu Keluarga Baru

- **URL:** `/api/kk`
- **Method:** `POST`
- **Request Body (JSON):**
  ```json
  {
    "noKk": "3573010101800001",
    "alamat": "Jl. Merdeka No. 12",
    "rt": "001",
    "rw": "002",
    "dusun": "Dusun Krajan",
    "kodePos": "65171",
    "tanggalDikeluarkan": "2023-01-15"
  }
  ```
- **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Data Kartu Keluarga berhasil ditambahkan.",
    "data": {
      "id": "c1f7b76e-526e-44db-bb23-96b6e4e5bcde",
      "noKk": "3573010101800001",
      "alamat": "Jl. Merdeka No. 12",
      "rt": "001",
      "rw": "002"
    }
  }
  ```

---

## 4. Perbarui Data Kartu Keluarga

- **URL:** `/api/kk/:id`
- **Method:** `PUT`
- **Request Body (JSON):**
  ```json
  {
    "alamat": "Jl. Diponegoro No. 45",
    "rt": "003",
    "rw": "002"
  }
  ```
- **Catatan:** Jika alamat / RT / RW / No KK diubah pada level KK, data pada seluruh anggota penduduk di bawah KK tersebut otomatis disinkronkan.

---

## 5. Tambah Anggota ke Dalam KK

- **URL:** `/api/kk/:id/anggota`
- **Method:** `POST`
- **Request Body (Pilihan 1: Mode Select - Tautkan Penduduk Terdaftar):**
  ```json
  {
    "mode": "select",
    "pendudukId": "a9d8c36b-7128-4034-9ff2-1a2b3c4d5e6f",
    "shdk": "ANAK",
    "urutanKk": "3"
  }
  ```
- **Request Body (Pilihan 2: Mode Create - Input Penduduk Baru Langsung ke KK):**
  ```json
  {
    "mode": "create",
    "shdk": "ANAK",
    "urutanKk": "3",
    "penduduk": {
      "nik": "3573010101850009",
      "namaLengkap": "Anak Baru",
      "tempatLahir": "Kedungsumur",
      "tanggalLahir": "2015-08-20",
      "jenisKelamin": "Laki-laki",
      "agama": "Islam",
      "statusPerkawinan": "Belum Kawin",
      "pekerjaan": "Pelajar"
    }
  }
  ```
- **Success Response (200 / 201 Created):**
  ```json
  {
    "success": true,
    "message": "Penduduk Anak Baru berhasil ditambahkan ke Kartu Keluarga.",
    "data": {
      "id": "b3e8c36b-7128-4034-9ff2-1a2b3c4d5e7a",
      "nik": "3573010101850009",
      "namaLengkap": "Anak Baru",
      "kartuKeluargaId": "c1f7b76e-526e-44db-bb23-96b6e4e5bcde",
      "fotoUrl": null
    }
  }
  ```

---

## 6. Keluarkan Anggota dari KK

- **URL:** `/api/kk/:id/anggota/:pendudukId`
- **Method:** `DELETE`
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Anggota keluarga berhasil dikeluarkan dari Kartu Keluarga."
  }
  ```

---

## 7. Hapus Kartu Keluarga

- **URL:** `/api/kk/:id`
- **Method:** `DELETE`
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Data Kartu Keluarga berhasil dihapus."
  }
  ```
