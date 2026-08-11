import { pgTable, varchar, date, uuid, customType, index } from "drizzle-orm/pg-core";
import Cryptr from "cryptr";
import { createHash } from "crypto";
import "dotenv/config";

const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET_KEY || "rahasia_negara_development_key_12345";
const cryptr = new Cryptr(ENCRYPTION_SECRET);

const encryptedVarchar = customType<{ data: string; driverData: string }>({
  dataType() {
    return "text";
  },
  toDriver(value: string) {
    return cryptr.encrypt(value);
  },
  fromDriver(value: unknown) {
    if (typeof value !== "string") return value as string;
    return cryptr.decrypt(value);
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