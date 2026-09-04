# Strict Form Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan validasi regex dan proteksi filter input pada form penduduk dan KK agar tidak dapat diisi simbol terlarang (seperti +, -, =, simbol aneh).

**Architecture:** Membuat modul helper validasi regex dan key filter di `web/lib/validation.ts`, kemudian menerapkan skema Zod yang ketat dan input handler pada form Tambah/Edit Penduduk dan Tambah/Edit KK.

**Tech Stack:** Next.js 16, React 19, Zod, React Hook Form, TypeScript.

## Global Constraints
- Tidak menambahkan komentar/docstring yang tidak perlu pada kode TypeScript/React.
- Menjaga kompatibilitas data yang sah (misal: nama dengan tanda petik/titik seperti M. Syafi'i, alamat dengan garis miring nomor rumah).
- Blokir karakter non-angka langsung pada event `onKeyDown` untuk field numerik.

---

### Task 1: Buat Modul Validasi dan Key Handler Terpusat

**Files:**
- Create: `web/lib/validation.ts`

- [ ] **Step 1: Implementasikan konstanta regex dan fungsi helper**
  - Regex NIK & No KK: `/^\d{16}$/`
  - Regex RT & RW: `/^\d{3}$/`
  - Regex Kode Pos: `/^\d{5}$/`
  - Regex Nama: `/^[a-zA-Z\s'.]+$/`
  - Regex Tempat Lahir: `/^[a-zA-Z\s]+$/`
  - Regex Alamat: `/^[a-zA-Z0-9\s.,/'-]+$/`
  - Regex Pekerjaan & Dusun: `/^[a-zA-Z0-9\s/.-]+$/`
  - Handler `blockNonNumericKeyDown(e: React.KeyboardEvent<HTMLInputElement>)`

---

### Task 2: Terapkan Validasi Ketat pada Form Penduduk (Tambah & Edit)

**Files:**
- Modify: `web/app/kependudukan/tambah/page.tsx`
- Modify: `web/app/kependudukan/edit/[id]/page.tsx`

- [ ] **Step 1: Perbarui Zod schema dengan regex ketat**
- [ ] **Step 2: Pasang `onKeyDown={blockNonNumericKeyDown}` pada input numerik**

---

### Task 3: Terapkan Validasi Ketat pada Form Kartu Keluarga (Tambah & Edit)

**Files:**
- Modify: `web/app/kk/tambah/page.tsx`
- Modify: `web/app/kk/edit/[id]/page.tsx`

- [ ] **Step 1: Perbarui Zod schema dengan regex ketat**
- [ ] **Step 2: Pasang `onKeyDown={blockNonNumericKeyDown}` pada input numerik**

---

### Task 4: Verifikasi dan Pengujian

**Files:**
- Test: `server/scripts/test-api.ts`
- Verify: `web/`

- [ ] **Step 1: Jalankan `npm --prefix web run typecheck`**
- [ ] **Step 2: Jalankan `npm --prefix web run build`**
- [ ] **Step 3: Jalankan `npm --prefix server run test:api`**
- [ ] **Step 4: Commit seluruh perubahan**
