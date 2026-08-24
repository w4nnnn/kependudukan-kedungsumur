import { db } from "../src/db/index.js";
import { pendudukTable, kartuKeluargaTable } from "../src/db/schema/schema.js";

async function clearData() {
  console.log("Menghapus seluruh data penduduk dan kartu keluarga...");
  try {
    const deletedPenduduk = await db.delete(pendudukTable).returning();
    const deletedKK = await db.delete(kartuKeluargaTable).returning();

    console.log("✅ Berhasil membersihkan data!");
    console.log(`- Data Penduduk Dihapus: ${deletedPenduduk.length}`);
    console.log(`- Data Kartu Keluarga Dihapus: ${deletedKK.length}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Gagal menghapus data:", error);
    process.exit(1);
  }
}

clearData();
