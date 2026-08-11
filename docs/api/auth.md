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

## 4. Route Uji Coba Middleware: GET `/api/me`

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

## Penting: Penggunaan pada Frontend Klien
Jika Anda menggunakan framework frontend (seperti React, Vue, Svelte), disarankan **TIDAK** menembak API di atas secara manual menggunakan `fetch` atau `axios`. 

Gunakanlah *client library* bawaan Better Auth (`@better-auth/client`). Library ini akan otomatis mengurus URL, pengiriman cookie, dan tipe data TypeScript dengan sangat rapi.

Contoh di Frontend:
```javascript
import { createAuthClient } from "better-auth/client"

const authClient = createAuthClient({
    baseURL: "http://localhost:3000" // URL API Fastify Anda
})

// Cara Login:
const { data, error } = await authClient.signIn.username({
    username: "superadmin",
    password: "PasswordRahasia123!"
});

// Cara mengecek sesi aktif:
const { data: session } = await authClient.useSession();
```