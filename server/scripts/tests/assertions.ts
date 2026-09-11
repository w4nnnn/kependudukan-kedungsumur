export class AssertionError extends Error {
  constructor(
    message: string,
    public fieldPath?: string,
    public expected?: any,
    public actual?: any
  ) {
    super(message);
    this.name = "AssertionError";
  }
}

export function assert(condition: boolean, message: string, fieldPath?: string): asserts condition {
  if (!condition) {
    throw new AssertionError(message, fieldPath);
  }
}

export function assertEqual<T>(actual: T, expected: T, fieldDescription: string) {
  if (actual !== expected) {
    throw new AssertionError(
      `${fieldDescription} tidak cocok. Ekspektasi: ${JSON.stringify(expected)}, Diterima: ${JSON.stringify(actual)}`,
      fieldDescription,
      expected,
      actual
    );
  }
}

export function assertType(
  value: any,
  expectedType: "string" | "number" | "boolean" | "object" | "array",
  fieldName: string
) {
  if (expectedType === "array") {
    if (!Array.isArray(value)) {
      throw new AssertionError(
        `Field '${fieldName}' harus bertipe Array, tetapi menerima tipe ${typeof value}`,
        fieldName,
        "Array",
        typeof value
      );
    }
    return;
  }

  if (value === null || value === undefined) {
    throw new AssertionError(
      `Field '${fieldName}' tidak boleh null/undefined (ekspektasi tipe: ${expectedType})`,
      fieldName,
      expectedType,
      value
    );
  }

  const actualType = typeof value;
  if (actualType !== expectedType) {
    throw new AssertionError(
      `Field '${fieldName}' harus bertipe ${expectedType}, tetapi menerima tipe ${actualType} (${JSON.stringify(value)})`,
      fieldName,
      expectedType,
      actualType
    );
  }
}

export function assertUUID(value: any, fieldName: string) {
  assertType(value, "string", fieldName);
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new AssertionError(
      `Field '${fieldName}' bukan format UUID yang valid: "${value}"`,
      fieldName,
      "Valid UUID format",
      value
    );
  }
}

export function assertDateFormat(value: any, fieldName: string) {
  assertType(value, "string", fieldName);
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(value)) {
    throw new AssertionError(
      `Field '${fieldName}' harus berupa format tanggal YYYY-MM-DD, diterima: "${value}"`,
      fieldName,
      "YYYY-MM-DD",
      value
    );
  }
}

export function validatePendudukSchema(item: any, contextName = "data") {
  assertType(item, "object", contextName);
  assertUUID(item.id, `${contextName}.id`);
  assertType(item.nik, "string", `${contextName}.nik`);
  assert(item.nik.length === 16, `Field '${contextName}.nik' harus 16 digit, didapat: ${item.nik.length}`);
  
  assertType(item.noKk, "string", `${contextName}.noKk`);
  assert(item.noKk === "-" || item.noKk.length === 16, `Field '${contextName}.noKk' harus 16 digit atau '-', didapat: ${item.noKk}`);
  
  assertType(item.namaLengkap, "string", `${contextName}.namaLengkap`);
  assertType(item.tempatLahir, "string", `${contextName}.tempatLahir`);
  assertDateFormat(item.tanggalLahir, `${contextName}.tanggalLahir`);
  assertType(item.jenisKelamin, "string", `${contextName}.jenisKelamin`);
  assertType(item.alamat, "string", `${contextName}.alamat`);
  assertType(item.rt, "string", `${contextName}.rt`);
  assertType(item.rw, "string", `${contextName}.rw`);
  assertType(item.agama, "string", `${contextName}.agama`);
  assertType(item.statusPerkawinan, "string", `${contextName}.statusPerkawinan`);
  
  if (item.pekerjaan !== null && item.pekerjaan !== undefined) {
    assertType(item.pekerjaan, "string", `${contextName}.pekerjaan`);
  }

  if (item.foto !== null && item.foto !== undefined) {
    assertType(item.foto, "string", `${contextName}.foto`);
  }

  if (item.fotoUrl !== null && item.fotoUrl !== undefined) {
    assertType(item.fotoUrl, "string", `${contextName}.fotoUrl`);
  }

  if (item.nikHash) {
    assertType(item.nikHash, "string", `${contextName}.nikHash`);
    assert(item.nikHash.length === 64, `Field '${contextName}.nikHash' harus berukuran 64 karakter hash`);
  }
  if (item.noKkHash) {
    assertType(item.noKkHash, "string", `${contextName}.noKkHash`);
    assert(item.noKkHash.length === 64, `Field '${contextName}.noKkHash' harus berukuran 64 karakter hash`);
  }
}

export function validateKartuKeluargaSchema(item: any, contextName = "data") {
  assertType(item, "object", contextName);
  assertUUID(item.id, `${contextName}.id`);
  assertType(item.noKk, "string", `${contextName}.noKk`);
  assert(item.noKk.length === 16, `Field '${contextName}.noKk' harus 16 digit, didapat: ${item.noKk.length}`);
  assertType(item.alamat, "string", `${contextName}.alamat`);
  assertType(item.rt, "string", `${contextName}.rt`);
  assertType(item.rw, "string", `${contextName}.rw`);

  if (item.noKkHash) {
    assertType(item.noKkHash, "string", `${contextName}.noKkHash`);
    assert(item.noKkHash.length === 64, `Field '${contextName}.noKkHash' harus berukuran 64 karakter hash`);
  }

  if (item.kepalaKeluargaId !== null && item.kepalaKeluargaId !== undefined) {
    assertUUID(item.kepalaKeluargaId, `${contextName}.kepalaKeluargaId`);
  }

  if (item.jumlahAnggota !== undefined && item.jumlahAnggota !== null) {
    assertType(item.jumlahAnggota, "number", `${contextName}.jumlahAnggota`);
  }
}

export function validatePaginationMeta(meta: any) {
  assertType(meta, "object", "meta");
  assertType(meta.total, "number", "meta.total");
  assertType(meta.page, "number", "meta.page");
  assertType(meta.limit, "number", "meta.limit");
  assertType(meta.totalPages, "number", "meta.totalPages");
  
  assert(meta.page >= 1, `meta.page harus >= 1, diterima: ${meta.page}`);
  assert(meta.limit >= 1, `meta.limit harus >= 1, diterima: ${meta.limit}`);
  assert(meta.total >= 0, `meta.total harus >= 0, diterima: ${meta.total}`);

  const expectedTotalPages = Math.ceil(meta.total / meta.limit);
  assertEqual(meta.totalPages, expectedTotalPages, "meta.totalPages");
}
