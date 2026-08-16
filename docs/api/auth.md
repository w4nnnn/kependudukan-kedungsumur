# Dokumentasi API Autentikasi (Better Auth)

Aplikasi Kependudukan ini menggunakan **Better Auth** untuk menangani autentikasi pengguna secara aman. Seluruh proses autentikasi (login, logout, cek sesi) diatur menggunakan metode **Database Session (Opaque Token)**, bukan JWT, untuk keamanan yang lebih ketat pada *Closed System*.

> **Base URL:** `http://localhost:3000`

---

## 1. POST `/api/auth/sign-in/username` (Login)

Digunakan oleh Admin untuk masuk ke dalam sistem menggunakan **username** dan **password**.

*   **URL:** `/api/auth/sign-in/username`
*   **Method:** `POST`
*   **Headers:**
    *   `Content-Type: application/json`

**Body Request (JSON):**
```json
{
  "username": "superadmin",
  "password": "PasswordRahasia123!"
}
```

**Response Sukses (200 OK):**
```json
{
  "token": "a1b2c3d4e5f6g7...",
  "user": {
    "id": "ckzq9...",
    "name": "Super Administrator",
    "email": "superadmin@kedungsumur.desa.id",
    "username": "superadmin",
    "role": "admin",
    "emailVerified": false,
    "createdAt": "2024-03-20T10:00:00.000Z",
    "updatedAt": "2024-03-20T10:00:00.000Z"
  }
}
```
*Catatan:* Selain mengembalikan JSON, server juga akan otomatis menyematkan *Cookie Session* (`better-auth.session_token`) ke browser Anda.

---

## 2. POST `/api/auth/sign-out` (Logout)

Digunakan untuk mengeluarkan pengguna dan menghancurkan sesi aktif di database.

*   **URL:** `/api/auth/sign-out`
*   **Method:** `POST`
*   **Headers:**
    *   *(Klien harus mengirimkan cookie sesi secara otomatis, atau header Authorization)*

**Body Request:** *(Kosong)*

**Response Sukses (200 OK):**
```json
{
  "success": true
}
```
*Catatan:* Server akan otomatis memerintahkan browser untuk menghapus cookie sesi.

---

## 3. GET `/api/auth/get-session` (Mendapatkan Sesi Aktif)

Digunakan oleh Frontend saat pertama kali *load* (refresh halaman) untuk mengecek apakah pengguna masih dalam kondisi login atau tidak.

*   **URL:** `/api/auth/get-session`
*   **Method:** `GET`
*   **Headers:**
    *   *(Memerlukan cookie sesi dari browser)*

**Response Sukses (200 OK):**
```json
{
  "session": {
    "id": "sess_123...",
    "expiresAt": "2024-03-27T10:00:00.000Z",
    "token": "a1b2c3d4e5f6g7...",
    "createdAt": "2024-03-20T10:00:00.000Z",
    "updatedAt": "2024-03-20T10:00:00.000Z",
    "userId": "ckzq9..."
  },
  "user": {
    "id": "ckzq9...",
    "name": "Super Administrator",
    "email": "superadmin@kedungsumur.desa.id",
    "username": "superadmin",
    "role": "admin"
  }
}
```

**Response Gagal (401 Unauthorized / Null):**
Jika pengguna belum login atau sesi telah kedaluwarsa, API biasanya akan mengembalikan data kosong (`null`) atau `401`.

---

## 4. Manajemen Pengguna (Admin Plugin)

Aplikasi ini menggunakan plugin `admin()` dari Better Auth. Berikut adalah beberapa endpoint yang tersedia secara otomatis dari plugin admin.

> **Catatan Penting:** Rute-rute ini dilindungi oleh middleware admin bawaan dari Better Auth. Anda harus login sebagai pengguna dengan role `admin` dan memiliki permission yang sesuai untuk mengaksesnya.

### 4.1 GET `/api/auth/admin/list-users` (Daftar Pengguna)

Mendapatkan daftar semua pengguna dalam sistem.

*   **URL:** `/api/auth/admin/list-users`
*   **Method:** `GET`
*   **Headers:**
    *   *(Memerlukan cookie sesi atau header Authorization dari admin)*
*   **Query Parameters (Opsional):**
    *   `limit`: Jumlah data per halaman (default 100)
    *   `offset`: Lewati N data pertama
    *   `searchValue`: Kata kunci pencarian
    *   `searchField`: Kolom pencarian (`email` atau `name`)

**Response Sukses (200 OK):**
```json
{
  "users": [
    {
      "id": "user1...",
      "email": "user1@example.com",
      "name": "User One",
      "role": "user"
    }
  ],
  "total": 1,
  "limit": 100,
  "offset": 0
}
```

---

### 4.2 POST `/api/auth/admin/update-user` (Ubah Pengguna)

Mengubah data pengguna (nama, role, email diverifikasi, ban status, dll).

*   **URL:** `/api/auth/admin/update-user`
*   **Method:** `POST`
*   **Headers:**
    *   `Content-Type: application/json`
    *   *(Memerlukan cookie sesi admin)*

**Body Request:**
```json
{
  "userId": "ckzq9...",
  "data": {
    "name": "Nama Baru",
    "banned": true,
    "banReason": "Melanggar aturan"
  }
}
```

---

### 4.3 POST `/api/auth/admin/set-role` (Ubah Role)

Menetapkan role kepada pengguna.

*   **URL:** `/api/auth/admin/set-role`
*   **Method:** `POST`
*   **Headers:**
    *   `Content-Type: application/json`
    *   *(Memerlukan cookie sesi admin)*

**Body Request:**
```json
{
  "userId": "ckzq9...",
  "role": "admin"
}
```

---

### 4.4 POST `/api/auth/admin/remove-user` (Hapus Pengguna)

Menghapus pengguna secara permanen dari database.

*   **URL:** `/api/auth/admin/remove-user`
*   **Method:** `POST`
*   **Headers:**
    *   `Content-Type: application/json`
    *   *(Memerlukan cookie sesi admin)*

**Body Request:**
```json
{
  "userId": "ckzq9..."
}
```

---

### 4.5 POST `/api/auth/admin/impersonate-user` (Impersonasi)

Mengambil alih sesi pengguna tertentu (impersonasi). Berguna untuk tujuan dukungan teknis/debug.

*   **URL:** `/api/auth/admin/impersonate-user`
*   **Method:** `POST`
*   **Headers:**
    *   `Content-Type: application/json`
    *   *(Memerlukan cookie sesi admin)*

**Body Request:**
```json
{
  "userId": "ckzq9..."
}
```

---

### 4.6 POST `/api/auth/admin/create-user` (Buat Pengguna)

Membuat pengguna baru melalui panel admin. Bermanfaat jika fitur sign-up publik dimatikan (Closed System).

*   **URL:** `/api/auth/admin/create-user`
*   **Method:** `POST`
*   **Headers:**
    *   `Content-Type: application/json`
    *   *(Memerlukan cookie sesi admin dengan permission create)*

**Body Request:**
```json
{
  "email": "user@example.com",
  "password": "PasswordUserBaru123!",
  "name": "Nama User",
  "role": "user",
  "data": {
    "username": "usernameresmi"
  }
}
```

*Catatan:* `data` digunakan untuk menyisipkan bidang tambahan yang ada di skema (misal: plugin `username` yang ditambahkan ke Better Auth).

---

## 5. Route Uji Coba Middleware: GET `/api/me`

Ini adalah rute kustom yang kita buat di Fastify (menggunakan `requireAuth`) untuk membuktikan bahwa perlindungan middleware berfungsi.

*   **URL:** `/api/me`
*   **Method:** `GET`
*   **Headers:**
    *   *(Memerlukan cookie sesi)*

**Response Sukses (200 OK):**
```json
{
  "message": "Anda berhasil mengakses rute terproteksi!",
  "user": {
    "id": "ckzq9...",
    "name": "Super Administrator",
    "username": "superadmin",
    "role": "admin"
  }
}
```

**Response Gagal (401 Unauthorized):**
```json
{
  "error": "Unauthorized. Anda belum login."
}
```

---

## 6. Penggunaan di Frontend (Better Auth Client)

Daripada melakukan HTTP Request (Fetch/Axios) secara manual ke endpoint `/api/auth/*` seperti di atas, sangat disarankan untuk menggunakan **Better Auth Client** di sisi Frontend. Client ini sudah menyediakan *wrapper* yang rapi untuk semua operasi, termasuk manajemen state sesi dan akses ke fitur plugin `admin()`.

### Inisialisasi Auth Client (Frontend)

```typescript
// src/lib/auth-client.ts (di frontend)
import { createAuthClient } from "better-auth/client";
import { adminClient, usernameClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    baseURL: "http://localhost:3000", // Sesuaikan dengan base URL backend
    plugins: [
        adminClient(),
        usernameClient()
    ]
});
```

### Contoh Penggunaan

**1. Login dengan Username**
```typescript
const { data, error } = await authClient.signIn.username({
    username: "superadmin",
    password: "PasswordRahasia123!"
});
```

**2. Logout**
```typescript
await authClient.signOut();
```

**3. Mendapatkan Daftar Pengguna (Admin)**
```typescript
const { data, error } = await authClient.admin.listUsers({
    query: {
        limit: 10,
        searchValue: "admin",
        searchField: "name"
    }
});
```

**4. Membuat Pengguna Baru (Admin)**
```typescript
const { data, error } = await authClient.admin.createUser({
    email: "user@example.com",
    name: "Nama User",
    password: "PasswordUserBaru123!",
    role: "user",
    data: {
        username: "usernameresmi" // Custom field via data
    }
});
```

Untuk selengkapnya mengenai Better Auth Client, Anda bisa membaca dokumentasi resminya.

---