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
}
