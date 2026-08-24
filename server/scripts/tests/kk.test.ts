import { TestClient, TestRunner } from "./client.js";
import { assert, assertEqual, assertType, validateKartuKeluargaSchema, validatePendudukSchema, validatePaginationMeta } from "./assertions.js";
import { generate16Digits, colors } from "./config.js";

export async function runKKTests(client: TestClient, runner: TestRunner) {
  console.log(`\n${colors.bright}5. Manajemen Kartu Keluarga (CRUD, Anggota & Integrasi)${colors.reset}`);

  const testNoKk = generate16Digits("3573");
  const testNikKepala = generate16Digits("3573");
  const testNikAnggota = generate16Digits("3573");

  let createdKkId = "";
  let createdKepalaId = "";
  let createdAnggotaId = "";

  const dummyKk = {
    noKk: testNoKk,
    alamat: "Jl. Diponegoro RT 003 RW 002",
    rt: "003",
    rw: "002",
    dusun: "Dusun Krajan",
    kodePos: "65171",
    tanggalDikeluarkan: "2023-05-10",
  };

  await runner.step("POST /api/kk (Tambah Kartu Keluarga Baru)", async () => {
    const res = await client.request("/api/kk", {
      method: "POST",
      headers: client.getAuthHeaders(),
      body: JSON.stringify(dummyKk),
    });

    assertEqual(res.status, 201, "HTTP Status");
    assertEqual(res.body.success, true, "response.success");
    assertEqual(res.body.message, "Data Kartu Keluarga berhasil ditambahkan.", "response.message");
    validateKartuKeluargaSchema(res.body.data, "response.data");
    assertEqual(res.body.data.noKk, dummyKk.noKk, "data.noKk (dekripsi cocok)");
    assertEqual(res.body.data.alamat, dummyKk.alamat, "data.alamat");

    createdKkId = res.body.data.id;
  });

  await runner.step("POST /api/kk (Validasi No KK Duplikat -> Expect 400)", async () => {
    const res = await client.request("/api/kk", {
      method: "POST",
      headers: client.getAuthHeaders(),
      body: JSON.stringify(dummyKk),
    });

    assertEqual(res.status, 400, "HTTP Status");
    assertEqual(res.body.success, false, "response.success");
    assertEqual(res.body.message, "Nomor KK sudah terdaftar.", "response.message");
  });

  await runner.step("POST /api/penduduk (Tambah Penduduk sebagai Kepala Keluarga)", async () => {
    const res = await client.request("/api/penduduk", {
      method: "POST",
      headers: client.getAuthHeaders(),
      body: JSON.stringify({
        nik: testNikKepala,
        noKk: testNoKk,
        kartuKeluargaId: createdKkId,
        namaLengkap: "Pak Kepala Keluarga Test",
        tempatLahir: "Kedungsumur",
        tanggalLahir: "1980-01-01",
        jenisKelamin: "Laki-laki",
        alamat: dummyKk.alamat,
        rt: dummyKk.rt,
        rw: dummyKk.rw,
        agama: "Islam",
        statusPerkawinan: "Kawin",
        shdk: "KEPALA KELUARGA",
        urutanKk: "1",
        pekerjaan: "Wiraswasta",
      }),
    });

    assertEqual(res.status, 201, "HTTP Status");
    createdKepalaId = res.body.data.id;
  });

  await runner.step("POST /api/penduduk (Tambah Penduduk sebagai Anggota Keluarga)", async () => {
    const res = await client.request("/api/penduduk", {
      method: "POST",
      headers: client.getAuthHeaders(),
      body: JSON.stringify({
        nik: testNikAnggota,
        noKk: testNoKk,
        kartuKeluargaId: createdKkId,
        namaLengkap: "Anak Pertama Test",
        tempatLahir: "Kedungsumur",
        tanggalLahir: "2010-06-15",
        jenisKelamin: "Perempuan",
        alamat: dummyKk.alamat,
        rt: dummyKk.rt,
        rw: dummyKk.rw,
        agama: "Islam",
        statusPerkawinan: "Belum Kawin",
        shdk: "ANAK",
        urutanKk: "2",
        namaAyah: "Pak Kepala Keluarga Test",
        namaIbu: "Ibu Test",
      }),
    });

    assertEqual(res.status, 201, "HTTP Status");
    createdAnggotaId = res.body.data.id;
  });

  await runner.step("GET /api/kk/:id (Detail KK Lengkap & Daftar Anggota)", async () => {
    const res = await client.request(`/api/kk/${createdKkId}`, {
      headers: client.getAuthHeaders(false),
    });

    assertEqual(res.status, 200, "HTTP Status");
    assertEqual(res.body.success, true, "response.success");
    validateKartuKeluargaSchema(res.body.data, "response.data");
    assertEqual(res.body.data.id, createdKkId, "data.id");
    assertEqual(res.body.data.jumlahAnggota, 2, "data.jumlahAnggota");
    assertType(res.body.data.anggota, "array", "data.anggota");
    assertEqual(res.body.data.anggota.length, 2, "anggota.length");

    const kepala = res.body.data.kepalaKeluarga;
    assertType(kepala, "object", "data.kepalaKeluarga");
    assertEqual(kepala.id, createdKepalaId, "kepala.id");
  });

  await runner.step("GET /api/kk (List KK dengan Query & Filter RT/RW)", async () => {
    const res = await client.request(`/api/kk?rt=${dummyKk.rt}&rw=${dummyKk.rw}`, {
      headers: client.getAuthHeaders(false),
    });

    assertEqual(res.status, 200, "HTTP Status");
    assertEqual(res.body.success, true, "response.success");
    assertType(res.body.data, "array", "response.data");
    assert(res.body.data.length >= 1, "Minimal menemukan 1 KK di RT/RW tersebut");
    validatePaginationMeta(res.body.meta);

    const found = res.body.data.find((item: any) => item.id === createdKkId);
    assert(found !== undefined, "KK yang baru dibuat harus ada di list");
    assertEqual(found.noKk, dummyKk.noKk, "found.noKk");
  });

  await runner.step("PUT /api/kk/:id (Update Alamat KK & Sinkronisasi ke Anggota)", async () => {
    const updatePayload = {
      alamat: "Jl. Diponegoro No. 99 Barokah",
      rt: "004",
      rw: "002",
    };

    const res = await client.request(`/api/kk/${createdKkId}`, {
      method: "PUT",
      headers: client.getAuthHeaders(),
      body: JSON.stringify(updatePayload),
    });

    assertEqual(res.status, 200, "HTTP Status");
    assertEqual(res.body.success, true, "response.success");
    assertEqual(res.body.data.alamat, updatePayload.alamat, "data.alamat terupdate");
    assertEqual(res.body.data.rt, updatePayload.rt, "data.rt terupdate");

    const checkPenduduk = await client.request(`/api/penduduk/${createdAnggotaId}`, {
      headers: client.getAuthHeaders(false),
    });
    assertEqual(checkPenduduk.body.data.alamat, updatePayload.alamat, "alamat anggota tersinkron");
    assertEqual(checkPenduduk.body.data.rt, updatePayload.rt, "rt anggota tersinkron");
  });

  await runner.step("DELETE /api/kk/:id/anggota/:pendudukId (Keluarkan Anggota dari KK)", async () => {
    const res = await client.request(`/api/kk/${createdKkId}/anggota/${createdAnggotaId}`, {
      method: "DELETE",
      headers: client.getAuthHeaders(false),
    });

    assertEqual(res.status, 200, "HTTP Status");
    assertEqual(res.body.success, true, "response.success");

    const detailRes = await client.request(`/api/kk/${createdKkId}`, {
      headers: client.getAuthHeaders(false),
    });
    assertEqual(detailRes.body.data.jumlahAnggota, 1, "jumlah anggota berkurang menjadi 1");
  });

  await runner.step("DELETE /api/kk/:id (Hapus Kartu Keluarga)", async () => {
    const res = await client.request(`/api/kk/${createdKkId}`, {
      method: "DELETE",
      headers: client.getAuthHeaders(false),
    });

    assertEqual(res.status, 200, "HTTP Status");
    assertEqual(res.body.success, true, "response.success");
    assertEqual(res.body.message, "Data Kartu Keluarga berhasil dihapus.", "response.message");

    const getRes = await client.request(`/api/kk/${createdKkId}`, {
      headers: client.getAuthHeaders(false),
    });
    assertEqual(getRes.status, 404, "HTTP Status setelah hapus");
  });

  await client.request(`/api/penduduk/${createdKepalaId}`, {
    method: "DELETE",
    headers: client.getAuthHeaders(false),
  });
  await client.request(`/api/penduduk/${createdAnggotaId}`, {
    method: "DELETE",
    headers: client.getAuthHeaders(false),
  });
}
