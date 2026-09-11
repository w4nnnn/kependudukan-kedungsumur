import type { FastifyInstance } from "fastify";
import ExcelJS from "exceljs";
import { db } from "../db/index.js";
import { pendudukTable, kartuKeluargaTable, hashKependudukan } from "../db/schema/schema.js";
import { eq, and, asc, sql, inArray, ilike } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";
import { parseExcelDate } from "../lib/date-utils.js";

export default async function exportImportRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", requireAuth);

  // 1. GET /api/penduduk/template (Unduh Template Excel Resmi untuk Input/Import Data)
  fastify.get("/api/penduduk/template", async (request, reply) => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Template Penduduk");

      worksheet.columns = [
        { header: "NIK (16 Digit)*", key: "nik", width: 22 },
        { header: "No KK (16 Digit)*", key: "noKk", width: 22 },
        { header: "Nama Lengkap*", key: "namaLengkap", width: 28 },
        { header: "Jenis Kelamin (Laki-laki/Perempuan)*", key: "jenisKelamin", width: 20 },
        { header: "Tempat Lahir*", key: "tempatLahir", width: 18 },
        { header: "Tanggal Lahir (YYYY-MM-DD)*", key: "tanggalLahir", width: 20 },
        { header: "Alamat*", key: "alamat", width: 28 },
        { header: "RT (3 Digit)*", key: "rt", width: 12 },
        { header: "RW (3 Digit)*", key: "rw", width: 12 },
        { header: "Agama*", key: "agama", width: 15 },
        { header: "Status Perkawinan*", key: "statusPerkawinan", width: 20 },
        { header: "SHDK (Status Hubungan Keluarga)*", key: "shdk", width: 24 },
        { header: "Pekerjaan", key: "pekerjaan", width: 20 },
        { header: "Nama Ayah", key: "namaAyah", width: 22 },
        { header: "Nama Ibu", key: "namaIbu", width: 22 },
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2BEE34" },
      };
      headerRow.alignment = { vertical: "middle", horizontal: "center" };

      // Tambahkan 2 baris contoh data valid
      worksheet.addRow({
        nik: "3573010101800001",
        noKk: "3573010101800001",
        namaLengkap: "Budi Santoso",
        jenisKelamin: "Laki-laki",
        tempatLahir: "Kedungsumur",
        tanggalLahir: "1980-01-01",
        alamat: "Jl. Diponegoro No. 10",
        rt: "001",
        rw: "002",
        agama: "Islam",
        statusPerkawinan: "Kawin",
        shdk: "KEPALA KELUARGA",
        pekerjaan: "Wiraswasta",
        namaAyah: "Suparman",
        namaIbu: "Siti Aminah",
      });

      worksheet.addRow({
        nik: "3573010101850002",
        noKk: "3573010101800001",
        namaLengkap: "Siti Rahayu",
        jenisKelamin: "Perempuan",
        tempatLahir: "Surabaya",
        tanggalLahir: "1985-05-12",
        alamat: "Jl. Diponegoro No. 10",
        rt: "001",
        rw: "002",
        agama: "Islam",
        statusPerkawinan: "Kawin",
        shdk: "ISTRI",
        pekerjaan: "Mengurus Rumah Tangga",
        namaAyah: "Hartono",
        namaIbu: "Sri Wahyuni",
      });

      // Format sel NIK dan No KK sebagai Text
      for (let i = 2; i <= 3; i++) {
        const row = worksheet.getRow(i);
        row.getCell("nik").numFmt = "@";
        row.getCell("noKk").numFmt = "@";
        row.getCell("rt").numFmt = "@";
        row.getCell("rw").numFmt = "@";
      }

      const buffer = await workbook.xlsx.writeBuffer();

      reply.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      reply.header("Content-Disposition", 'attachment; filename="template_penduduk_kedungsumur.xlsx"');
      return reply.send(Buffer.from(buffer));
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ success: false, message: "Gagal membuat template Excel." });
    }
  });

  // 2. GET /api/penduduk/export (Export Seluruh Data Penduduk ke Excel)
  fastify.get("/api/penduduk/export", { preHandler: requireAdmin }, async (request, reply) => {
    try {
      const { rt, rw, search } = request.query as { rt?: string; rw?: string; search?: string };

      const conditions = [];
      if (rt && rt !== "ALL") conditions.push(eq(pendudukTable.rt, rt));
      if (rw && rw !== "ALL") conditions.push(eq(pendudukTable.rw, rw));
      if (search) {
        const trimmed = search.trim();
        if (/^\d{16}$/.test(trimmed)) {
          conditions.push(eq(pendudukTable.nikHash, hashKependudukan(trimmed)));
        } else {
          conditions.push(ilike(pendudukTable.namaLengkap, `%${trimmed}%`));
        }
      }

      const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

      const data = await db
        .select()
        .from(pendudukTable)
        .where(whereCondition)
        .orderBy(asc(pendudukTable.rt), asc(pendudukTable.rw), asc(pendudukTable.namaLengkap));

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Data Penduduk");

      worksheet.columns = [
        { header: "No", key: "no", width: 6 },
        { header: "NIK", key: "nik", width: 22 },
        { header: "No. KK", key: "noKk", width: 22 },
        { header: "Nama Lengkap", key: "namaLengkap", width: 28 },
        { header: "Jenis Kelamin", key: "jenisKelamin", width: 16 },
        { header: "Tempat Lahir", key: "tempatLahir", width: 18 },
        { header: "Tanggal Lahir", key: "tanggalLahir", width: 16 },
        { header: "Alamat", key: "alamat", width: 28 },
        { header: "RT", key: "rt", width: 8 },
        { header: "RW", key: "rw", width: 8 },
        { header: "Agama", key: "agama", width: 15 },
        { header: "Status Pernikahan", key: "statusPerkawinan", width: 20 },
        { header: "SHDK", key: "shdk", width: 20 },
        { header: "Pekerjaan", key: "pekerjaan", width: 20 },
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF59C749" },
      };
      headerRow.alignment = { vertical: "middle", horizontal: "center" };

      data.forEach((item, index) => {
        const row = worksheet.addRow({
          no: index + 1,
          nik: item.nik,
          noKk: item.noKk,
          namaLengkap: item.namaLengkap,
          jenisKelamin: item.jenisKelamin,
          tempatLahir: item.tempatLahir,
          tanggalLahir: item.tanggalLahir,
          alamat: item.alamat,
          rt: item.rt,
          rw: item.rw,
          agama: item.agama,
          statusPerkawinan: item.statusPerkawinan,
          shdk: item.shdk,
          pekerjaan: item.pekerjaan || "-",
        });

        row.getCell("nik").numFmt = "@";
        row.getCell("noKk").numFmt = "@";
        row.getCell("rt").numFmt = "@";
        row.getCell("rw").numFmt = "@";
      });

      const buffer = await workbook.xlsx.writeBuffer();

      reply.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      reply.header("Content-Disposition", 'attachment; filename="data_penduduk_kedungsumur.xlsx"');
      return reply.send(Buffer.from(buffer));
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ success: false, message: "Gagal mengekspor data penduduk." });
    }
  });

  // 3. GET /api/kk/export (Export Data Rekap Kartu Keluarga ke Excel)
  fastify.get("/api/kk/export", { preHandler: requireAdmin }, async (request, reply) => {
    try {
      const { rt, rw } = request.query as { rt?: string; rw?: string };

      const conditions = [];
      if (rt && rt !== "ALL") conditions.push(eq(kartuKeluargaTable.rt, rt));
      if (rw && rw !== "ALL") conditions.push(eq(kartuKeluargaTable.rw, rw));

      const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

      const kkList = await db
        .select({
          id: kartuKeluargaTable.id,
          noKk: kartuKeluargaTable.noKk,
          alamat: kartuKeluargaTable.alamat,
          rt: kartuKeluargaTable.rt,
          rw: kartuKeluargaTable.rw,
          dusun: kartuKeluargaTable.dusun,
          kodePos: kartuKeluargaTable.kodePos,
          tanggalDikeluarkan: kartuKeluargaTable.tanggalDikeluarkan,
          kepalaKeluargaNama: pendudukTable.namaLengkap,
          kepalaKeluargaNik: pendudukTable.nik,
        })
        .from(kartuKeluargaTable)
        .leftJoin(pendudukTable, eq(kartuKeluargaTable.kepalaKeluargaId, pendudukTable.id))
        .where(whereCondition)
        .orderBy(asc(kartuKeluargaTable.rt), asc(kartuKeluargaTable.rw));

      // Hitung jumlah anggota per KK
      const kkIds = kkList.map((k) => k.id);
      let memberCounts: Record<string, number> = {};

      if (kkIds.length > 0) {
        const counts = await db
          .select({
            kartuKeluargaId: pendudukTable.kartuKeluargaId,
            count: sql<number>`cast(count(${pendudukTable.id}) as integer)`,
          })
          .from(pendudukTable)
          .where(inArray(pendudukTable.kartuKeluargaId, kkIds))
          .groupBy(pendudukTable.kartuKeluargaId);

        counts.forEach((c) => {
          if (c.kartuKeluargaId) {
            memberCounts[c.kartuKeluargaId] = c.count;
          }
        });
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Data Kartu Keluarga");

      worksheet.columns = [
        { header: "No", key: "no", width: 6 },
        { header: "Nomor KK", key: "noKk", width: 22 },
        { header: "Nama Kepala Keluarga", key: "kepalaKeluargaNama", width: 28 },
        { header: "NIK Kepala Keluarga", key: "kepalaKeluargaNik", width: 22 },
        { header: "Alamat", key: "alamat", width: 28 },
        { header: "RT", key: "rt", width: 8 },
        { header: "RW", key: "rw", width: 8 },
        { header: "Dusun", key: "dusun", width: 18 },
        { header: "Jumlah Anggota", key: "jumlahAnggota", width: 16 },
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2BEE34" },
      };
      headerRow.alignment = { vertical: "middle", horizontal: "center" };

      kkList.forEach((kk, index) => {
        const row = worksheet.addRow({
          no: index + 1,
          noKk: kk.noKk,
          kepalaKeluargaNama: kk.kepalaKeluargaNama || "-",
          kepalaKeluargaNik: kk.kepalaKeluargaNik || "-",
          alamat: kk.alamat,
          rt: kk.rt,
          rw: kk.rw,
          dusun: kk.dusun || "-",
          jumlahAnggota: `${memberCounts[kk.id] || 0} Jiwa`,
        });

        row.getCell("noKk").numFmt = "@";
        row.getCell("kepalaKeluargaNik").numFmt = "@";
        row.getCell("rt").numFmt = "@";
        row.getCell("rw").numFmt = "@";
      });

      const buffer = await workbook.xlsx.writeBuffer();

      reply.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      reply.header("Content-Disposition", 'attachment; filename="data_kartu_keluarga_kedungsumur.xlsx"');
      return reply.send(Buffer.from(buffer));
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ success: false, message: "Gagal mengekspor data Kartu Keluarga." });
    }
  });

  // 4. POST /api/penduduk/import (Bulk Upload & Insert Data Penduduk dari Excel)
  fastify.post("/api/penduduk/import", { preHandler: requireAdmin }, async (request, reply) => {
    try {
      const file = await request.file();
      if (!file) {
        return reply.status(400).send({ success: false, message: "File Excel (.xlsx) wajib diunggah." });
      }

      const fileBuffer = await file.toBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(fileBuffer as any);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        return reply.status(400).send({ success: false, message: "Lembar kerja Excel kosong." });
      }

      const parsedRows: any[] = [];
      const errors: string[] = [];
      const seenNiksInFile = new Set<string>();

      const headerRow = worksheet.getRow(1);
      const colMap: Record<string, number> = {};

      headerRow.eachCell((cell, colNumber) => {
        const text = String(cell.text || "").toLowerCase().trim();
        if (text.includes("nik")) colMap.nik = colNumber;
        else if (text.includes("kk") || text.includes("kartu keluarga")) colMap.noKk = colNumber;
        else if (text.includes("nama") && (text.includes("lengkap") || (!text.includes("ayah") && !text.includes("ibu")))) colMap.namaLengkap = colNumber;
        else if (text.includes("kelamin") || text === "jk") colMap.jenisKelamin = colNumber;
        else if (text.includes("tempat") && text.includes("lahir")) colMap.tempatLahir = colNumber;
        else if (text.includes("tanggal") || text.includes("tgl") || text.includes("lahir")) {
          if (!colMap.tanggalLahir) colMap.tanggalLahir = colNumber;
        }
        else if (text.includes("alamat") || text.includes("domisili") || text.includes("jalan")) colMap.alamat = colNumber;
        else if (text === "rt" || text.startsWith("rt")) colMap.rt = colNumber;
        else if (text === "rw" || text.startsWith("rw")) colMap.rw = colNumber;
        else if (text.includes("agama")) colMap.agama = colNumber;
        else if (text.includes("kawin") || text.includes("status") || text.includes("pernikahan")) colMap.statusPerkawinan = colNumber;
        else if (text.includes("shdk") || text.includes("hubungan") || text.includes("keluarga")) colMap.shdk = colNumber;
        else if (text.includes("pekerjaan") || text.includes("profesi")) colMap.pekerjaan = colNumber;
        else if (text.includes("ayah")) colMap.namaAyah = colNumber;
        else if (text.includes("ibu")) colMap.namaIbu = colNumber;
      });

      const getVal = (row: ExcelJS.Row, key: string, fallbackColIndex: number) => {
        const colIdx = colMap[key] || fallbackColIndex;
        const cell = row.getCell(colIdx);
        if (!cell) return "";
        if (typeof cell.value === "number") {
          return String(BigInt(Math.floor(cell.value)));
        }
        return String(cell.text || cell.value || "").trim();
      };

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Lewati header

        const nik = getVal(row, "nik", 1);
        const noKk = getVal(row, "noKk", 2);
        const namaLengkap = getVal(row, "namaLengkap", 3);
        const jenisKelamin = getVal(row, "jenisKelamin", 4);
        const tempatLahir = getVal(row, "tempatLahir", 5);

        const tglColIdx = colMap.tanggalLahir || 6;
        const cellTanggal = row.getCell(tglColIdx);
        const tanggalLahir = parseExcelDate(cellTanggal.value) || parseExcelDate(cellTanggal.text);

        const alamat = getVal(row, "alamat", 7);
        const rt = getVal(row, "rt", 8);
        const rw = getVal(row, "rw", 9);
        const agama = getVal(row, "agama", 10);
        const statusPerkawinan = getVal(row, "statusPerkawinan", 11);
        const shdk = getVal(row, "shdk", 12) || "LAINNYA";
        const pekerjaan = getVal(row, "pekerjaan", 13);
        const namaAyah = getVal(row, "namaAyah", 14) || null;
        const namaIbu = getVal(row, "namaIbu", 15) || null;

        if (!nik && !noKk && !namaLengkap && !tempatLahir && !alamat && !rt && !rw) {
          return; // Abaikan baris kosong
        }

        if (!tanggalLahir) {
          const rawDisplay = String(cellTanggal.text || cellTanggal.value || "");
          errors.push(`Baris ${rowNumber}: Format tanggal lahir '${rawDisplay}' tidak valid (Gunakan format YYYY-MM-DD atau DD/MM/YYYY).`);
          return;
        }

        if (!nik || !noKk || !namaLengkap || !tempatLahir || !alamat || !rt || !rw) {
          errors.push(`Baris ${rowNumber}: Data tidak lengkap (NIK, No KK, Nama, Tempat Lahir, Alamat, RT, dan RW wajib diisi).`);
          return;
        }

        if (nik.length !== 16 || !/^\d{16}$/.test(nik)) {
          errors.push(`Baris ${rowNumber}: NIK '${nik}' harus berupa 16 digit angka.`);
          return;
        }

        if (noKk.length !== 16 || !/^\d{16}$/.test(noKk)) {
          errors.push(`Baris ${rowNumber}: No KK '${noKk}' harus berupa 16 digit angka.`);
          return;
        }

        if (seenNiksInFile.has(nik)) {
          errors.push(`Baris ${rowNumber}: NIK '${nik}' duplikat di dalam file Excel.`);
          return;
        }
        seenNiksInFile.add(nik);

        parsedRows.push({
          nik,
          noKk,
          namaLengkap,
          jenisKelamin: jenisKelamin || "Laki-laki",
          tempatLahir,
          tanggalLahir,
          alamat,
          rt: rt.padStart(3, "0"),
          rw: rw.padStart(3, "0"),
          agama: agama || "Islam",
          statusPerkawinan: statusPerkawinan || "Belum Kawin",
          shdk,
          pekerjaan: pekerjaan || "-",
          namaAyah,
          namaIbu,
        });
      });

      if (parsedRows.length === 0) {
        return reply.status(400).send({
          success: false,
          message: "Tidak ada data valid yang dapat diproses dari file Excel.",
          errors,
        });
      }

      // Proses pengelompokan KK & Insert
      let insertedCount = 0;
      let skippedCount = 0;

      // Kelompokkan row berdasarkan noKk
      const kkGroups = new Map<string, typeof parsedRows>();
      for (const row of parsedRows) {
        const list = kkGroups.get(row.noKk) || [];
        list.push(row);
        kkGroups.set(row.noKk, list);
      }

      await db.transaction(async (tx) => {
        for (const [noKk, members] of kkGroups.entries()) {
          const noKkHash = hashKependudukan(noKk);

          let kkId: string;
          let existingKepalaId: string | null = null;
          let baseUrutan = 0;

          const existingKk = await tx
            .select()
            .from(kartuKeluargaTable)
            .where(eq(kartuKeluargaTable.noKkHash, noKkHash));

          if (existingKk[0]) {
            kkId = existingKk[0].id;
            existingKepalaId = existingKk[0].kepalaKeluargaId;

            const currentMembersCount = await tx
              .select({ count: sql<number>`cast(count(${pendudukTable.id}) as integer)` })
              .from(pendudukTable)
              .where(eq(pendudukTable.kartuKeluargaId, kkId));
            baseUrutan = currentMembersCount[0]?.count ?? 0;
          } else {
            const sample = members[0]!;
            const [newKk] = await tx
              .insert(kartuKeluargaTable)
              .values({
                noKk,
                noKkHash,
                alamat: sample.alamat,
                rt: sample.rt,
                rw: sample.rw,
                dusun: "Dusun Krajan",
                kodePos: "65171",
              })
              .returning();
            kkId = newKk!.id;
          }

          let kepalaId: string | null = null;
          const hasExplicitKepala = members.some((m) => m.shdk.toUpperCase() === "KEPALA KELUARGA");
          const shouldFallbackFirstAsKepala = !existingKepalaId && !hasExplicitKepala;

          for (let i = 0; i < members.length; i++) {
            const m = members[i]!;
            const nikHash = hashKependudukan(m.nik);

            const existingPenduduk = await tx
              .select()
              .from(pendudukTable)
              .where(eq(pendudukTable.nikHash, nikHash));

            if (existingPenduduk[0]) {
              skippedCount++;
              continue;
            }

            const isExplicitKepala = m.shdk.toUpperCase() === "KEPALA KELUARGA";
            const isKepala = isExplicitKepala || (shouldFallbackFirstAsKepala && i === 0);

            const [created] = await tx
              .insert(pendudukTable)
              .values({
                kartuKeluargaId: kkId,
                nik: m.nik,
                nikHash,
                noKk: m.noKk,
                noKkHash,
                namaLengkap: m.namaLengkap,
                tempatLahir: m.tempatLahir,
                tanggalLahir: m.tanggalLahir,
                jenisKelamin: m.jenisKelamin,
                alamat: m.alamat,
                rt: m.rt,
                rw: m.rw,
                agama: m.agama,
                statusPerkawinan: m.statusPerkawinan,
                shdk: isKepala && !isExplicitKepala ? "KEPALA KELUARGA" : (m.shdk ? m.shdk.toUpperCase() : "LAINNYA"),
                urutanKk: String(baseUrutan + i + 1),
                pekerjaan: m.pekerjaan,
                namaAyah: m.namaAyah,
                namaIbu: m.namaIbu,
              })
              .returning();

            if (created) {
              insertedCount++;
              if (isKepala && !kepalaId) {
                kepalaId = created.id;
              }
            }
          }

          if (kepalaId) {
            await tx
              .update(kartuKeluargaTable)
              .set({ kepalaKeluargaId: kepalaId })
              .where(eq(kartuKeluargaTable.id, kkId));
          }
        }
      });

      return reply.send({
        success: true,
        message: `Proses import selesai. Berhasil menambahkan ${insertedCount} data, ${skippedCount} data dilewati (NIK sudah ada).`,
        data: {
          totalDiproses: parsedRows.length,
          berhasil: insertedCount,
          dilewati: skippedCount,
          errors: errors.slice(0, 10),
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ success: false, message: "Gagal memproses file import Excel." });
    }
  });
}
