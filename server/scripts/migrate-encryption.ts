import "dotenv/config";
import { db } from "../src/db/index.js";
import { pendudukTable } from "../src/db/schema/schema.js";
import Cryptr from "cryptr";
import { createHash, randomBytes, createCipheriv } from "crypto";
import { eq } from "drizzle-orm";

const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET_KEY || "rahasia_negara_development_key_12345";
const aesKey = createHash("sha256").update(ENCRYPTION_SECRET).digest();
const legacyCryptr = new Cryptr(ENCRYPTION_SECRET);

function encryptAesGcm(text: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", aesKey, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

function tryDecryptLegacy(val: string): string {
  try {
    return legacyCryptr.decrypt(val);
  } catch {
    return val;
  }
}

async function migrateData() {
  console.log("Memeriksa dan memperbarui data enkripsi penduduk ke AES-GCM...");
  
  // Ambil data mentah langsung dari database
  const rows = await db.select().from(pendudukTable);
  console.log(`Ditemukan ${rows.length} data penduduk di database.`);

  let updatedCount = 0;

  for (const row of rows) {
    // Di schema saat ini, row.nik dan row.noKk sudah didekripsi saat dibaca oleh drizzle
    // Kita cukup re-encrypt dan update langsung
    await db
      .update(pendudukTable)
      .set({
        nik: row.nik,
        noKk: row.noKk,
      })
      .where(eq(pendudukTable.id, row.id));

    updatedCount++;
  }

  console.log(`✅ Sukses memigrasi ${updatedCount} data ke format AES-256-GCM native.`);
  process.exit(0);
}

migrateData().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
