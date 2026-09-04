# Order By Data Terbaru (Penduduk & KK) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menampilkan data penduduk dan Kartu Keluarga (KK) dengan data yang baru dibuat berada paling atas pada daftar tabel.

**Architecture:** Menambahkan kolom `createdAt` dan `updatedAt` bertipe timestamp pada tabel `kartu_keluarga` dan `penduduk`, mensinkronkan skema ke PostgreSQL, kemudian memperbarui kueri `GET /api/penduduk` dan `GET /api/kk` agar diurutkan secara menurun (`desc(createdAt)`).

**Tech Stack:** Fastify, Drizzle ORM, PostgreSQL, TypeScript, Next.js 16.

## Global Constraints
- Menggunakan Drizzle ORM dengan PostgreSQL dialect.
- Nilai default timestamp menggunakan `defaultNow()`.
- Menjaga integritas data lama tanpa menghapus atau merusak data yang ada.
- Menjaga semua assertion test di `server/scripts/test-api.ts` tetap passing.

---

### Task 1: Update Schema Database Drizzle

**Files:**
- Modify: `server/src/db/schema/schema.ts`

- [ ] **Step 1: Tambahkan kolom timestamp dan index pada tabel `kartu_keluarga` dan `penduduk`**

Impor `timestamp` dari `drizzle-orm/pg-core`.
Tambahkan pada `kartuKeluargaTable`:
```ts
createdAt: timestamp("created_at").defaultNow().notNull(),
updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
```
dan index `index("idx_kk_created_at").on(table.createdAt)`.

Tambahkan pada `pendudukTable`:
```ts
createdAt: timestamp("created_at").defaultNow().notNull(),
updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
```
dan index `index("idx_penduduk_created_at").on(table.createdAt)`.

- [ ] **Step 2: Sinkronkan skema ke database PostgreSQL**

Run: `npm --prefix server run build`
Run: `npx drizzle-kit push` pada direktori `server`

---

### Task 2: Update Rute Backend untuk Mengurutkan Data Terbaru

**Files:**
- Modify: `server/src/routes/penduduk.routes.ts`
- Modify: `server/src/routes/kk.routes.ts`

- [ ] **Step 1: Urutkan `GET /api/penduduk` berdasarkan `desc(pendudukTable.createdAt)`**

Impor `desc` dari `drizzle-orm`.
Ubah pemanggilan kueri `data`:
```ts
const [data, totalCount] = await Promise.all([
  query.orderBy(desc(pendudukTable.createdAt)).limit(Number(limit)).offset(offset),
  countQuery
]);
```

- [ ] **Step 2: Urutkan `GET /api/kk` berdasarkan `desc(kartuKeluargaTable.createdAt)`**

Impor `desc` dari `drizzle-orm`.
Ubah pemanggilan `kkList`:
```ts
const kkList = await db
  .select({ ... })
  .from(kartuKeluargaTable)
  .leftJoin(pendudukTable, eq(kartuKeluargaTable.kepalaKeluargaId, pendudukTable.id))
  .where(whereCondition)
  .orderBy(desc(kartuKeluargaTable.createdAt))
  .limit(Number(limit))
  .offset(offset);
```

---

### Task 3: Verifikasi API Tests dan Frontend Build

**Files:**
- Test: `server/scripts/test-api.ts`
- Verify: `web/`

- [ ] **Step 1: Jalankan Test Suite Backend**

Run: `npm --prefix server run test:api`
Expected: Seluruh test pass 100%.

- [ ] **Step 2: Jalankan Typecheck & Build Web**

Run: `npm --prefix web run build`
Expected: Next.js build sukses.

- [ ] **Step 3: Commit Perubahan**

```bash
git add server/src/db/schema/schema.ts server/src/routes/penduduk.routes.ts server/src/routes/kk.routes.ts
git commit -m "feat: order penduduk and kk by newest first (desc created_at)"
```
