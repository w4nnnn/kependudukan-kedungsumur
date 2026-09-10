import { TestClient, TestRunner } from "./client.js";
import { assert, assertEqual, assertType, validatePendudukSchema, validatePaginationMeta } from "./assertions.js";
import { generate16Digits, colors } from "./config.js";

export async function runPendudukTests(client: TestClient, runner: TestRunner) {
  console.log(`\n${colors.bright}4. Manajemen Data Penduduk (CRUD & Keamanan Data)${colors.reset}`);

  const testNik = generate16Digits("3573");
  const testNoKk = generate16Digits("3573");
  let createdPendudukId = "";

  const dummyPenduduk = {
    nik: testNik,
    noKk: testNoKk,
    namaLengkap: "Budi Santoso Automated Test",
    tempatLahir: "Kedungsumur",
    tanggalLahir: "1995-08-17",
    jenisKelamin: "Laki-laki",
    alamat: "Jl. Merdeka No. 45",
    rt: "001",
    rw: "002",
    agama: "Islam",
    statusPerkawinan: "Kawin",
    pekerjaan: "Software Engineer",
  };

  await runner.step("POST /api/penduduk (Tambah Penduduk & Validasi Response Schema)", async () => {
    const res = await client.request("/api/penduduk", {
      method: "POST",
      headers: client.getAuthHeaders(),
      body: JSON.stringify(dummyPenduduk),
    });

    assertEqual(res.status, 201, "HTTP Status");
    assertType(res.body, "object", "insert response");
    assertEqual(res.body.success, true, "response.success");
    assertType(res.body.message, "string", "response.message");
    
    validatePendudukSchema(res.body.data, "response.data");
    assertEqual(res.body.data.nik, dummyPenduduk.nik, "data.nik (auto-decrypted)");
    assertEqual(res.body.data.noKk, dummyPenduduk.noKk, "data.noKk (auto-decrypted)");
    assertEqual(res.body.data.namaLengkap, dummyPenduduk.namaLengkap, "data.namaLengkap");
    assertEqual(res.body.data.pekerjaan, dummyPenduduk.pekerjaan, "data.pekerjaan");

    createdPendudukId = res.body.data.id;
  });

  await runner.step("POST /api/penduduk (Validasi NIK Duplikat -> Expect 400 & Error Schema)", async () => {
    const res = await client.request("/api/penduduk", {
      method: "POST",
      headers: client.getAuthHeaders(),
      body: JSON.stringify(dummyPenduduk),
    });

    assertEqual(res.status, 400, "HTTP Status");
    assertType(res.body, "object", "error response");
    assertEqual(res.body.success, false, "response.success");
    assertType(res.body.message, "string", "response.message");
    assertEqual(res.body.message, "NIK sudah terdaftar.", "response.message");
  });

  await runner.step("GET /api/penduduk/:id (Detail Penduduk & Validasi Dekripsi Otomatis)", async () => {
    const res = await client.request(`/api/penduduk/${createdPendudukId}`, {
      headers: client.getAuthHeaders(false),
    });

    assertEqual(res.status, 200, "HTTP Status");
    assertType(res.body, "object", "detail response");
    assertEqual(res.body.success, true, "response.success");
    
    validatePendudukSchema(res.body.data, "response.data");
    assertEqual(res.body.data.id, createdPendudukId, "data.id");
    assertEqual(res.body.data.nik, dummyPenduduk.nik, "data.nik (dekripsi cocok)");
    assertEqual(res.body.data.noKk, dummyPenduduk.noKk, "data.noKk (dekripsi cocok)");
    assertEqual(res.body.data.namaLengkap, dummyPenduduk.namaLengkap, "data.namaLengkap");
    assertEqual(res.body.data.tempatLahir, dummyPenduduk.tempatLahir, "data.tempatLahir");
    assertEqual(res.body.data.tanggalLahir, dummyPenduduk.tanggalLahir, "data.tanggalLahir");
    assertEqual(res.body.data.alamat, dummyPenduduk.alamat, "data.alamat");
  });

  await runner.step("GET /api/penduduk/:id (ID Tidak Ditemukan -> Expect 404 & Error Schema)", async () => {
    const nonExistentId = "ffffffff-ffff-ffff-ffff-ffffffffffff";
    const res = await client.request(`/api/penduduk/${nonExistentId}`, {
      headers: client.getAuthHeaders(false),
    });

    assertEqual(res.status, 404, "HTTP Status");
    assertType(res.body, "object", "not found response");
    assertEqual(res.body.success, false, "response.success");
    assertEqual(res.body.message, "Data penduduk tidak ditemukan.", "response.message");
  });

  await runner.step("GET /api/penduduk (Pencarian, Filter Hash & Struktur Pagination Meta)", async () => {
    const searchRes = await client.request("/api/penduduk?search=Automated Test", {
      headers: client.getAuthHeaders(false),
    });
    assertEqual(searchRes.status, 200, "HTTP Status Search");
    assertEqual(searchRes.body.success, true, "search.success");
    assertType(searchRes.body.data, "array", "search.data");
    assert(searchRes.body.data.length >= 1, "Hasil pencarian nama minimal ada 1 data");
    validatePaginationMeta(searchRes.body.meta);

    for (const item of searchRes.body.data) {
      validatePendudukSchema(item, "searchItem");
      assert(
        item.namaLengkap.toLowerCase().includes("automated test"),
        `Nama '${item.namaLengkap}' tidak mengandung kata kunci pencarian`
      );
    }

    const nikRes = await client.request(`/api/penduduk?nik=${dummyPenduduk.nik}`, {
      headers: client.getAuthHeaders(false),
    });
    assertEqual(nikRes.status, 200, "HTTP Status NIK Search");
    assertType(nikRes.body.data, "array", "nikRes.data");
    assertEqual(nikRes.body.data.length, 1, "Hasil pencarian exact NIK harus tepat 1");
    assertEqual(nikRes.body.data[0].nik, dummyPenduduk.nik, "nik data[0]");
    assertEqual(nikRes.body.data[0].id, createdPendudukId, "id data[0]");

    const kkRes = await client.request(`/api/penduduk?nokk=${dummyPenduduk.noKk}`, {
      headers: client.getAuthHeaders(false),
    });
    assertEqual(kkRes.status, 200, "HTTP Status No KK Search");
    assertType(kkRes.body.data, "array", "kkRes.data");
    assert(kkRes.body.data.length >= 1, "Pencarian No KK minimal menemukan 1 orang");
    assertEqual(kkRes.body.data[0].noKk, dummyPenduduk.noKk, "noKk data[0]");
  });

  await runner.step("PUT /api/penduduk/:id (Update Partial & Validasi Schema Response)", async () => {
    const updatedPayload = {
      pekerjaan: "Principal Engineer Kedungsumur",
      statusPerkawinan: "Cerai Hidup",
      rt: "005",
    };

    const res = await client.request(`/api/penduduk/${createdPendudukId}`, {
      method: "PUT",
      headers: client.getAuthHeaders(),
      body: JSON.stringify(updatedPayload),
    });

    assertEqual(res.status, 200, "HTTP Status");
    assertType(res.body, "object", "update response");
    assertEqual(res.body.success, true, "response.success");
    assertEqual(res.body.message, "Data penduduk berhasil diperbarui.", "response.message");
    
    validatePendudukSchema(res.body.data, "response.data");
    assertEqual(res.body.data.pekerjaan, updatedPayload.pekerjaan, "data.pekerjaan (terupdate)");
    assertEqual(res.body.data.statusPerkawinan, updatedPayload.statusPerkawinan, "data.statusPerkawinan (terupdate)");
    assertEqual(res.body.data.rt, updatedPayload.rt, "data.rt (terupdate)");
    assertEqual(res.body.data.namaLengkap, dummyPenduduk.namaLengkap, "data.namaLengkap (tidak berubah)");
    assertEqual(res.body.data.nik, dummyPenduduk.nik, "data.nik (tidak berubah)");
  });

  await runner.step("POST /api/penduduk/:id/foto (Upload Foto Penduduk)", async () => {
    const fakeImageBuffer = Buffer.from("GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;");
    const formData = new FormData();
    formData.append("file", new Blob([fakeImageBuffer], { type: "image/png" }), "pasfoto.png");

    const authHeaders = client.getAuthHeaders(false);
    const res = await client.request(`/api/penduduk/${createdPendudukId}/foto`, {
      method: "POST",
      headers: authHeaders,
      body: formData,
    });

    assertEqual(res.status, 200, "HTTP Status Upload Foto");
    assertEqual(res.body.success, true, "upload.success");
    assertEqual(res.body.message, "Foto penduduk berhasil diunggah.", "upload.message");
    assertType(res.body.data.foto, "string", "data.foto key");
    assertType(res.body.data.fotoUrl, "string", "data.fotoUrl");
    assert(res.body.data.fotoUrl.includes(res.body.data.foto), "fotoUrl harus memuat foto key");
  });

  await runner.step("DELETE /api/penduduk/:id/foto (Hapus Foto Penduduk)", async () => {
    const res = await client.request(`/api/penduduk/${createdPendudukId}/foto`, {
      method: "DELETE",
      headers: client.getAuthHeaders(false),
    });

    assertEqual(res.status, 200, "HTTP Status Delete Foto");
    assertEqual(res.body.success, true, "deleteFoto.success");
    assertEqual(res.body.data.foto, null, "data.foto null");
    assertEqual(res.body.data.fotoUrl, null, "data.fotoUrl null");
  });

  await runner.step("PUT /api/penduduk/:id (Update ID Tidak Ada -> Expect 404)", async () => {
    const nonExistentId = "ffffffff-ffff-ffff-ffff-ffffffffffff";
    const res = await client.request(`/api/penduduk/${nonExistentId}`, {
      method: "PUT",
      headers: client.getAuthHeaders(),
      body: JSON.stringify({ pekerjaan: "Testing" }),
    });

    assertEqual(res.status, 404, "HTTP Status");
    assertEqual(res.body.success, false, "response.success");
    assertEqual(res.body.message, "Data penduduk tidak ditemukan.", "response.message");
  });

  await runner.step("DELETE /api/penduduk/:id (Hapus Penduduk & Validasi Response Schema)", async () => {
    const res = await client.request(`/api/penduduk/${createdPendudukId}`, {
      method: "DELETE",
      headers: client.getAuthHeaders(false),
    });

    assertEqual(res.status, 200, "HTTP Status");
    assertType(res.body, "object", "delete response");
    assertEqual(res.body.success, true, "response.success");
    assertEqual(res.body.message, "Data penduduk berhasil dihapus.", "response.message");
  });

  await runner.step("GET /api/penduduk/:id setelah dihapus (Expect 404 & Error Schema)", async () => {
    const res = await client.request(`/api/penduduk/${createdPendudukId}`, {
      headers: client.getAuthHeaders(false),
    });

    assertEqual(res.status, 404, "HTTP Status");
    assertEqual(res.body.success, false, "response.success");
    assertEqual(res.body.message, "Data penduduk tidak ditemukan.", "response.message");
  });

  await runner.step("DELETE /api/penduduk/:id dengan ID acak (Expect 404 & Error Schema)", async () => {
    const randomUuid = "00000000-0000-0000-0000-000000000000";
    const res = await client.request(`/api/penduduk/${randomUuid}`, {
      method: "DELETE",
      headers: client.getAuthHeaders(false),
    });

    assertEqual(res.status, 404, "HTTP Status");
    assertEqual(res.body.success, false, "response.success");
    assertEqual(res.body.message, "Data penduduk tidak ditemukan.", "response.message");
  });

  const testKkForDeleteNo = generate16Digits("3573");
  const testNikKepalaToDelete = generate16Digits("3573");
  let testKkForDeleteId = "";
  let testKepalaToDeleteId = "";

  await runner.step("DELETE /api/penduduk/:id (Hapus Penduduk yang Berstatus Kepala Keluarga Harus Mengosongkan kepalaKeluargaId pada KK)", async () => {
    const kkRes = await client.request("/api/kk", {
      method: "POST",
      headers: client.getAuthHeaders(),
      body: JSON.stringify({
        noKk: testKkForDeleteNo,
        alamat: "Jl. Sukarno Hatta No. 8",
        rt: "001",
        rw: "001",
        modeKepala: "create",
        newPenduduk: {
          nik: testNikKepalaToDelete,
          namaLengkap: "Bapak Akan Dihapus",
          tempatLahir: "Kedungsumur",
          tanggalLahir: "1970-01-01",
          jenisKelamin: "Laki-laki",
          agama: "Islam",
          statusPerkawinan: "Kawin",
        },
      }),
    });
    assertEqual(kkRes.status, 201, "POST KK status");
    testKkForDeleteId = kkRes.body.data.id;
    testKepalaToDeleteId = kkRes.body.data.kepalaKeluargaId;
    assert(Boolean(testKepalaToDeleteId), "Kepala keluarga harus terbentuk");

    const delRes = await client.request(`/api/penduduk/${testKepalaToDeleteId}`, {
      method: "DELETE",
      headers: client.getAuthHeaders(false),
    });
    assertEqual(delRes.status, 200, "DELETE penduduk status");
    assertEqual(delRes.body.success, true, "DELETE penduduk success");

    const kkDetailRes = await client.request(`/api/kk/${testKkForDeleteId}`, {
      headers: client.getAuthHeaders(false),
    });
    assertEqual(kkDetailRes.status, 200, "GET KK detail status");
    assertEqual(kkDetailRes.body.data.kepalaKeluargaId, null, "kepalaKeluargaId pada KK harus menjadi null");
    assertEqual(kkDetailRes.body.data.kepalaKeluarga, null, "kepalaKeluarga detail harus null");

    await client.request(`/api/kk/${testKkForDeleteId}`, {
      method: "DELETE",
      headers: client.getAuthHeaders(false),
    });
  });
}
