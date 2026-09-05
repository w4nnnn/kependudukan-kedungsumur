# Dedicated Tambah Anggota KK Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membuat halaman khusus `/kk/[id]/anggota/tambah` untuk menambah anggota Kartu Keluarga (baik memilih penduduk terdaftar maupun membuat penduduk baru langsung ke KK) dan mengalihkan tombol "Tambah Anggota" dari dialog modal ke halaman ini.

**Architecture:** Membuat halaman App Router baru di `web/app/kk/[id]/anggota/tambah/page.tsx` yang memuat ringkasan Kartu Keluarga terkait, menyediakan selector 2 mode (Pilih Penduduk Existing vs Input Penduduk Baru), serta memperbarui tombol navigasi di `web/app/kk/[id]/page.tsx`.

**Tech Stack:** Next.js 16, React 19, Lucide Icons, React Hook Form, Zod, date-fns/locale id.

---

### Task 1: Buat Halaman Baru Tambah Anggota KK (`/kk/[id]/anggota/tambah`)

**Files:**
- Create: `web/app/kk/[id]/anggota/tambah/page.tsx`

- [ ] **Step 1: Implementasi Halaman Tambah Anggota KK**
  - Mengambil data KK target berdasarkan `params.id` (No KK, Alamat, RT, RW, Dusun, jumlah anggota).
  - Mode 1: Cari penduduk terdaftar (NIK / Nama), pilih penduduk, tentukan SHDK dan nomor urut -> Kirim ke `POST /api/kk/:id/anggota`.
  - Mode 2: Formulir lengkap penduduk baru (NIK, Nama, Tempat Lahir, Tanggal Lahir, Jenis Kelamin, Agama, Status Perkawinan, Pekerjaan, Foto) dengan Alamat & No KK terkunci otomatis -> Kirim ke `POST /api/penduduk`.
  - Validasi ketat menggunakan regex dari `web/lib/validation.ts` dan `blockNonNumericKeyDown`.
  - Setelah sukses, tampilkan notifikasi toast dan navigasikan kembali ke `/kk/[id]`.

---

### Task 2: Perbarui Halaman Detail KK (`/kk/[id]`)

**Files:**
- Modify: `web/app/kk/[id]/page.tsx`

- [ ] **Step 1: Ganti Aksi Tombol Tambah Anggota**
  - Ubah tombol `Tambah Anggota` agar memanggil `router.push('/kk/${data.id}/anggota/tambah')`.
  - Bersihkan state dan markup modal Dialog tambah anggota yang tidak lagi terpakai.

---

### Task 3: Verifikasi Kompilasi & Build

**Files:**
- Verify: `web/`

- [ ] **Step 1: Jalankan typecheck dan build Next.js**
  Run: `npm --prefix web run typecheck`
  Run: `npm --prefix web run build`

- [ ] **Step 2: Commit perubahan**
  ```bash
  git add web/app/kk/[id]/anggota/tambah/page.tsx web/app/kk/[id]/page.tsx
  git commit -m "feat(web): add dedicated tambah anggota KK page and update navigation"
  ```
