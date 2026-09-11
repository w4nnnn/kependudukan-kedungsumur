import { pgTable, varchar, date, uuid, customType, index, timestamp } from "drizzle-orm/pg-core";
import { createHash, randomBytes, createCipheriv, createDecipheriv } from "crypto";
import "dotenv/config";

if (process.env.NODE_ENV === "production") {
  if (!process.env.ENCRYPTION_SECRET_KEY || process.env.ENCRYPTION_SECRET_KEY === "rahasia_negara_development_key_12345") {
    throw new Error("ENCRYPTION_SECRET_KEY harus dikonfigurasi dengan kunci aman di lingkungan production.");
  }
  if (!process.env.HASH_SALT || process.env.HASH_SALT === "garam_hashing_desa_123") {
    throw new Error("HASH_SALT harus dikonfigurasi dengan salt aman di lingkungan production.");
  }
}

const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET_KEY || "rahasia_negara_development_key_12345";
const aesKey = createHash("sha256").update(ENCRYPTION_SECRET).digest();

export function encryptAesGcm(text: string): string {
  if (typeof text !== "string" || !text) return text as any;
  try {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", aesKey, iv);
    const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString("base64");
  } catch (error: any) {
    throw new Error(`Gagal mengenkripsi data: ${error?.message || "ENCRYPTION_FAILED"}`);
  }
}

export function decryptAesGcm(cipherText: string): string {
  if (typeof cipherText !== "string" || !cipherText) return cipherText;
  const buf = Buffer.from(cipherText, "base64");
  if (buf.length < 28) return cipherText;
  try {
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const encrypted = buf.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", aesKey, iv);
    decipher.setAuthTag(tag);
    return decipher.update(encrypted, undefined, "utf8") + decipher.final("utf8");
  } catch (error: any) {
    throw new Error(
      `Gagal mendekripsi data: ciphertext rusak atau kunci enkripsi tidak cocok (${error?.message || "DECRYPTION_FAILED"})`
    );
  }
}

const encryptedVarchar = customType<{ data: string; driverData: string }>({
  dataType() {
    return "text";
  },
  toDriver(value: string) {
    return encryptAesGcm(value);
  },
  fromDriver(value: unknown) {
    if (typeof value !== "string") return value as string;
    try {
      return decryptAesGcm(value);
    } catch (error: any) {
      console.error("[DECRYPTION_ERROR] Gagal mendekripsi field:", error?.message);
      return "[DECRYPTION_FAILED]";
    }
  },
});

export function hashKependudukan(value: string) {
  const salt = process.env.HASH_SALT || "garam_hashing_desa_123";
  return createHash("sha256").update(value + salt).digest("hex");
}

export const kartuKeluargaTable = pgTable(
  "kartu_keluarga",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    noKk: encryptedVarchar("no_kk").notNull(),
    noKkHash: varchar("no_kk_hash", { length: 64 }).notNull().unique(),
    kepalaKeluargaId: uuid("kepala_keluarga_id"),
    alamat: varchar("alamat", { length: 255 }).notNull(),
    rt: varchar("rt", { length: 5 }).notNull(),
    rw: varchar("rw", { length: 5 }).notNull(),
    dusun: varchar("dusun", { length: 100 }),
    kodePos: varchar("kode_pos", { length: 10 }),
    tanggalDikeluarkan: date("tanggal_dikeluarkan"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("idx_kk_nokk_hash").on(table.noKkHash),
    index("idx_kk_rt_rw").on(table.rt, table.rw),
    index("idx_kk_created_at").on(table.createdAt),
  ]
);

export const pendudukTable = pgTable(
  "penduduk",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    
    kartuKeluargaId: uuid("kartu_keluarga_id").references(() => kartuKeluargaTable.id, { onDelete: "set null" }),

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
    shdk: varchar("shdk", { length: 50 }).notNull().default("KEPALA KELUARGA"),
    urutanKk: varchar("urutan_kk", { length: 5 }).default("1"),
    namaAyah: varchar("nama_ayah", { length: 255 }),
    namaIbu: varchar("nama_ibu", { length: 255 }),
    pendidikan: varchar("pendidikan", { length: 100 }),
    golonganDarah: varchar("golongan_darah", { length: 5 }),
    pekerjaan: varchar("pekerjaan", { length: 100 }),
    foto: varchar("foto", { length: 500 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("idx_penduduk_nama").on(table.namaLengkap),
    index("idx_penduduk_rt_rw").on(table.rt, table.rw),
    index("idx_penduduk_nokk_hash").on(table.noKkHash),
    index("idx_penduduk_kk_id").on(table.kartuKeluargaId),
    index("idx_penduduk_created_at").on(table.createdAt),
  ]
);