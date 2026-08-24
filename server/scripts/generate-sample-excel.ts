import ExcelJS from "exceljs";
import path from "path";

async function generateSampleImportExcel() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Data Penduduk Sensus");

  worksheet.columns = [
    { header: "NIK (16 Digit)", key: "nik", width: 22 },
    { header: "No Kartu Keluarga (16 Digit)", key: "noKk", width: 25 },
    { header: "Nama Lengkap", key: "namaLengkap", width: 28 },
    { header: "Jenis Kelamin", key: "jenisKelamin", width: 16 },
    { header: "Tempat Lahir", key: "tempatLahir", width: 18 },
    { header: "Tanggal Lahir (YYYY-MM-DD)", key: "tanggalLahir", width: 22 },
    { header: "Alamat Domisili", key: "alamat", width: 30 },
    { header: "RT", key: "rt", width: 8 },
    { header: "RW", key: "rw", width: 8 },
    { header: "Agama", key: "agama", width: 14 },
    { header: "Status Perkawinan", key: "statusPerkawinan", width: 18 },
    { header: "Status Hubungan (SHDK)", key: "shdk", width: 24 },
    { header: "Pekerjaan", key: "pekerjaan", width: 20 },
    { header: "Nama Ayah", key: "namaAyah", width: 20 },
    { header: "Nama Ibu", key: "namaIbu", width: 20 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2BEE34" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };

  // Data Dummy Keluarga 1: Keluarga Bapak Ahmad Fauzi (RT 001 / RW 002)
  const noKk1 = "3573012408900001";
  worksheet.addRow({
    nik: "3573011503800001",
    noKk: noKk1,
    namaLengkap: "Ahmad Fauzi",
    jenisKelamin: "Laki-laki",
    tempatLahir: "Kedungsumur",
    tanggalLahir: "1980-03-15",
    alamat: "Jl. Diponegoro No. 12",
    rt: "001",
    rw: "002",
    agama: "Islam",
    statusPerkawinan: "Kawin",
    shdk: "KEPALA KELUARGA",
    pekerjaan: "Wiraswasta",
    namaAyah: "Haji Mahmud",
    namaIbu: "Hajjah Khadijah",
  });

  worksheet.addRow({
    nik: "3573015208850002",
    noKk: noKk1,
    namaLengkap: "Nurul Hidayati",
    jenisKelamin: "Perempuan",
    tempatLahir: "Malang",
    tanggalLahir: "1985-08-12",
    alamat: "Jl. Diponegoro No. 12",
    rt: "001",
    rw: "002",
    agama: "Islam",
    statusPerkawinan: "Kawin",
    shdk: "ISTRI",
    pekerjaan: "Guru",
    namaAyah: "Subagyo",
    namaIbu: "Siti Maryam",
  });

  worksheet.addRow({
    nik: "3573011004100003",
    noKk: noKk1,
    namaLengkap: "Rizky Fauzi Pratama",
    jenisKelamin: "Laki-laki",
    tempatLahir: "Kedungsumur",
    tanggalLahir: "2010-04-10",
    alamat: "Jl. Diponegoro No. 12",
    rt: "001",
    rw: "002",
    agama: "Islam",
    statusPerkawinan: "Belum Kawin",
    shdk: "ANAK",
    pekerjaan: "Pelajar/Mahasiswa",
    namaAyah: "Ahmad Fauzi",
    namaIbu: "Nurul Hidayati",
  });

  // Data Dummy Keluarga 2: Keluarga Bapak Bambang Hermawan (RT 003 / RW 001)
  const noKk2 = "3573012408900002";
  worksheet.addRow({
    nik: "3573012011780004",
    noKk: noKk2,
    namaLengkap: "Bambang Hermawan",
    jenisKelamin: "Laki-laki",
    tempatLahir: "Surabaya",
    tanggalLahir: "1978-11-20",
    alamat: "Gang Mawar No. 05",
    rt: "003",
    rw: "001",
    agama: "Islam",
    statusPerkawinan: "Kawin",
    shdk: "KEPALA KELUARGA",
    pekerjaan: "PNS",
    namaAyah: "Hermawan Sutrisno",
    namaIbu: "Endang Suparni",
  });

  worksheet.addRow({
    nik: "3573016402820005",
    noKk: noKk2,
    namaLengkap: "Dewi Lestari",
    jenisKelamin: "Perempuan",
    tempatLahir: "Sidoarjo",
    tanggalLahir: "1982-02-24",
    alamat: "Gang Mawar No. 05",
    rt: "003",
    rw: "001",
    agama: "Islam",
    statusPerkawinan: "Kawin",
    shdk: "ISTRI",
    pekerjaan: "Mengurus Rumah Tangga",
    namaAyah: "Suwarno",
    namaIbu: "Sri Rejeki",
  });

  worksheet.addRow({
    nik: "3573015509150006",
    noKk: noKk2,
    namaLengkap: "Anindya Putri Hermawan",
    jenisKelamin: "Perempuan",
    tempatLahir: "Kedungsumur",
    tanggalLahir: "2015-09-15",
    alamat: "Gang Mawar No. 05",
    rt: "003",
    rw: "001",
    agama: "Islam",
    statusPerkawinan: "Belum Kawin",
    shdk: "ANAK",
    pekerjaan: "Pelajar/Mahasiswa",
    namaAyah: "Bambang Hermawan",
    namaIbu: "Dewi Lestari",
  });

  // Format sel sebagai teks
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.getCell("nik").numFmt = "@";
      row.getCell("noKk").numFmt = "@";
      row.getCell("rt").numFmt = "@";
      row.getCell("rw").numFmt = "@";
    }
  });

  const outputPath = path.resolve(process.cwd(), "sample_import_penduduk.xlsx");
  await workbook.xlsx.writeFile(outputPath);
  console.log(`✅ File Excel test sample berhasil dibuat di: ${outputPath}`);
}

generateSampleImportExcel();
