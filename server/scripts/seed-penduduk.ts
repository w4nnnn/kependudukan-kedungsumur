import { db } from "../src/db/index.js";
import { pendudukTable, hashKependudukan } from "../src/db/schema/schema.js";

// Helper functions for random data generation
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!;
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};
const formatDate = (date: Date) => date.toISOString().split("T")[0];

// Data sources
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

// Generate Random NIK & No KK (16 digits)
// Using format: 35 + 2 digits (Kab/Kota) + 2 digits (Kecamatan) + 6 digits (Tanggal lahir) + 4 digits (Urutan)
const generate16Digits = () => {
  let num = "";
  for (let i = 0; i < 16; i++) {
    num += randomInt(0, 9).toString();
  }
  return num;
};

async function runSeed() {
  console.log("Generating dummy data...");
  const count = randomInt(100, 200);
  const dummyData: any[] = [];
  
  // We'll generate a few Family Cards (KK) to assign multiple people to the same KK
  const numberOfKK = Math.ceil(count / 3); 
  const kkList = Array.from({ length: numberOfKK }, generate16Digits);

  for (let i = 0; i < count; i++) {
    const isMale = Math.random() > 0.5;
    const firstName = isMale ? randomElement(firstNamesM) : randomElement(firstNamesF);
    const lastName = randomElement(lastNames);
    const namaLengkap = `${firstName} ${lastName}`;
    
    const jenisKelamin = isMale ? "Laki-laki" : "Perempuan";
    
    // NIK & KK logic
    const nik = generate16Digits();
    const noKk = randomElement(kkList);
    
    // Birth date between 1950 and 2020
    const birthDate = randomDate(new Date(1950, 0, 1), new Date(2020, 0, 1));
    const tanggalLahir = formatDate(birthDate);

    dummyData.push({
      nik: nik,
      nikHash: hashKependudukan(nik),
      noKk: noKk,
      noKkHash: hashKependudukan(noKk),
      namaLengkap,
      tempatLahir: randomElement(tempatLahirList),
      tanggalLahir,
      jenisKelamin,
      alamat: randomElement(alamatList),
      rt: randomElement(rtList),
      rw: randomElement(rwList),
      agama: randomElement(agamaList),
      statusPerkawinan: randomElement(statusPerkawinanList),
      pekerjaan: randomElement(pekerjaanList),
    });
  }

  console.log(`Inserting ${dummyData.length} records into the database...`);
  
  try {
    // Insert in chunks to avoid large query payloads
    const chunkSize = 50;
    for (let i = 0; i < dummyData.length; i += chunkSize) {
      const chunk = dummyData.slice(i, i + chunkSize);
      await db.insert(pendudukTable).values(chunk);
    }
    console.log("Seed complete! 🎉");
  } catch (error) {
    console.error("Failed to seed data:", error);
  }
  
  process.exit(0);
}

runSeed();
