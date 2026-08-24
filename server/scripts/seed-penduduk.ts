import { db } from "../src/db/index.js";
import { pendudukTable, kartuKeluargaTable, hashKependudukan } from "../src/db/schema/schema.js";
import { eq } from "drizzle-orm";

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!;
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};
const formatDate = (date: Date) => date.toISOString().split("T")[0];

const firstNamesM = ["Budi", "Andi", "Joko", "Supri", "Agus", "Yanto", "Eko", "Tri", "Iwan", "Hendra", "Rudi", "Cahyono", "Bagus", "Bambang", "Slamet", "Heri", "Wahyu", "Rizky", "Dimas", "Fajar"];
const firstNamesF = ["Siti", "Ayu", "Dewi", "Rini", "Wati", "Sri", "Nur", "Lestari", "Endang", "Fitri", "Indah", "Ratna", "Sari", "Tari", "Maya", "Dian", "Anisa", "Putri"];
const lastNames = ["Santoso", "Wijaya", "Kusuma", "Pratama", "Putra", "Putri", "Sari", "Lestari", "Nugroho", "Setiawan", "Wibowo", "Hidayat", "Syahputra", "Utomo", "Gunawan"];
const tempatLahirList = ["Surabaya", "Malang", "Sidoarjo", "Gresik", "Mojokerto", "Jombang", "Pasuruan", "Probolinggo", "Banyuwangi", "Kediri", "Madiun"];
const agamaList = ["Islam", "Islam", "Islam", "Islam", "Kristen", "Katolik", "Hindu", "Buddha"];
const statusPerkawinanList = ["Belum Kawin", "Kawin", "Kawin", "Cerai Hidup", "Cerai Mati"];
const pekerjaanList = ["Petani", "PNS", "Wiraswasta", "Karyawan Swasta", "Pelajar/Mahasiswa", "Buruh", "Pedagang", "TNI", "POLRI", "Mengurus Rumah Tangga", "Guru", "Perawat"];
const pendidikanList = ["SD / Sederajat", "SMP / Sederajat", "SMA / SMK / Sederajat", "Diploma (D3)", "Sarjana (S1)", "Magister (S2)", "Tidak / Belum Sekolah"];
const golonganDarahList = ["A", "B", "AB", "O", "-"];
const dusunList = ["Dusun Krajan", "Dusun Sukamaju", "Dusun Sidomulyo", "Dusun Sumberwaru"];
const alamatList = ["Jl. Diponegoro No. ", "Jl. Kartini No. ", "Jl. Merdeka No. ", "Jl. Pahlawan No. ", "Gang Mawar No. ", "Gang Melati No. "];
const rtList = ["001", "002", "003", "004", "005", "006"];
const rwList = ["001", "002", "003", "004"];

const generate16Digits = (prefix = "3573") => {
  let num = prefix;
  for (let i = 0; i < 16 - prefix.length; i++) {
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

  console.log("Generating data Kartu Keluarga & Penduduk...");
  const numberOfKK = randomInt(50, 75);
  const createdKKList: any[] = [];

  for (let i = 0; i < numberOfKK; i++) {
    const noKk = generate16Digits("357301");
    const alamat = `${randomElement(alamatList)}${randomInt(1, 99)}`;
    const rt = randomElement(rtList);
    const rw = randomElement(rwList);
    const dusun = randomElement(dusunList);

    const [kk] = await db
      .insert(kartuKeluargaTable)
      .values({
        noKk,
        noKkHash: hashKependudukan(noKk),
        alamat,
        rt,
        rw,
        dusun,
        kodePos: "65171",
        tanggalDikeluarkan: formatDate(randomDate(new Date(2018, 0, 1), new Date(2025, 0, 1))),
      })
      .returning();

    if (kk) {
      createdKKList.push(kk);
    }
  }

  console.log(`Berhasil membuat ${createdKKList.length} master Kartu Keluarga.`);

  const dummyPenduduk: any[] = [];
  const generatedNIKs = new Set<string>();

  for (const kk of createdKKList) {
    const memberCount = randomInt(2, 5);
    const kepalaLastName = randomElement(lastNames);
    const kepalaAyah = `${randomElement(firstNamesM)} ${randomElement(lastNames)}`;
    const kepalaIbu = `${randomElement(firstNamesF)} ${randomElement(lastNames)}`;

    let kepalaNama = "";
    let istriNama = "";

    for (let j = 0; j < memberCount; j++) {
      let nik = generate16Digits("357301");
      while (generatedNIKs.has(nik)) {
        nik = generate16Digits("357301");
      }
      generatedNIKs.add(nik);

      const isKepala = j === 0;
      const isIstri = j === 1;
      const isMale = isKepala ? true : isIstri ? false : Math.random() > 0.5;

      const firstName = isMale ? randomElement(firstNamesM) : randomElement(firstNamesF);
      const lastName = isKepala ? kepalaLastName : isIstri ? randomElement(lastNames) : kepalaLastName;
      const namaLengkap = `${firstName} ${lastName}`;

      if (isKepala) kepalaNama = namaLengkap;
      if (isIstri) istriNama = namaLengkap;

      let shdk = "ANAK";
      let statusPerkawinan = "Belum Kawin";
      let birthDate = randomDate(new Date(2005, 0, 1), new Date(2023, 0, 1));
      let pekerjaan = isMale ? "Pelajar/Mahasiswa" : "Pelajar/Mahasiswa";

      if (isKepala) {
        shdk = "KEPALA KELUARGA";
        statusPerkawinan = "Kawin";
        birthDate = randomDate(new Date(1960, 0, 1), new Date(1990, 0, 1));
        pekerjaan = randomElement(["Petani", "Wiraswasta", "PNS", "Karyawan Swasta", "Pedagang"]);
      } else if (isIstri) {
        shdk = "ISTRI";
        statusPerkawinan = "Kawin";
        birthDate = randomDate(new Date(1965, 0, 1), new Date(1995, 0, 1));
        pekerjaan = randomElement(["Mengurus Rumah Tangga", "Guru", "Wiraswasta", "Perawat", "Pedagang"]);
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
        pekerjaan,
        pendidikan: isKepala || isIstri ? randomElement(pendidikanList.slice(1, 6)) : randomElement(pendidikanList.slice(0, 3)),
        golonganDarah: randomElement(golonganDarahList),
        namaAyah: isKepala ? kepalaAyah : isIstri ? `${randomElement(firstNamesM)} ${randomElement(lastNames)}` : kepalaNama,
        namaIbu: isKepala ? kepalaIbu : isIstri ? `${randomElement(firstNamesF)} ${randomElement(lastNames)}` : (istriNama || kepalaIbu),
      });
    }
  }

  console.log(`Memasukkan ${dummyPenduduk.length} data penduduk ke database...`);

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

    console.log("✅ Seed database kependudukan selesai dengan sukses! 🎉");
  } catch (error) {
    console.error("Gagal melakukan seeding data:", error);
  }

  process.exit(0);
}

runSeed();
