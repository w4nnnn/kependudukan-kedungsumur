import { TestClient, TestRunner } from "./client.js";
import { assert, assertEqual, assertType, validateKartuKeluargaSchema, validatePendudukSchema, validatePaginationMeta } from "./assertions.js";
import { generate16Digits, colors } from "./config.js";

export async function runKKTests(client: TestClient, runner: TestRunner) {
  console.log(`\n${colors.bright}5. Manajemen Kartu Keluarga (CRUD, Anggota & Integrasi)${colors.reset}`);

  const testNoKk = generate16Digits("3573");
  const testNikKepala = generate16Digits("3573");
  const testNikAnggota = generate16Digits("3573");
  const testNikAnggotaBaru = generate16Digits("3573");

  let createdKkId = "";
  let createdKepalaId = "";
  let createdAnggotaId = "";
  let createdAnggotaBaruId = "";

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

  const testNoKkModeCreate = generate16Digits("3573");
  const testNikKepalaModeCreate = generate16Digits("3573");
  let createdKkModeCreateId = "";
  let createdKepalaModeCreateId = "";

  await runner.step("POST /api/kk (Tambah KK Mode 'create' dengan Kepala Keluarga Baru)", async () => {
    const res = await client.request("/api/kk", {
      method: "POST",
      headers: client.getAuthHeaders(),
      body: JSON.stringify({
        noKk: testNoKkModeCreate,
        alamat: "Jl. Melati RT 002 RW 001",
        rt: "002",
        rw: "001",
        dusun: "Dusun Krajan",
        kodePos: "65171",
        modeKepala: "create",
        createKepalaKeluarga: {
          nik: testNikKepalaModeCreate,
          namaLengkap: "Pak Kepala Mode Create Test",
          tempatLahir: "Kedungsumur",
          tanggalLahir: "1985-04-12",
          jenisKelamin: "Laki-laki",
          agama: "Islam",
          statusPerkawinan: "Kawin",
          pekerjaan: "Pedagang",
        },
      }),
    });

    assertEqual(res.status, 201, "HTTP Status");
    assertEqual(res.body.success, true, "response.success");
    assert(Boolean(res.body.data.kepalaKeluargaId), "data.kepalaKeluargaId harus terisi");
    createdKkModeCreateId = res.body.data.id;
    createdKepalaModeCreateId = res.body.data.kepalaKeluargaId;

    const detailRes = await client.request(`/api/kk/${createdKkModeCreateId}`, {
      headers: client.getAuthHeaders(false),
    });
    assertEqual(detailRes.status, 200, "GET detail status");
    assert(Boolean(detailRes.body.data.kepalaKeluarga), "detail data.kepalaKeluarga harus ada");
    assertEqual(detailRes.body.data.kepalaKeluarga.nik, testNikKepalaModeCreate, "NIK kepala keluarga cocok");
    assertEqual(detailRes.body.data.kepalaKeluarga.namaLengkap, "Pak Kepala Mode Create Test", "Nama kepala cocok");
    assertEqual(detailRes.body.data.jumlahAnggota, 1, "jumlahAnggota harus 1");
  });

  const testNoKkModeSelect = generate16Digits("3573");
  const testNikKepalaModeSelect = generate16Digits("3573");
  let createdKkModeSelectId = "";
  let createdKepalaModeSelectId = "";

  await runner.step("POST /api/kk (Tambah KK Mode 'select' dengan Penduduk Terdaftar)", async () => {
    const pendRes = await client.request("/api/penduduk", {
      method: "POST",
      headers: client.getAuthHeaders(),
      body: JSON.stringify({
        nik: testNikKepalaModeSelect,
        noKk: testNoKkModeSelect,
        namaLengkap: "Pak Kepala Mode Select Test",
        tempatLahir: "Kedungsumur",
        tanggalLahir: "1978-08-17",
        jenisKelamin: "Laki-laki",
        alamat: "Jl. Mawar RT 001 RW 002",
        rt: "001",
        rw: "002",
        agama: "Islam",
        statusPerkawinan: "Kawin",
        shdk: "LAINNYA",
      }),
    });
    assertEqual(pendRes.status, 201, "POST penduduk pre-select status");
    createdKepalaModeSelectId = pendRes.body.data.id;

    const res = await client.request("/api/kk", {
      method: "POST",
      headers: client.getAuthHeaders(),
      body: JSON.stringify({
        noKk: testNoKkModeSelect,
        alamat: "Jl. Mawar RT 001 RW 002",
        rt: "001",
        rw: "002",
        dusun: "Dusun Krajan",
        kodePos: "65171",
        modeKepala: "select",
        selectedPendudukId: createdKepalaModeSelectId,
      }),
    });

    assertEqual(res.status, 201, "HTTP Status");
    assertEqual(res.body.success, true, "response.success");
    assertEqual(res.body.data.kepalaKeluargaId, createdKepalaModeSelectId, "kepalaKeluargaId cocok");
    createdKkModeSelectId = res.body.data.id;

    const detailRes = await client.request(`/api/kk/${createdKkModeSelectId}`, {
      headers: client.getAuthHeaders(false),
    });
    assertEqual(detailRes.status, 200, "GET detail status");
    assert(Boolean(detailRes.body.data.kepalaKeluarga), "detail data.kepalaKeluarga harus ada");
    assertEqual(detailRes.body.data.kepalaKeluarga.id, createdKepalaModeSelectId, "ID kepala cocok");
    assertEqual(detailRes.body.data.kepalaKeluarga.shdk, "KEPALA KELUARGA", "SHDK kepala cocok");
    assertEqual(detailRes.body.data.jumlahAnggota, 1, "jumlahAnggota harus 1");

    const residentRes = await client.request(`/api/penduduk/${createdKepalaModeSelectId}`, {
      headers: client.getAuthHeaders(false),
    });
    assertEqual(residentRes.body.data.kartuKeluargaId, createdKkModeSelectId, "kartuKeluargaId penduduk sinkron");
    assertEqual(residentRes.body.data.shdk, "KEPALA KELUARGA", "shdk penduduk sinkron");
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

  await runner.step("GET /api/kk?search=... (Pencarian Nama Kepala Keluarga)", async () => {
    const res = await client.request(`/api/kk?search=Kepala%20Keluarga%20Test`, {
      headers: client.getAuthHeaders(false),
    });

    assertEqual(res.status, 200, "HTTP Status");
    assertEqual(res.body.success, true, "response.success");
    assert(res.body.data.length >= 1, "Menemukan KK berdasarkan nama kepala keluarga");
    validatePaginationMeta(res.body.meta);
    assert(res.body.meta.total >= 1, "Meta total merefleksikan pencarian");
    const found = res.body.data.find((item: any) => item.id === createdKkId);
    assert(found !== undefined, "KK yang dicari harus ditemukan");
  });

  await runner.step("GET /api/kk?search=... (Pencarian Nomor KK 16 Digit)", async () => {
    const res = await client.request(`/api/kk?search=${dummyKk.noKk}`, {
      headers: client.getAuthHeaders(false),
    });

    assertEqual(res.status, 200, "HTTP Status");
    assertEqual(res.body.success, true, "response.success");
    assertEqual(res.body.data.length, 1, "Menemukan tepat 1 KK berdasarkan nomor KK");
    validatePaginationMeta(res.body.meta);
    assertEqual(res.body.meta.total, 1, "Meta total tepat 1");
    assertEqual(res.body.data[0].id, createdKkId, "ID KK cocok");
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

  await runner.step("PUT /api/kk/:id (Validasi No KK Tidak 16 Digit -> Expect 400)", async () => {
    const res = await client.request(`/api/kk/${createdKkId}`, {
      method: "PUT",
      headers: client.getAuthHeaders(),
      body: JSON.stringify({ noKk: "12345" }),
    });

    assertEqual(res.status, 400, "HTTP Status invalid noKk");
    assertEqual(res.body.success, false, "response.success false");
    assertEqual(res.body.message, "Nomor KK harus 16 digit angka.", "response.message");
  });

  await runner.step("POST /api/kk/:id/anggota (Tambah Anggota Baru Mode 'create')", async () => {
    const res = await client.request(`/api/kk/${createdKkId}/anggota`, {
      method: "POST",
      headers: client.getAuthHeaders(),
      body: JSON.stringify({
        mode: "create",
        shdk: "ANAK",
        urutanKk: "3",
        penduduk: {
          nik: testNikAnggotaBaru,
          namaLengkap: "Anak Kedua Test Mode Create",
          tempatLahir: "Kedungsumur",
          tanggalLahir: "2015-08-20",
          jenisKelamin: "Laki-laki",
          agama: "Islam",
          statusPerkawinan: "Belum Kawin",
          pekerjaan: "Pelajar",
        },
      }),
    });

    assertEqual(res.status, 201, "HTTP Status");
    assertEqual(res.body.success, true, "response.success");
    assert(res.body.data !== undefined, "response.data harus ada");
    assertEqual(res.body.data.nik, testNikAnggotaBaru, "data.nik sesuai");
    createdAnggotaBaruId = res.body.data.id;
  });

  await runner.step("POST /api/kk/:id/anggota (Validasi NIK Duplikat Mode 'create' -> Expect 400)", async () => {
    const res = await client.request(`/api/kk/${createdKkId}/anggota`, {
      method: "POST",
      headers: client.getAuthHeaders(),
      body: JSON.stringify({
        mode: "create",
        shdk: "ANAK",
        penduduk: {
          nik: testNikAnggotaBaru,
          namaLengkap: "Duplikat NIK",
          tempatLahir: "Kedungsumur",
          tanggalLahir: "2015-08-20",
          jenisKelamin: "Laki-laki",
          agama: "Islam",
          statusPerkawinan: "Belum Kawin",
        },
      }),
    });

    assertEqual(res.status, 400, "HTTP Status");
    assertEqual(res.body.success, false, "response.success");
  });

  await runner.step("POST /api/kk/:id/anggota (Promosi Kepala Keluarga Baru Menurunkan Kepala Keluarga Lama)", async () => {
    const promoteRes = await client.request(`/api/kk/${createdKkId}/anggota`, {
      method: "POST",
      headers: client.getAuthHeaders(),
      body: JSON.stringify({
        mode: "select",
        pendudukId: createdAnggotaId,
        shdk: "KEPALA KELUARGA",
      }),
    });

    assertEqual(promoteRes.status, 200, "Promote anggota status");

    const kkDetailRes = await client.request(`/api/kk/${createdKkId}`, {
      headers: client.getAuthHeaders(false),
    });
    assertEqual(kkDetailRes.body.data.kepalaKeluargaId, createdAnggotaId, "kepalaKeluargaId berpindah ke anggota baru");

    const oldKepalaRes = await client.request(`/api/penduduk/${createdKepalaId}`, {
      headers: client.getAuthHeaders(false),
    });
    assertEqual(oldKepalaRes.body.data.shdk, "ANGGOTA KELUARGA", "Kepala lama diturunkan menjadi ANGGOTA KELUARGA");

    await client.request(`/api/kk/${createdKkId}/anggota`, {
      method: "POST",
      headers: client.getAuthHeaders(),
      body: JSON.stringify({
        mode: "select",
        pendudukId: createdKepalaId,
        shdk: "KEPALA KELUARGA",
      }),
    });

    await client.request(`/api/kk/${createdKkId}/anggota`, {
      method: "POST",
      headers: client.getAuthHeaders(),
      body: JSON.stringify({
        mode: "select",
        pendudukId: createdAnggotaId,
        shdk: "ANAK",
      }),
    });
  });

  await runner.step("DELETE /api/kk/:id/anggota/:pendudukId (Keluarkan Anggota dari KK)", async () => {
    const res = await client.request(`/api/kk/${createdKkId}/anggota/${createdAnggotaId}`, {
      method: "DELETE",
      headers: client.getAuthHeaders(false),
    });

    assertEqual(res.status, 200, "HTTP Status");
    assertEqual(res.body.success, true, "response.success");

    const res2 = await client.request(`/api/kk/${createdKkId}/anggota/${createdAnggotaBaruId}`, {
      method: "DELETE",
      headers: client.getAuthHeaders(false),
    });

    assertEqual(res2.status, 200, "HTTP Status");
    assertEqual(res2.body.success, true, "response.success");

    const detailRes = await client.request(`/api/kk/${createdKkId}`, {
      headers: client.getAuthHeaders(false),
    });
    assertEqual(detailRes.body.data.jumlahAnggota, 1, "jumlah anggota berkurang menjadi 1");

    const removedPendudukRes = await client.request(`/api/penduduk/${createdAnggotaId}`, {
      headers: client.getAuthHeaders(false),
    });
    assertEqual(removedPendudukRes.body.data.kartuKeluargaId, null, "kartuKeluargaId null");
    assertEqual(removedPendudukRes.body.data.noKk, "-", "noKk harus direset ke '-' setelah dikeluarkan dari KK");

    const searchOldKkRes = await client.request(`/api/penduduk?nokk=${testNoKk}`, {
      headers: client.getAuthHeaders(false),
    });
    const foundOldMember = searchOldKkRes.body.data.some((p: any) => p.id === createdAnggotaId);
    assertEqual(foundOldMember, false, "Anggota yang dikeluarkan tidak boleh muncul saat mencari No KK lama");
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
  if (createdAnggotaBaruId) {
    await client.request(`/api/penduduk/${createdAnggotaBaruId}`, {
      method: "DELETE",
      headers: client.getAuthHeaders(false),
    });
  }
  if (createdKkModeCreateId) {
    await client.request(`/api/kk/${createdKkModeCreateId}`, {
      method: "DELETE",
      headers: client.getAuthHeaders(false),
    });
  }
  if (createdKepalaModeCreateId) {
    await client.request(`/api/penduduk/${createdKepalaModeCreateId}`, {
      method: "DELETE",
      headers: client.getAuthHeaders(false),
    });
  }
  if (createdKkModeSelectId) {
    await client.request(`/api/kk/${createdKkModeSelectId}`, {
      method: "DELETE",
      headers: client.getAuthHeaders(false),
    });
  }
  if (createdKepalaModeSelectId) {
    await client.request(`/api/penduduk/${createdKepalaModeSelectId}`, {
      method: "DELETE",
      headers: client.getAuthHeaders(false),
    });
  }
}
