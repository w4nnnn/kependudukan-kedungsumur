# Design Spec: Fitur Manajemen Pengguna (User Management) Frontend Web

- **Tanggal:** 2026-08-21
- **Target:** `web/` (Next.js App Router)
- **Modul:** Manajemen Pengguna (`/pengguna`)

---

## 1. Ringkasan
Menambahkan modul Manajemen Pengguna ke dalam aplikasi web Next.js (`web/`) untuk mengelola akun administrator dan pengguna desa, memanfaatkan Better Auth Admin Plugin di backend dan frontend.

## 2. Navigasi & Sidebar
- **File:** `web/components/app-sidebar.tsx`
- Menghapus item menu **"Pengaturan"**.
- Menambahkan item menu **"Pengguna"** dengan rute `/pengguna`, ikon `UserCog` (atau `Users`), dan status aktif jika `pathname.startsWith("/pengguna")`.

## 3. Konfigurasi Auth Client
- **File:** `web/lib/auth-client.ts`
- Mengimpor `adminClient` dari `better-auth/client/plugins`.
- Menambahkan plugin `adminClient()` ke instans `createAuthClient`.

## 4. Halaman & Komponen

### 4.1 Layout Pengguna (`web/app/pengguna/layout.tsx`)
- Membungkus halaman pengguna dengan struktur layout dashboard yang konsisten (`SidebarProvider`, `AppSidebar`, `SidebarInset`, dan header dengan `SidebarTrigger`).

### 4.2 Daftar Pengguna (`web/app/pengguna/page.tsx`)
- **Fungsi:** Menampilkan daftar user dalam bentuk tabel responsif dengan pencarian dan pagination.
- **Data Fetching:** Menggunakan `authClient.admin.listUsers` dengan query limit, offset, searchField (`name`/`email`), dan searchValue.
- **Kolom Tabel:**
  - Nama & Email
  - Username
  - Role (`admin` / `user`) dengan Badge
  - Status Akun (`Aktif` / `Diblokir`) dengan Badge
  - Tanggal Pembuatan
  - Menu Aksi (Dropdown): Edit / Kelola, Hapus User.
- **Aksi Cepat:** Tombol "Tambah Pengguna" yang mengarahkan ke `/pengguna/tambah`.
- **Dialog Hapus:** Menggunakan `AlertDialog` untuk konfirmasi hapus permanen (`authClient.admin.removeUser`).

### 4.3 Tambah Pengguna (`web/app/pengguna/tambah/page.tsx`)
- **Fungsi:** Formulir pembuatan akun baru oleh admin.
- **Validasi (Zod + React Hook Form):**
  - `name`: string min 3 karakter
  - `username`: string min 3 karakter (dikirim di `data: { username }`)
  - `email`: email valid
  - `password`: string min 6 karakter
  - `role`: "admin" | "user"
- **Eksekusi:** `authClient.admin.createUser` -> notifikasi toast -> redirect ke `/pengguna`.

### 4.4 Edit & Kelola Pengguna (`web/app/pengguna/edit/[id]/page.tsx`)
- **Fungsi:** Pengelolaan lengkap satu akun pengguna dengan 4 bagian terpisah:
  1. **Informasi Profil & Role:**
     - Mengubah Nama, Email, dan Role.
     - Menggunakan `authClient.admin.updateUser` dan `authClient.admin.setRole`.
  2. **Ubah / Reset Password:**
     - Form input password baru (min. 6 karakter) dan konfirmasi password.
     - Menggunakan `authClient.admin.setUserPassword`.
  3. **Status Akun & Pemblokiran (Ban / Unban):**
     - Mengaktifkan atau mencabut blokir akun user.
     - Form alasan pemblokiran jika diban (`authClient.admin.banUser` / `authClient.admin.unbanUser`).
  4. **Zona Bahaya (Hapus Akun):**
     - Tombol hapus akun permanen dengan konfirmasi `AlertDialog`.
     - Proteksi disable jika user yang diedit adalah user yang sedang login.

## 5. Keamanan & Penanganan Error
- Pengecekan sesi aktif di sisi klien; redirect ke `/login` jika sesi tidak valid.
- Penanganan error Better Auth seperti `USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL`, `YOU_CANNOT_BAN_YOURSELF`, `YOU_CANNOT_REMOVE_YOURSELF`, dll. dengan toast pesan berbahasa Indonesia yang jelas.
