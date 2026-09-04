# Full KK Creation in Tambah Penduduk Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan kemampuan pembuatan data Kartu Keluarga lengkap (Nomor KK, Alamat, RT, RW, Dusun, Kode Pos, Tanggal Dikeluarkan) secara langsung dari dalam form Tambah Penduduk, dengan eksekusi transaksional di backend.

**Architecture:** Memperluas endpoint `POST /api/penduduk` untuk memproses payload `createKk`, menyimpan baris baru di `kartu_keluarga`, mengaitkan `kartuKeluargaId`, serta menetapkan `kepalaKeluargaId` jika SHDK adalah KEPALA KELUARGA. Pada frontend, form Tambah Penduduk diperkaya dengan sub-form pembuatan KK lengkap dengan kalender berbahasa Indonesia dan sinkronisasi alamat otomatis.

**Tech Stack:** Fastify, Drizzle ORM, Next.js 16, React 19, React Hook Form, Zod, date-fns/locale id.

---

### Task 1: Update Endpoint `POST /api/penduduk` di Backend

**Files:**
- Modify: `server/src/routes/penduduk.routes.ts`

- [ ] **Step 1: Tambahkan tipe dan penanganan `createKk` pada `POST /api/penduduk`**
  - Definisikan tipe `CreateKkPayload` (noKk, alamat, rt, rw, dusun, kodePos, tanggalDikeluarkan).
  - Jika `body.createKk` diberikan:
    - Cek apakah `noKk` sudah ada di `kartu_keluarga`. Jika ada, kirim respon 400 ("Nomor KK sudah terdaftar.").
    - Insert baris baru ke `kartu_keluarga`.
    - Dapatkan `id` KK baru dan tetapkan sebagai `kartuKeluargaId` pada data penduduk.
  - Insert penduduk ke `pendudukTable`.
  - Jika SHDK adalah `KEPALA KELUARGA`, update `kepalaKeluargaId` pada `kartu_keluarga`.
  - Kembalikan status 201 dengan data penduduk yang baru dibuat.

- [ ] **Step 2: Jalankan test API backend**
  Run: `npm --prefix server run test:api`
  Expected: Semua 37 test lolos 100%.

---

### Task 2: Perbarui Form Tambah Penduduk di Frontend

**Files:**
- Modify: `web/app/kependudukan/tambah/page.tsx`

- [ ] **Step 1: Perluas Schema & State Form**
  - Tambahkan field data KK baru pada schema/state: `kkAlamat`, `kkRt`, `kkRw`, `kkDusun`, `kkKodePos`, `kkTanggalDikeluarkan`.
  - Sediakan UI sub-form pembuatan KK ketika mode "create" aktif dengan input:
    - Nomor KK (16 digit)
    - Alamat domisili keluarga
    - RT & RW
    - Dusun & Kode Pos
    - Tanggal Dikeluarkan KK (Popover Calendar Bahasa Indonesia)
  - Pasang handler sinkronisasi otomatis: saat nilai alamat KK diisi, otomatis terapkan ke field alamat penduduk jika belum diubah khusus.

- [ ] **Step 2: Kirim payload `createKk` saat submit**
  - Jika mode adalah "create", bentuk payload `createKk` dan sertakan ke body request `POST /api/penduduk`.

---

### Task 3: Verifikasi Kompilasi & Integrasi

**Files:**
- Verify: `server/` dan `web/`

- [ ] **Step 1: Test backend & build frontend**
  Run: `npm --prefix server run test:api`
  Run: `npm --prefix web run build`

- [ ] **Step 2: Commit perubahan**
  ```bash
  git add server/src/routes/penduduk.routes.ts web/app/kependudukan/tambah/page.tsx
  git commit -m "feat: support full KK creation in tambah penduduk form"
  ```
