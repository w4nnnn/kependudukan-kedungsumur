# Spesifikasi Desain: Order By Data Terbaru (Penduduk & Kartu Keluarga)

## 1. Konteks & Latar Belakang
Pada aplikasi Sistem Informasi Kependudukan Desa Kedungsumur, pengguna membutuhkan data penduduk dan Kartu Keluarga (KK) yang baru ditambahkan/dibuat agar selalu tampil di urutan paling atas pada tabel daftar (`/kependudukan` dan `/kk`). 

Saat ini:
- Tabel `penduduk` dan `kartu_keluarga` belum memiliki kolom pencatat waktu (`created_at`, `updated_at`).
- Query pada endpoint `GET /api/penduduk` dan `GET /api/kk` belum memiliki klausa `ORDER BY`, sehingga data diurutkan berdasarkan urutan bawaan PostgreSQL yang tidak menentu.
- Frontend menggunakan server-side pagination dengan limit 10 atau 100 per halaman.

## 2. Tujuan Desain
- Menambahkan kolom pelacak waktu pembuatan (`created_at`) dan pembaruan (`updated_at`) dengan default `now()` pada tabel `penduduk` dan `kartu_keluarga`.
- Menambahkan indeks pada `created_at` di kedua tabel untuk menjamin performa pengurutan tetap cepat saat data bertumbuh besar.
- Mengubah kueri list di backend `server/src/routes/penduduk.routes.ts` dan `server/src/routes/kk.routes.ts` untuk mengurutkan data secara *descending* berdasarkan `created_at` (`desc(...)`).
- Memastikan kompatibilitas penuh dengan test suite backend (`scripts/test-api.ts`) dan tampilan frontend.

## 3. Rincian Teknis & Arsitektur

### 3.1 Perubahan Skema Database (`server/src/db/schema/schema.ts`)
- Impor `timestamp` dari `drizzle-orm/pg-core`.
- **Tabel `kartu_keluarga`**:
  - `createdAt`: `timestamp("created_at").defaultNow().notNull()`
  - `updatedAt`: `timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull()`
  - Indeks: `index("idx_kk_created_at").on(table.createdAt)`
- **Tabel `penduduk`**:
  - `createdAt`: `timestamp("created_at").defaultNow().notNull()`
  - `updatedAt`: `timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull()`
  - Indeks: `index("idx_penduduk_created_at").on(table.createdAt)`

### 3.2 Migrasi Database Drizzle
- Jalankan sinkronisasi skema ke database PostgreSQL menggunakan `npx drizzle-kit push` (atau generate SQL migration).
- Kolom `created_at` dan `updated_at` akan otomatis terisi nilai `now()` untuk data yang sudah ada di database tanpa merusak data yang telah tersimpan.

### 3.3 Pembaruan Rute Backend
1. **`server/src/routes/penduduk.routes.ts`**:
   - Impor fungsi `desc` dari `drizzle-orm`.
   - Pada `fastify.get("/api/penduduk", ...)`:
     ```ts
     const [data, totalCount] = await Promise.all([
       query.orderBy(desc(pendudukTable.createdAt)).limit(Number(limit)).offset(offset),
       countQuery
     ]);
     ```
2. **`server/src/routes/kk.routes.ts`**:
   - Impor fungsi `desc` dari `drizzle-orm`.
   - Pada `fastify.get("/api/kk", ...)`:
     ```ts
     const kkList = await db
       .select({ ... })
       .from(kartuKeluargaTable)
       .leftJoin(...)
       .where(whereCondition)
       .orderBy(desc(kartuKeluargaTable.createdAt))
       .limit(Number(limit))
       .offset(offset);
     ```

### 3.4 Validasi Test Suite Backend
- Periksa file `server/scripts/tests/assertions.ts` (`validatePendudukSchema` & `validateKartuKeluargaSchema`).
- Jika skema validasi test memverifikasi field response, sesuaikan agar menerima properti opsional `createdAt` dan `updatedAt` bila dikembalikan ke client.
- Jalankan `npm --prefix server run test:api` untuk memastikan seluruh kontrak API tetap hijau (pass).

### 3.5 Frontend
- Frontend di `web/app/kependudukan/page.tsx` dan `web/app/kk/page.tsx` sudah menggunakan parameter `page` dan `limit` ke backend.
- Karena backend mengembalikan data terurut `created_at DESC`, data yang baru ditambahkan langsung berada pada baris pertama di halaman 1.

## 4. Rencana Pengujian & Verifikasi
1. **Verifikasi Database**: Jalankan migrasi dan pastikan kolom serta index terbentuk di PostgreSQL.
2. **Verifikasi Test Suite**: Jalankan `npm --prefix server run test:api`.
3. **Verifikasi Fungsional**:
   - Buat 1 penduduk baru melalui API atau form.
   - Ambil list penduduk dan verifikasi bahwa record baru berada di posisi index 0 (`data[0]`).
   - Buat 1 KK baru dan verifikasi bahwa record baru berada di posisi index 0 (`data[0]`).
4. **Verifikasi Frontend Build**: Jalankan `npm --prefix web run build` untuk memastikan tidak ada dampak negatif pada build Next.js.
