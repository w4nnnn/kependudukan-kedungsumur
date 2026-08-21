import { pgTable, varchar, date, uuid, customType, index } from "drizzle-orm/pg-core";
import { createHash, randomBytes, createCipheriv, createDecipheriv } from "crypto";
import "dotenv/config";

const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET_KEY || "rahasia_negara_development_key_12345";
const aesKey = createHash("sha256").update(ENCRYPTION_SECRET).digest();

export function encryptAesGcm(text: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", aesKey, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptAesGcm(cipherText: string): string {
  const buf = Buffer.from(cipherText, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", aesKey, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted, undefined, "utf8") + decipher.final("utf8");
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
    return decryptAesGcm(value);
  },
});

export function hashKependudukan(value: string) {
  const salt = process.env.HASH_SALT || "garam_hashing_desa_123";
  return createHash("sha256").update(value + salt).digest("hex");
}

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
  },
  (table) => [
    index("idx_penduduk_nama").on(table.namaLengkap),
    index("idx_penduduk_rt_rw").on(table.rt, table.rw),
    index("idx_penduduk_nokk_hash").on(table.noKkHash),
  ]
);