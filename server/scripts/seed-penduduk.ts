import { db } from "../src/db/index.js";
import { pendudukTable, kartuKeluargaTable, hashKependudukan } from "../src/db/schema/schema.js";
import { eq } from "drizzle-orm";

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!;
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};
const formatDate = (date: Date) => date.toISOString().split("T")[0];

const firstNamesM = ["Budi", "Andi", "Joko", "Supri", "Agus", "Yanto", "Eko", "Tri", "Iwan", "Hendra", "Rudi", "Cahyono", "Bagus", "Bambang", "Slamet", "Heri"];
const firstNamesF = ["Siti", "Ayu", "Dewi", "Rini", "Wati", "Sri", "Nur", "Lestari", "Endang", "Fitri", "Indah", "Ratna", "Sari", "Tari"];
const lastNames = ["Santoso", "Wijaya", "Kusuma", "Pratama", "Putra", "Putri", "Sari", "Lestari", "Nugroho", "Setiawan", "Wibowo", "Hidayat", "Syahputra"];
const tempatLahirList = ["Surabaya", "Malang", "Sidoarjo", "Gresik", "Mojokerto", "Jombang", "Pasuruan", "Probolinggo", "Banyuwangi", "Kediri", "Madiun"];
const agamaList = ["Islam", "Islam", "Islam", "Islam", "Kristen", "Katolik", "Hindu", "Buddha"];
const statusPerkawinanList = ["Belum Kawin", "Kawin", "Kawin", "Cerai Hidup", "Cerai Mati"];
const pekerjaanList = ["Petani", "PNS", "Wiraswasta", "Karyawan Swasta", "Pelajar/Mahasiswa", "Buruh", "Pedagang", "TNI", "POLRI", "Mengurus Rumah Tangga"];
const alamatList = ["Dusun Krajan", "Dusun Sukamaju", "Dusun Sidomulyo", "Perumahan Indah", "Jl. Diponegoro"];
const rtList = ["001", "002", "003", "004", "005", "006"];
const rwList = ["001", "002", "003", "004"];

const generate16Digits = () => {
  let num = "";
  for (let i = 0; i < 16; i++) {
    num += randomInt(0, 9).toString();
  }
  return num;
};

async function runSeed() {
  console.log("Membersihkan data lama (penduduk & kartu_keluarga)...");
  try {
    await db.delete(pendudukTable);
    await db.delete(kartuKeluargaTable);
    console.log("Data lama berhasil dibersihkan.");
  } catch (error) {
    console.error("Gagal membersihkan data lama:", error);
    process.exit(1);
  }

  console.log("Generating dummy data...");
  const numberOfKK = randomInt(40, 60);
  const createdKKList: any[] = [];

  for (let i = 0; i < numberOfKK; i++) {
    const noKk = generate16Digits();
    const alamat = randomElement(alamatList);
    const rt = randomElement(rtList);
    const rw = randomElement(rwList);

    const [kk] = await db
      .insert(kartuKeluargaTable)
      .values({
        noKk,
        noKkHash: hashKependudukan(noKk),
        alamat,
        rt,
        rw,
        dusun: "Dusun Krajan",
        kodePos: "65171",
      })
      .returning();

    if (kk) {
      createdKKList.push(kk);
    }
  }

  console.log(`Berhasil membuat ${createdKKList.length} Kartu Keluarga.`);

  const dummyPenduduk: any[] = [];
  const generatedNIKs = new Set<string>();

  for (const kk of createdKKList) {
    const memberCount = randomInt(2, 5);

    for (let j = 0; j < memberCount; j++) {
      let nik = generate16Digits();
      while (generatedNIKs.has(nik)) {
        nik = generate16Digits();
      }
      generatedNIKs.add(nik);

      const isKepala = j === 0;
      const isIstri = j === 1;
      const isMale = isKepala ? true : isIstri ? false : Math.random() > 0.5;

      const firstName = isMale ? randomElement(firstNamesM) : randomElement(firstNamesF);
      const lastName = randomElement(lastNames);
      const namaLengkap = `${firstName} ${lastName}`;

      let shdk = "ANAK";
      let statusPerkawinan = "Belum Kawin";
      let birthDate = randomDate(new Date(1998, 0, 1), new Date(2023, 0, 1));

      if (isKepala) {
        shdk = "KEPALA KELUARGA";
        statusPerkawinan = "Kawin";
        birthDate = randomDate(new Date(1960, 0, 1), new Date(1990, 0, 1));
      } else if (isIstri) {
        shdk = "ISTRI";
        statusPerkawinan = "Kawin";
        birthDate = randomDate(new Date(1965, 0, 1), new Date(1995, 0, 1));
      }

      dummyPenduduk.push({
        kartuKeluargaId: kk.id,
        nik,
        nikHash: hashKependudukan(nik),
        noKk: kk.noKk,
        noKkHash: kk.noKkHash,
        namaLengkap,
        tempatLahir: randomElement(tempatLahirList),
        tanggalLahir: formatDate(birthDate),
        jenisKelamin: isMale ? "Laki-laki" : "Perempuan",
        alamat: kk.alamat,
        rt: kk.rt,
        rw: kk.rw,
        agama: randomElement(agamaList),
        statusPerkawinan,
        shdk,
        urutanKk: String(j + 1),
        pekerjaan: isKepala ? "Wiraswasta" : isIstri ? "Mengurus Rumah Tangga" : randomElement(pekerjaanList),
      });
    }
  }

  console.log(`Inserting ${dummyPenduduk.length} penduduk records...`);

  try {
    const chunkSize = 50;
    for (let i = 0; i < dummyPenduduk.length; i += chunkSize) {
      const chunk = dummyPenduduk.slice(i, i + chunkSize);
      const inserted = await db.insert(pendudukTable).values(chunk).returning();

      for (const p of inserted) {
        if (p.shdk === "KEPALA KELUARGA" && p.kartuKeluargaId) {
          await db
            .update(kartuKeluargaTable)
            .set({ kepalaKeluargaId: p.id })
            .where(eq(kartuKeluargaTable.id, p.kartuKeluargaId));
        }
      }
    }

    console.log("Seed complete! 🎉");
  } catch (error) {
    console.error("Failed to seed data:", error);
  }

  process.exit(0);
}

runSeed();
