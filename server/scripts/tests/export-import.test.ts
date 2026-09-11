import { TestClient, TestRunner } from "./client.js";
import { assert, assertEqual, assertType } from "./assertions.js";
import { generate16Digits, colors } from "./config.js";
import ExcelJS from "exceljs";

export async function runExportImportTests(client: TestClient, runner: TestRunner) {
  console.log(`\n${colors.bright}7. Export & Import Excel (/api/penduduk & /api/kk)${colors.reset}`);

  await runner.step("GET /api/penduduk/template (Unduh Template Excel)", async () => {
    const res = await client.request("/api/penduduk/template", {
      headers: client.getAuthHeaders(false),
    });

    assertEqual(res.status, 200, "HTTP Status");
    assert(
      res.headers.get("content-type")?.includes("spreadsheetml.sheet") ?? false,
      "Content-Type harus berupa file Excel"
    );
  });

  await runner.step("GET /api/penduduk/export (Export Data Penduduk ke Excel)", async () => {
    const res = await client.request("/api/penduduk/export", {
      headers: client.getAuthHeaders(false),
    });

    assertEqual(res.status, 200, "HTTP Status");
    assert(
      res.headers.get("content-type")?.includes("spreadsheetml.sheet") ?? false,
      "Content-Type harus berupa file Excel"
    );
  });

  await runner.step("GET /api/kk/export (Export Data Kartu Keluarga ke Excel)", async () => {
    const res = await client.request("/api/kk/export", {
      headers: client.getAuthHeaders(false),
    });

    assertEqual(res.status, 200, "HTTP Status");
    assert(
      res.headers.get("content-type")?.includes("spreadsheetml.sheet") ?? false,
      "Content-Type harus berupa file Excel"
    );
  });

  const testNik1 = generate16Digits("3573");
  const testNik2 = generate16Digits("3573");
  const testNoKk = generate16Digits("3573");
  const duplicateNik = generate16Digits("3573");
  const testKkDup = generate16Digits("3573");

  await runner.step("POST /api/penduduk/import (Bulk Upload File Excel)", async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    worksheet.columns = [
      { header: "NIK", key: "nik" },
      { header: "No KK", key: "noKk" },
      { header: "Nama Lengkap", key: "namaLengkap" },
      { header: "Jenis Kelamin", key: "jenisKelamin" },
      { header: "Tempat Lahir", key: "tempatLahir" },
      { header: "Tanggal Lahir", key: "tanggalLahir" },
      { header: "Alamat", key: "alamat" },
      { header: "RT", key: "rt" },
      { header: "RW", key: "rw" },
      { header: "Agama", key: "agama" },
      { header: "Status Perkawinan", key: "statusPerkawinan" },
      { header: "SHDK", key: "shdk" },
      { header: "Pekerjaan", key: "pekerjaan" },
    ];

    worksheet.addRow({
      nik: testNik1,
      noKk: testNoKk,
      namaLengkap: "Import Test Kepala",
      jenisKelamin: "Laki-laki",
      tempatLahir: "Kedungsumur",
      tanggalLahir: "1980-01-01",
      alamat: "Jl. Import Sukses No. 1",
      rt: "001",
      rw: "002",
      agama: "Islam",
      statusPerkawinan: "Kawin",
      shdk: "KEPALA KELUARGA",
      pekerjaan: "PNS",
    });

    worksheet.addRow({
      nik: testNik2,
      noKk: testNoKk,
      namaLengkap: "Import Test Istri",
      jenisKelamin: "Perempuan",
      tempatLahir: "Kedungsumur",
      tanggalLahir: "1985-05-05",
      alamat: "Jl. Import Sukses No. 1",
      rt: "001",
      rw: "002",
      agama: "Islam",
      statusPerkawinan: "Kawin",
      shdk: "ISTRI",
      pekerjaan: "Wiraswasta",
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const formData = new FormData();
    formData.append("file", new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "import.xlsx");

    const res = await client.request("/api/penduduk/import", {
      method: "POST",
      headers: client.getAuthHeaders(false),
      body: formData,
    });

    assertEqual(res.status, 200, "HTTP Status Import");
    assertEqual(res.body.success, true, "import.success");
    assertEqual(res.body.data.berhasil, 2, "2 data berhasil diimport");
  });

  await runner.step("POST /api/penduduk/import (Validasi NIK Duplikat Internal File Excel)", async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");
    worksheet.columns = [
      { header: "NIK", key: "nik" },
      { header: "No KK", key: "noKk" },
      { header: "Nama Lengkap", key: "namaLengkap" },
      { header: "Jenis Kelamin", key: "jenisKelamin" },
      { header: "Tempat Lahir", key: "tempatLahir" },
      { header: "Tanggal Lahir", key: "tanggalLahir" },
      { header: "Alamat", key: "alamat" },
      { header: "RT", key: "rt" },
      { header: "RW", key: "rw" },
    ];

    worksheet.addRow({
      nik: duplicateNik,
      noKk: testKkDup,
      namaLengkap: "Baris Pertama",
      jenisKelamin: "Laki-laki",
      tempatLahir: "Kedungsumur",
      tanggalLahir: "1990-01-01",
      alamat: "Jl. Test Dup",
      rt: "001",
      rw: "001",
    });

    worksheet.addRow({
      nik: duplicateNik,
      noKk: testKkDup,
      namaLengkap: "Baris Kedua Duplikat",
      jenisKelamin: "Laki-laki",
      tempatLahir: "Kedungsumur",
      tanggalLahir: "1990-01-01",
      alamat: "Jl. Test Dup",
      rt: "001",
      rw: "001",
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const formData = new FormData();
    formData.append("file", new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "import_dup.xlsx");

    const res = await client.request("/api/penduduk/import", {
      method: "POST",
      headers: client.getAuthHeaders(false),
      body: formData,
    });

    assertEqual(res.status, 200, "HTTP Status Import Duplikat");
    assertEqual(res.body.data.berhasil, 1, "Hanya 1 baris berhasil diimport");
    assert(res.body.data.errors.length >= 1, "Ada pesan error untuk baris duplikat");
  });

  const testKkExistingNo = generate16Digits("3573");
  const testNikKepalaAsli = generate16Digits("3573");
  const testNikAnakImpor = generate16Digits("3573");
  let testKkExistingId = "";
  let testKepalaAsliId = "";

  await runner.step("POST /api/penduduk/import (Import Anggota ke KK yang Sudah Ada Tidak Boleh Menimpa Kepala Keluarga)", async () => {
    const kkRes = await client.request("/api/kk", {
      method: "POST",
      headers: client.getAuthHeaders(),
      body: JSON.stringify({
        noKk: testKkExistingNo,
        alamat: "Jl. Veteran No. 10",
        rt: "002",
        rw: "003",
        modeKepala: "create",
        newPenduduk: {
          nik: testNikKepalaAsli,
          namaLengkap: "Bapak Kepala Asli",
          tempatLahir: "Kedungsumur",
          tanggalLahir: "1975-03-10",
          jenisKelamin: "Laki-laki",
          agama: "Islam",
          statusPerkawinan: "Kawin",
        },
      }),
    });
    assertEqual(kkRes.status, 201, "POST KK status");
    testKkExistingId = kkRes.body.data.id;
    testKepalaAsliId = kkRes.body.data.kepalaKeluargaId;
    assert(Boolean(testKepalaAsliId), "Kepala keluarga awal harus terdaftar");

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");
    worksheet.columns = [
      { header: "NIK", key: "nik" },
      { header: "No KK", key: "noKk" },
      { header: "Nama Lengkap", key: "namaLengkap" },
      { header: "Jenis Kelamin", key: "jenisKelamin" },
      { header: "Tempat Lahir", key: "tempatLahir" },
      { header: "Tanggal Lahir", key: "tanggalLahir" },
      { header: "Alamat", key: "alamat" },
      { header: "RT", key: "rt" },
      { header: "RW", key: "rw" },
      { header: "SHDK", key: "shdk" },
    ];

    worksheet.addRow({
      nik: testNikAnakImpor,
      noKk: testKkExistingNo,
      namaLengkap: "Anak Kandung Baru",
      jenisKelamin: "Laki-laki",
      tempatLahir: "Kedungsumur",
      tanggalLahir: "2012-07-21",
      alamat: "Jl. Veteran No. 10",
      rt: "002",
      rw: "003",
      shdk: "ANAK",
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const formData = new FormData();
    formData.append("file", new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "import_anak.xlsx");

    const importRes = await client.request("/api/penduduk/import", {
      method: "POST",
      headers: client.getAuthHeaders(false),
      body: formData,
    });
    assertEqual(importRes.status, 200, "HTTP Status Import Anak");
    assertEqual(importRes.body.data.berhasil, 1, "1 baris anak berhasil diimport");

    const detailRes = await client.request(`/api/kk/${testKkExistingId}`, {
      headers: client.getAuthHeaders(false),
    });
    assertEqual(detailRes.status, 200, "GET detail KK status");
    assertEqual(detailRes.body.data.kepalaKeluargaId, testKepalaAsliId, "Kepala keluarga KK tidak boleh tertimpa oleh anak");
    assertEqual(detailRes.body.data.kepalaKeluarga?.namaLengkap, "Bapak Kepala Asli", "Nama kepala keluarga tetap bapak asli");
    assertEqual(detailRes.body.data.jumlahAnggota, 2, "Total anggota keluarga harus menjadi 2");
  });

  const testNikDateObj = generate16Digits("3573");
  const testNikDateStr = generate16Digits("3573");
  const testKkDate = generate16Digits("3573");

  await runner.step("POST /api/penduduk/import (Validasi Tanggal Lahir Presisi Tanpa Pergeseran -1 Hari & Format DD/MM/YYYY)", async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");
    worksheet.columns = [
      { header: "NIK", key: "nik" },
      { header: "No KK", key: "noKk" },
      { header: "Nama Lengkap", key: "namaLengkap" },
      { header: "Jenis Kelamin", key: "jenisKelamin" },
      { header: "Tempat Lahir", key: "tempatLahir" },
      { header: "Tanggal Lahir", key: "tanggalLahir" },
      { header: "Alamat", key: "alamat" },
      { header: "RT", key: "rt" },
      { header: "RW", key: "rw" },
      { header: "SHDK", key: "shdk" },
    ];

    worksheet.addRow({
      nik: testNikDateObj,
      noKk: testKkDate,
      namaLengkap: "Warga Tanggal DateObj",
      jenisKelamin: "Laki-laki",
      tempatLahir: "Kedungsumur",
      tanggalLahir: new Date(1995, 7, 17),
      alamat: "Jl. Merdeka No. 17",
      rt: "001",
      rw: "001",
      shdk: "KEPALA KELUARGA",
    });

    worksheet.addRow({
      nik: testNikDateStr,
      noKk: testKkDate,
      namaLengkap: "Warga Tanggal String DMY",
      jenisKelamin: "Perempuan",
      tempatLahir: "Kedungsumur",
      tanggalLahir: "17/08/1995",
      alamat: "Jl. Merdeka No. 17",
      rt: "001",
      rw: "001",
      shdk: "ISTRI",
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const formData = new FormData();
    formData.append("file", new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "import_dates.xlsx");

    const importRes = await client.request("/api/penduduk/import", {
      method: "POST",
      headers: client.getAuthHeaders(false),
      body: formData,
    });
    assertEqual(importRes.status, 200, "HTTP Status Import Dates");
    assertEqual(importRes.body.data.berhasil, 2, "2 baris berhasil diimport");

    const getRes1 = await client.request(`/api/penduduk?nik=${testNikDateObj}`, {
      headers: client.getAuthHeaders(false),
    });
    assertEqual(getRes1.body?.data?.[0]?.tanggalLahir, "1995-08-17", "Tanggal lahir Date object tidak boleh bergeser ke 1995-08-16");

    const getRes2 = await client.request(`/api/penduduk?nik=${testNikDateStr}`, {
      headers: client.getAuthHeaders(false),
    });
    assertEqual(getRes2.body?.data?.[0]?.tanggalLahir, "1995-08-17", "Tanggal lahir string 17/08/1995 harus dinormalisasi menjadi 1995-08-17");
  });

  const cleanupNik = async (nik: string) => {
    const check = await client.request(`/api/penduduk?nik=${nik}`, {
      headers: client.getAuthHeaders(false),
    });
    if (check.body?.data?.[0]?.id) {
      await client.request(`/api/penduduk/${check.body.data[0].id}`, {
        method: "DELETE",
        headers: client.getAuthHeaders(false),
      });
    }
  };

  const cleanupKk = async (nokk: string) => {
    const check = await client.request(`/api/kk?nokk=${nokk}`, {
      headers: client.getAuthHeaders(false),
    });
    if (check.body?.data?.[0]?.id) {
      await client.request(`/api/kk/${check.body.data[0].id}`, {
        method: "DELETE",
        headers: client.getAuthHeaders(false),
      });
    }
  };

  await cleanupNik(testNik1);
  await cleanupNik(testNik2);
  await cleanupNik(duplicateNik);
  await cleanupNik(testNikKepalaAsli);
  await cleanupNik(testNikAnakImpor);
  await cleanupNik(testNikDateObj);
  await cleanupNik(testNikDateStr);
  await cleanupKk(testNoKk);
  await cleanupKk(testKkDup);
  await cleanupKk(testKkExistingNo);
  await cleanupKk(testKkDate);
}
