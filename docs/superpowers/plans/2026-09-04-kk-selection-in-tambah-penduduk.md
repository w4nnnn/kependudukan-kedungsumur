# KK Selection in Tambah Penduduk Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan pilihan mode penentuan Kartu Keluarga (Pilih KK Terdaftar vs Input No KK Manual) dengan auto-fill alamat pada form Tambah Penduduk.

**Architecture:** Menggunakan komponen React Hook Form + Tailwind UI card selector serupa `web/app/kk/tambah/page.tsx`, melakukan fetching dinamis ke endpoint `GET /api/kk`, serta mengisi field form secara otomatis saat KK dipilih.

**Tech Stack:** Next.js 16, React 19, Lucide Icons, React Hook Form, Zod.

## Global Constraints
- Mengikuti pola desain kartu pemilihan yang ada di `web/app/kk/tambah/page.tsx`.
- Nilai `noKk` harus tetap tervalidasi 16 digit pada schema form.
- Tidak merusak fungsionalitas upload foto dan submit data penduduk.

---

### Task 1: Implementasi Mode Selector & Auto-fill di Form Tambah Penduduk

**Files:**
- Modify: `web/app/kependudukan/tambah/page.tsx`

- [ ] **Step 1: Tambahkan state dan useEffect untuk fetch KK**
  - State `modeKk` ("select" | "manual"), `kkSearch`, `kkList`, `selectedKkId`, dan `isLoadingKk`.
  - Effect untuk fetch data dari `${process.env.NEXT_PUBLIC_API_URL}/api/kk` dengan query search / nokk.

- [ ] **Step 2: Tambahkan UI Selector Kartu di bagian Nomor Kartu Keluarga**
  - Tombol mode "Pilih KK Terdaftar" (icon `Home` / `Users`) dan "Input Manual" (icon `PenTool` / `FileText`).
  - Dropdown Select & Search input saat mode "select" aktif.
  - Saat KK dipilih, update `noKk`, `alamat`, `rt`, dan `rw` dengan data KK terpilih.
  - Input field standar jika mode "manual" aktif.

- [ ] **Step 3: Verifikasi build dan typecheck**
  Run: `npm --prefix web run build`
  Expected: Compile berhasil tanpa error.

- [ ] **Step 4: Commit perubahan**
  ```bash
  git add web/app/kependudukan/tambah/page.tsx
  git commit -m "feat(web): add KK selection and auto-fill to tambah penduduk form"
  ```
