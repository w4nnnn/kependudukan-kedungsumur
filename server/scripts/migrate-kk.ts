import { db } from "../src/db/index.js";
import { pendudukTable, kartuKeluargaTable, hashKependudukan } from "../src/db/schema/schema.js";
import { eq, isNull } from "drizzle-orm";

async function migrateExistingPendudukToKK() {
  console.log("Memulai migrasi data penduduk ke Kartu Keluarga (KK)...");

  // Ambil seluruh penduduk yang belum memiliki kartuKeluargaId
  const unlinkedPenduduk = await db.select().from(pendudukTable);
  console.log(`Ditemukan ${unlinkedPenduduk.length} total data penduduk.`);

  // Kelompokkan penduduk berdasarkan noKkHash
  const kkGroups = new Map<string, typeof unlinkedPenduduk>();
  for (const p of unlinkedPenduduk) {
    const list = kkGroups.get(p.noKkHash) || [];
    list.push(p);
    kkGroups.set(p.noKkHash, list);
  }

  console.log(`Ditemukan ${kkGroups.size} kelompok KK unik.`);

  let createdKKCount = 0;
  let linkedPendudukCount = 0;

  for (const [noKkHash, members] of kkGroups.entries()) {
    // Cek apakah KK sudah ada di tabel kartu_keluarga
    const existingKK = await db
      .select()
      .from(kartuKeluargaTable)
      .where(eq(kartuKeluargaTable.noKkHash, noKkHash));

    let kkId: string;

    if (existingKK.length > 0 && existingKK[0]) {
      kkId = existingKK[0].id;
    } else {
      // Pilih representasi alamat dari anggota pertama
      const sample = members[0]!;
      
      // Buat data Kartu Keluarga baru
      const newKK = await db
        .insert(kartuKeluargaTable)
        .values({
          noKk: sample.noKk, // customType auto-encrypts
          noKkHash: sample.noKkHash,
          alamat: sample.alamat,
          rt: sample.rt,
          rw: sample.rw,
          dusun: "Dusun Krajan",
        })
        .returning();

      kkId = newKK[0]!.id;
      createdKKCount++;
    }

    // Update tiap anggota keluarga
    let kepalaId: string | null = null;
    for (let i = 0; i < members.length; i++) {
      const member = members[i]!;
      // Default: urutan pertama jadi KEPALA KELUARGA jika belum diset
      const isKepala = i === 0;
      const shdk = member.shdk || (isKepala ? "KEPALA KELUARGA" : "ANGGOTA KELUARGA");
      if (isKepala) {
        kepalaId = member.id;
      }

      await db
        .update(pendudukTable)
        .set({
          kartuKeluargaId: kkId,
          shdk: shdk,
          urutanKk: String(i + 1),
        })
        .where(eq(pendudukTable.id, member.id));

      linkedPendudukCount++;
    }

    // Update kepalaKeluargaId di kartu_keluarga jika belum ada
    if (kepalaId) {
      await db
        .update(kartuKeluargaTable)
        .set({ kepalaKeluargaId: kepalaId })
        .where(eq(kartuKeluargaTable.id, kkId));
    }
  }

  console.log(`✅ Migrasi selesai!`);
  console.log(`- KK Dibuat: ${createdKKCount}`);
  console.log(`- Penduduk ditautkan: ${linkedPendudukCount}`);
  process.exit(0);
}

migrateExistingPendudukToKK().catch((err) => {
  console.error("Gagal melakukan migrasi KK:", err);
  process.exit(1);
});
