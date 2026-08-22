# Integrasi Foto Penduduk dengan MinIO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan fitur penyimpanan dan pengelolaan file foto/gambar penduduk pada backend Fastify + Drizzle ORM menggunakan MinIO Object Storage.

**Architecture:** Menggunakan `@fastify/multipart` untuk menangani upload file foto di Fastify, modul client `minio` di `server/src/lib/minio.ts` untuk mengelola bucket dan operasi objek file (upload, delete, URL generator), kolom `foto` baru pada `pendudukTable` di Drizzle ORM, serta endpoint REST API terproteksi otentikasi di `penduduk.routes.ts`.

**Tech Stack:** Node.js (TypeScript), Fastify, Drizzle ORM, PostgreSQL, MinIO Client SDK (`minio`), `@fastify/multipart`.

## Global Constraints

- Backend berbasis Fastify v5 dan Drizzle ORM dengan PostgreSQL.
- Semua endpoint pengelolaan foto (`POST /api/penduduk/:id/foto`, `DELETE /api/penduduk/:id/foto`) wajib dilindungi middleware `requireAuth`.
- Batas ukuran upload file foto maksimal 5MB dengan tipe file yang diizinkan: `image/jpeg`, `image/png`, `image/webp`.
- Nama file di MinIO harus unik dan terisolasi per penduduk menggunakan pola: `penduduk/<id>-<timestamp>.<ext>`.
- Jika data penduduk dihapus atau foto diperbarui, file objek lama di MinIO harus otomatis dihapus.
- Seluruh kode TypeScript harus lulus pemeriksaan tipe (`npm run build` / `tsc --noEmit`).

---

### Task 1: Dependensi & Konfigurasi Lingkungan MinIO

**Files:**
- Modify: `server/package.json`
- Modify: `server/.env.example`
- Modify: `server/.env`

**Interfaces:**
- Consumes: Environment variables (`MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET_NAME`, `MINIO_PUBLIC_URL`).
- Produces: Package `minio`, `@fastify/multipart`, dan `@types/minio` terpasang di node_modules.

- [ ] **Step 1: Install dependensi MinIO dan Fastify Multipart**

Jalankan perintah instalasi di folder `server`:
```bash
npm --prefix server install minio @fastify/multipart
npm --prefix server install -D @types/minio
```

- [ ] **Step 2: Tambahkan konfigurasi MinIO ke `.env.example` dan `.env`**

Buka `server/.env.example` dan tambahkan baris berikut di bagian akhir:
```env
# ==============================================================================
# KONFIGURASI MINIO / S3 STORAGE
# ==============================================================================
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=kependudukan
MINIO_PUBLIC_URL=http://localhost:9000/kependudukan
```

Pastikan variabel yang sama juga tersedia di `server/.env` lokal untuk development.

- [ ] **Step 3: Verifikasi package.json dan instalasi dependensi**

Periksa `server/package.json` untuk memastikan `minio` dan `@fastify/multipart` sudah terdaftar di `dependencies`.

- [ ] **Step 4: Commit konfigurasi dependensi**

```bash
git add server/package.json server/package-lock.json server/.env.example
git commit -m "chore: add minio and @fastify/multipart dependencies"
```

---

### Task 2: Perbarui Skema Database Penduduk (`schema.ts`)

**Files:**
- Modify: `server/src/db/schema/schema.ts`
- Modify: `server/scripts/tests/assertions.ts`

**Interfaces:**
- Consumes: Drizzle ORM `varchar`.
- Produces: Field `foto` bertipe string opsional/nullable pada `pendudukTable` dan validasi schema pada testing suite.

- [ ] **Step 1: Update skema tabel penduduk di `server/src/db/schema/schema.ts`**

Tambahkan kolom `foto` pada definisi `pendudukTable`:
```typescript
export const pendudukTable = pgTable(
  "penduduk",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    
    nik: encryptedVarchar("nik").notNull(),
    nikHash: varchar("nik_hash", { length: 64 }).notNull().unique(), 

    noKk: encryptedVarchar("no_kk").notNull(),
    noKkHash: varchar("no_kk_hash", { length: 64 }).notNull(),

    namaLengkap: varchar("nama_lengkap", { length: 255 }).notNull(),
    tempatLahir: varchar("tempat_lahir", { length: 100 }).notNull(),
    tanggalLahir: date("tanggal_lahir").notNull(),
    jenisKelamin: varchar("jenis_kelamin", { length: 20 }).notNull(),
    alamat: varchar("alamat", { length: 255 }).notNull(),
    rt: varchar("rt", { length: 5 }).notNull(),
    rw: varchar("rw", { length: 5 }).notNull(),
    agama: varchar("agama", { length: 50 }).notNull(),
    statusPerkawinan: varchar("status_perkawinan", { length: 50 }).notNull(),
    pekerjaan: varchar("pekerjaan", { length: 100 }),
    foto: varchar("foto", { length: 500 }),
  },
  (table) => [
    index("idx_penduduk_nama").on(table.namaLengkap),
    index("idx_penduduk_rt_rw").on(table.rt, table.rw),
    index("idx_penduduk_nokk_hash").on(table.noKkHash),
  ]
);
```

- [ ] **Step 2: Update assertion schema validator di `server/scripts/tests/assertions.ts`**

Tambahkan pengecekan field `foto` pada fungsi `validatePendudukSchema`:
```typescript
  if (item.pekerjaan !== null && item.pekerjaan !== undefined) {
    assertType(item.pekerjaan, "string", `${contextName}.pekerjaan`);
  }

  if (item.foto !== null && item.foto !== undefined) {
    assertType(item.foto, "string", `${contextName}.foto`);
  }
```

- [ ] **Step 3: Jalankan generate migration / periksa TypeScript compile**

Jalankan perintah:
```bash
npm --prefix server run build
```
Expected: Tidak ada error TypeScript (`Exit code 0`).

- [ ] **Step 4: Commit perubahan skema**

```bash
git add server/src/db/schema/schema.ts server/scripts/tests/assertions.ts
git commit -m "feat(db): add foto column to penduduk schema"
```

---

### Task 3: Modul Service MinIO (`server/src/lib/minio.ts`)

**Files:**
- Create: `server/src/lib/minio.ts`

**Interfaces:**
- Consumes: Environment variables MinIO (`process.env.MINIO_*`).
- Produces: `minioClient`, `initMinioBucket()`, `uploadFotoPenduduk()`, `deleteFotoPenduduk()`, `getPublicFotoUrl()`.

- [ ] **Step 1: Buat modul `server/src/lib/minio.ts`**

Tulis kode implementasi berikut:
```typescript
import * as Minio from "minio";
import "dotenv/config";

const endPoint = process.env.MINIO_ENDPOINT || "localhost";
const port = parseInt(process.env.MINIO_PORT || "9000", 10);
const useSSL = process.env.MINIO_USE_SSL === "true";
const accessKey = process.env.MINIO_ACCESS_KEY || "minioadmin";
const secretKey = process.env.MINIO_SECRET_KEY || "minioadmin";
export const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || "kependudukan";

export const minioClient = new Minio.Client({
  endPoint,
  port,
  useSSL,
  accessKey,
  secretKey,
});

/**
 * Inisialisasi bucket MinIO dan set policy agar foto dapat diakses publik/dibaca browser
 */
export async function initMinioBucket() {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, "us-east-1");
      console.log(`[MinIO] Bucket '${BUCKET_NAME}' berhasil dibuat.`);

      // Atur Read-Only policy publik untuk prefix penduduk/
      const policy = {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
          },
        ],
      };
      await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
      console.log(`[MinIO] Public Read Policy untuk '${BUCKET_NAME}' berhasil diterapkan.`);
    }
  } catch (error) {
    console.error("[MinIO] Gagal menginisialisasi bucket MinIO:", error);
  }
}

/**
 * Upload buffer foto penduduk ke MinIO
 */
export async function uploadFotoPenduduk(
  pendudukId: string,
  buffer: Buffer,
  mimeType: string,
  extension: string
): Promise<string> {
  const cleanExt = extension.startsWith(".") ? extension.slice(1) : extension;
  const objectKey = `penduduk/${pendudukId}-${Date.now()}.${cleanExt}`;

  await minioClient.putObject(BUCKET_NAME, objectKey, buffer, buffer.length, {
    "Content-Type": mimeType,
  });

  return objectKey;
}

/**
 * Hapus file foto dari MinIO berdasarkan objectKey
 */
export async function deleteFotoPenduduk(objectKey: string): Promise<void> {
  if (!objectKey) return;
  try {
    await minioClient.removeObject(BUCKET_NAME, objectKey);
  } catch (error) {
    console.error(`[MinIO] Gagal menghapus foto '${objectKey}':`, error);
  }
}

/**
 * Mendapatkan URL publik foto dari objectKey
 */
export function getPublicFotoUrl(objectKey: string | null | undefined): string | null {
  if (!objectKey) return null;
  const publicBaseUrl = process.env.MINIO_PUBLIC_URL || `http://${endPoint}:${port}/${BUCKET_NAME}`;
  return `${publicBaseUrl.replace(/\/$/, "")}/${objectKey}`;
}
```

- [ ] **Step 2: Validasi TypeScript build**

Jalankan:
```bash
npm --prefix server run build
```
Expected: `Exit code 0`.

- [ ] **Step 3: Commit implementasi modul MinIO**

```bash
git add server/src/lib/minio.ts
git commit -m "feat: add minio client service module and bucket initializer"
```

---

### Task 4: Registrasi Fastify Multipart & MinIO Startup di `server/src/index.ts`

**Files:**
- Modify: `server/src/index.ts`

**Interfaces:**
- Consumes: `@fastify/multipart`, `initMinioBucket` dari `./lib/minio.js`.
- Produces: Fastify instance yang mendukung `request.file()` / parsing multipart.

- [ ] **Step 1: Perbarui `server/src/index.ts`**

Daftarkan multipart plugin dan panggil `initMinioBucket()`:
```typescript
import fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import "dotenv/config";
import authRoutes from "./routes/auth.routes.js";
import pendudukRoutes from "./routes/penduduk.routes.js";
import { initMinioBucket } from "./lib/minio.js";

const app = fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'SYS:HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  },
});

app.register(cors, {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
});

// Registrasi multipart dengan batasan ukuran file 5MB
app.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 1,
  },
});

app.register(authRoutes);
app.register(pendudukRoutes);

app.get("/", async (request, reply) => {
  return { message: "Selamat Datang di API Kependudukan Desa Kedungsumur" };
});

const start = async () => {
  try {
    // Inisialisasi bucket MinIO saat startup
    await initMinioBucket();

    const port = parseInt(process.env.PORT || "3000", 10);
    await app.listen({ port, host: "0.0.0.0" });
    console.log(`🚀 Server API berjalan di http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
```

- [ ] **Step 2: Validasi TypeScript build**

Jalankan:
```bash
npm --prefix server run build
```
Expected: `Exit code 0`.

- [ ] **Step 3: Commit perubahan server startup**

```bash
git add server/src/index.ts
git commit -m "feat(server): register multipart plugin and init minio bucket on startup"
```

---

### Task 5: Implementasi Route Foto Penduduk (`server/src/routes/penduduk.routes.ts`)

**Files:**
- Modify: `server/src/routes/penduduk.routes.ts`

**Interfaces:**
- Consumes: `pendudukTable` dari Drizzle schema, `uploadFotoPenduduk`, `deleteFotoPenduduk`, `getPublicFotoUrl` dari `../lib/minio.js`.
- Produces:
  - `POST /api/penduduk/:id/foto` (Upload foto)
  - `DELETE /api/penduduk/:id/foto` (Hapus foto)
  - Modifikasi `DELETE /api/penduduk/:id` (Hapus objek foto MinIO saat data penduduk dihapus)
  - Response helper yang melampirkan `fotoUrl` publik.

- [ ] **Step 1: Modifikasi `server/src/routes/penduduk.routes.ts`**

Tambahkan fungsi pembantu format penduduk dengan `fotoUrl` serta handler endpoint upload & delete foto:
```typescript
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db/index.js";
import { pendudukTable, hashKependudukan } from "../db/schema/schema.js";
import { eq, ilike, and, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { uploadFotoPenduduk, deleteFotoPenduduk, getPublicFotoUrl } from "../lib/minio.js";
import path from "path";

type PendudukInsert = typeof pendudukTable.$inferInsert;
type ParamsWithId = { id: string };

function withFotoUrl<T extends { foto?: string | null }>(item: T) {
  return {
    ...item,
    fotoUrl: getPublicFotoUrl(item.foto),
  };
}

export default async function pendudukRoutes(fastify: FastifyInstance) {
  
  fastify.addHook("preHandler", requireAuth);

  fastify.get("/api/penduduk", async (request, reply) => {
    try {
      const { search, nik, nokk, limit = 100, page = 1 } = request.query as any;
      const offset = (Number(page) - 1) * Number(limit);

      let query = db.select().from(pendudukTable).$dynamic();
      let countQuery = db.select({ count: sql<number>`cast(count(${pendudukTable.id}) as integer)` }).from(pendudukTable).$dynamic();

      const conditions = [];

      if (search) {
        conditions.push(ilike(pendudukTable.namaLengkap, `%${search}%`));
      }
      
      if (nik) {
        conditions.push(eq(pendudukTable.nikHash, hashKependudukan(nik)));
      }

      if (nokk) {
        conditions.push(eq(pendudukTable.noKkHash, hashKependudukan(nokk)));
      }

      if (conditions.length > 0) {
        const whereCondition = and(...conditions);
        query = query.where(whereCondition);
        countQuery = countQuery.where(whereCondition);
      }

      const [data, totalCount] = await Promise.all([
        query.limit(Number(limit)).offset(offset),
        countQuery
      ]);

      const total = totalCount[0]?.count ?? 0;
      const totalPages = Math.ceil(total / Number(limit));

      return reply.send({ 
        success: true, 
        data: data.map(withFotoUrl),
        meta: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ success: false, message: "Gagal mengambil data." });
    }
  });

  fastify.get<{ Params: ParamsWithId }>("/api/penduduk/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const data = await db.select().from(pendudukTable).where(eq(pendudukTable.id, id));
      
      if (data.length === 0) {
        return reply.status(404).send({ success: false, message: "Data penduduk tidak ditemukan." });
      }

      return reply.send({ success: true, data: withFotoUrl(data[0]) });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ success: false, message: "Gagal mengambil data." });
    }
  });

  fastify.post<{ Body: PendudukInsert }>("/api/penduduk", async (request, reply) => {
    try {
      const body = request.body;
      
      const newPendudukData = {
        ...body,
        nikHash: hashKependudukan(body.nik),
        noKkHash: hashKependudukan(body.noKk)
      };
      
      const newData = await db.insert(pendudukTable).values(newPendudukData).returning();
      
      return reply.status(201).send({ 
        success: true, 
        message: "Data penduduk berhasil ditambahkan.",
        data: withFotoUrl(newData[0])
      });
    } catch (error: any) {
      fastify.log.error(error);
      const isUniqueViolation = 
        error?.code === '23505' || 
        error?.cause?.code === '23505' ||
        error?.message?.includes('duplicate key') ||
        error?.cause?.message?.includes('duplicate key');

      if (isUniqueViolation) {
        return reply.status(400).send({ success: false, message: "NIK sudah terdaftar." });
      }
      return reply.status(500).send({ success: false, message: "Gagal menyimpan data." });
    }
  });

  fastify.put<{ Params: ParamsWithId; Body: Partial<PendudukInsert> }>("/api/penduduk/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const body = request.body;

      if (body.nik) body.nikHash = hashKependudukan(body.nik);
      if (body.noKk) body.noKkHash = hashKependudukan(body.noKk);

      const updatedData = await db
        .update(pendudukTable)
        .set(body)
        .where(eq(pendudukTable.id, id))
        .returning();

      if (updatedData.length === 0) {
        return reply.status(404).send({ success: false, message: "Data penduduk tidak ditemukan." });
      }

      return reply.send({ 
        success: true, 
        message: "Data penduduk berhasil diperbarui.",
        data: withFotoUrl(updatedData[0]) 
      });
    } catch (error: any) {
      fastify.log.error(error);
      const isUniqueViolation = 
        error?.code === '23505' || 
        error?.cause?.code === '23505' ||
        error?.message?.includes('duplicate key') ||
        error?.cause?.message?.includes('duplicate key');

      if (isUniqueViolation) {
        return reply.status(400).send({ success: false, message: "NIK sudah terdaftar." });
      }
      return reply.status(500).send({ success: false, message: "Gagal memperbarui data." });
    }
  });

  // POST /api/penduduk/:id/foto (Upload / Ganti Foto Penduduk)
  fastify.post<{ Params: ParamsWithId }>("/api/penduduk/:id/foto", async (request, reply) => {
    try {
      const { id } = request.params;

      const existing = await db.select().from(pendudukTable).where(eq(pendudukTable.id, id));
      if (existing.length === 0) {
        return reply.status(404).send({ success: false, message: "Data penduduk tidak ditemukan." });
      }

      const file = await request.file();
      if (!file) {
        return reply.status(400).send({ success: false, message: "File foto wajib diunggah." });
      }

      const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return reply.status(400).send({
          success: false,
          message: "Format file tidak didukung. Harap unggah gambar JPG, PNG, atau WebP.",
        });
      }

      const buffer = await file.toBuffer();
      const ext = path.extname(file.filename) || (file.mimetype === "image/png" ? ".png" : file.mimetype === "image/webp" ? ".webp" : ".jpg");

      // Hapus foto lama di MinIO jika ada
      if (existing[0].foto) {
        await deleteFotoPenduduk(existing[0].foto);
      }

      // Upload foto baru ke MinIO
      const objectKey = await uploadFotoPenduduk(id, buffer, file.mimetype, ext);

      // Update kolom foto di database
      const updated = await db
        .update(pendudukTable)
        .set({ foto: objectKey })
        .where(eq(pendudukTable.id, id))
        .returning();

      return reply.send({
        success: true,
        message: "Foto penduduk berhasil diunggah.",
        data: withFotoUrl(updated[0]),
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ success: false, message: "Gagal mengunggah foto penduduk." });
    }
  });

  // DELETE /api/penduduk/:id/foto (Hapus Foto Penduduk)
  fastify.delete<{ Params: ParamsWithId }>("/api/penduduk/:id/foto", async (request, reply) => {
    try {
      const { id } = request.params;

      const existing = await db.select().from(pendudukTable).where(eq(pendudukTable.id, id));
      if (existing.length === 0) {
        return reply.status(404).send({ success: false, message: "Data penduduk tidak ditemukan." });
      }

      if (existing[0].foto) {
        await deleteFotoPenduduk(existing[0].foto);
      }

      const updated = await db
        .update(pendudukTable)
        .set({ foto: null })
        .where(eq(pendudukTable.id, id))
        .returning();

      return reply.send({
        success: true,
        message: "Foto penduduk berhasil dihapus.",
        data: withFotoUrl(updated[0]),
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ success: false, message: "Gagal menghapus foto penduduk." });
    }
  });

  // DELETE /api/penduduk/:id (Hapus Penduduk & file foto di MinIO jika ada)
  fastify.delete<{ Params: ParamsWithId }>("/api/penduduk/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const deletedData = await db.delete(pendudukTable).where(eq(pendudukTable.id, id)).returning();

      if (deletedData.length === 0) {
        return reply.status(404).send({ success: false, message: "Data penduduk tidak ditemukan." });
      }

      // Hapus file foto dari MinIO jika penduduk memiliki foto
      if (deletedData[0].foto) {
        await deleteFotoPenduduk(deletedData[0].foto);
      }

      return reply.send({ success: true, message: "Data penduduk berhasil dihapus." });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ success: false, message: "Gagal menghapus data." });
    }
  });
}
```

- [ ] **Step 2: Validasi TypeScript build**

Jalankan:
```bash
npm --prefix server run build
```
Expected: `Exit code 0`.

- [ ] **Step 3: Commit implementasi route foto**

```bash
git add server/src/routes/penduduk.routes.ts
git commit -m "feat(api): implement upload and delete foto penduduk endpoints with minio"
```

---

### Task 6: Integrasi Pengujian API (`penduduk.test.ts`)

**Files:**
- Modify: `server/scripts/tests/penduduk.test.ts`

**Interfaces:**
- Consumes: `TestClient`, `TestRunner`, `validatePendudukSchema`.
- Produces: Step pengujian otomatis untuk upload foto, verifikasi `fotoUrl`, hapus foto, dan hapus data penduduk dengan foto.

- [ ] **Step 1: Update skenario pengujian di `server/scripts/tests/penduduk.test.ts`**

Tambahkan pengujian upload foto (menggunakan `FormData` dan `Blob`), pengujian validasi mime type, dan pengujian penghapusan foto:
```typescript
  // Pengujian Upload Foto Penduduk
  await runner.step("POST /api/penduduk/:id/foto (Upload Foto Penduduk)", async () => {
    const fakeImageBuffer = Buffer.from("GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;");
    const formData = new FormData();
    formData.append("file", new Blob([fakeImageBuffer], { type: "image/png" }), "pasfoto.png");

    const authHeaders = client.getAuthHeaders(false);
    const res = await client.request(`/api/penduduk/${createdPendudukId}/foto`, {
      method: "POST",
      headers: authHeaders,
      body: formData,
    });

    assertEqual(res.status, 200, "HTTP Status Upload Foto");
    assertEqual(res.body.success, true, "upload.success");
    assertEqual(res.body.message, "Foto penduduk berhasil diunggah.", "upload.message");
    assertType(res.body.data.foto, "string", "data.foto key");
    assertType(res.body.data.fotoUrl, "string", "data.fotoUrl");
    assert(res.body.data.fotoUrl.includes(res.body.data.foto), "fotoUrl harus memuat foto key");
  });

  // Pengujian Hapus Foto Penduduk
  await runner.step("DELETE /api/penduduk/:id/foto (Hapus Foto Penduduk)", async () => {
    const res = await client.request(`/api/penduduk/${createdPendudukId}/foto`, {
      method: "DELETE",
      headers: client.getAuthHeaders(false),
    });

    assertEqual(res.status, 200, "HTTP Status Delete Foto");
    assertEqual(res.body.success, true, "deleteFoto.success");
    assertEqual(res.body.data.foto, null, "data.foto null");
    assertEqual(res.body.data.fotoUrl, null, "data.fotoUrl null");
  });
```

- [ ] **Step 2: Jalankan build dan verifikasi tidak ada error sintaks**

```bash
npm --prefix server run build
```
Expected: `Exit code 0`.

- [ ] **Step 3: Commit perubahan test**

```bash
git add server/scripts/tests/penduduk.test.ts
git commit -m "test(api): add automated test steps for foto penduduk upload and delete"
```
