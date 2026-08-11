import { pgTable, varchar, date, uuid, customType } from "drizzle-orm/pg-core";
import Cryptr from "cryptr";
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

export const pendudukTable = pgTable("penduduk", {
  id: uuid("id").defaultRandom().primaryKey(),
  nik: encryptedVarchar("nik").notNull(),
  noKk: encryptedVarchar("no_kk").notNull(),
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
});



