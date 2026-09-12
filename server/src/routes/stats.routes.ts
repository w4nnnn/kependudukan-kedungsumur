import type { FastifyInstance } from "fastify";
import PDFDocument from "pdfkit";
import { db } from "../db/index.js";
import { pendudukTable, kartuKeluargaTable } from "../db/schema/schema.js";
import { user } from "../db/schema/auth-schema.js";
import { eq, and, sql, desc, asc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.middleware.js";

export default async function statsRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", requireAuth);

  fastify.get("/api/stats", async (request, reply) => {
    try {
      const { rt, rw } = request.query as { rt?: string; rw?: string };

      const currentUser = (request as any).user;
      if (currentUser?.role !== "admin") {
        if (currentUser?.rt && rt && rt !== "ALL" && rt !== currentUser.rt) {
          return reply.status(403).send({
            success: false,
            message: `Akses ditolak. Anda hanya berwenang untuk wilayah RT ${currentUser.rt}.`,
          });
        }
        if (currentUser?.rw && rw && rw !== "ALL" && rw !== currentUser.rw) {
          return reply.status(403).send({
            success: false,
            message: `Akses ditolak. Anda hanya berwenang untuk wilayah RW ${currentUser.rw}.`,
          });
        }
      }

      const effectiveRt = (currentUser?.role !== "admin" && currentUser?.rt) ? currentUser.rt : rt;
      const effectiveRw = (currentUser?.role !== "admin" && currentUser?.rw) ? currentUser.rw : rw;

      const pendudukConditions = [];
      const kkConditions = [];

      if (effectiveRt && effectiveRt !== "ALL") {
        pendudukConditions.push(eq(pendudukTable.rt, effectiveRt));
        kkConditions.push(eq(kartuKeluargaTable.rt, effectiveRt));
      }

      if (effectiveRw && effectiveRw !== "ALL") {
        pendudukConditions.push(eq(pendudukTable.rw, effectiveRw));
        kkConditions.push(eq(kartuKeluargaTable.rw, effectiveRw));
      }

      const wherePenduduk = pendudukConditions.length > 0 ? and(...pendudukConditions) : undefined;
      const whereKK = kkConditions.length > 0 ? and(...kkConditions) : undefined;

      const [
        summaryDemografiRes,
        totalKkRes,
        totalUserRes,
        distribusiRtRes,
        distribusiRwRes,
        statusPerkawinanRes,
        agamaRes,
        pekerjaanRes,
        shdkRes,
      ] = await Promise.all([
        db
          .select({
            total: sql<number>`cast(count(${pendudukTable.id}) as integer)`,
            lakiLaki: sql<number>`cast(count(case when ${pendudukTable.jenisKelamin} = 'Laki-laki' then 1 end) as integer)`,
            perempuan: sql<number>`cast(count(case when ${pendudukTable.jenisKelamin} = 'Perempuan' then 1 end) as integer)`,
            balita: sql<number>`cast(count(case when ${pendudukTable.tanggalLahir} <= CURRENT_DATE and EXTRACT(YEAR FROM age(CURRENT_DATE, ${pendudukTable.tanggalLahir})) between 0 and 5 then 1 end) as integer)`,
            anak: sql<number>`cast(count(case when EXTRACT(YEAR FROM age(CURRENT_DATE, ${pendudukTable.tanggalLahir})) between 6 and 12 then 1 end) as integer)`,
            remaja: sql<number>`cast(count(case when EXTRACT(YEAR FROM age(CURRENT_DATE, ${pendudukTable.tanggalLahir})) between 13 and 17 then 1 end) as integer)`,
            produktif: sql<number>`cast(count(case when EXTRACT(YEAR FROM age(CURRENT_DATE, ${pendudukTable.tanggalLahir})) between 18 and 59 then 1 end) as integer)`,
            lansia: sql<number>`cast(count(case when EXTRACT(YEAR FROM age(CURRENT_DATE, ${pendudukTable.tanggalLahir})) >= 60 then 1 end) as integer)`,
          })
          .from(pendudukTable)
          .where(wherePenduduk),

        db
          .select({
            total: sql<number>`cast(count(${kartuKeluargaTable.id}) as integer)`,
          })
          .from(kartuKeluargaTable)
          .where(whereKK),

        db
          .select({
            total: sql<number>`cast(count(${user.id}) as integer)`,
          })
          .from(user),

        db
          .select({
            rt: pendudukTable.rt,
            total: sql<number>`cast(count(${pendudukTable.id}) as integer)`,
            lakiLaki: sql<number>`cast(count(case when ${pendudukTable.jenisKelamin} = 'Laki-laki' then 1 end) as integer)`,
            perempuan: sql<number>`cast(count(case when ${pendudukTable.jenisKelamin} = 'Perempuan' then 1 end) as integer)`,
          })
          .from(pendudukTable)
          .where(wherePenduduk)
          .groupBy(pendudukTable.rt)
          .orderBy(asc(pendudukTable.rt)),

        db
          .select({
            rw: pendudukTable.rw,
            total: sql<number>`cast(count(${pendudukTable.id}) as integer)`,
            lakiLaki: sql<number>`cast(count(case when ${pendudukTable.jenisKelamin} = 'Laki-laki' then 1 end) as integer)`,
            perempuan: sql<number>`cast(count(case when ${pendudukTable.jenisKelamin} = 'Perempuan' then 1 end) as integer)`,
          })
          .from(pendudukTable)
          .where(wherePenduduk)
          .groupBy(pendudukTable.rw)
          .orderBy(asc(pendudukTable.rw)),

        db
          .select({
            status: pendudukTable.statusPerkawinan,
            count: sql<number>`cast(count(${pendudukTable.id}) as integer)`,
          })
          .from(pendudukTable)
          .where(wherePenduduk)
          .groupBy(pendudukTable.statusPerkawinan)
          .orderBy(desc(sql`count(${pendudukTable.id})`)),

        db
          .select({
            agama: pendudukTable.agama,
            count: sql<number>`cast(count(${pendudukTable.id}) as integer)`,
          })
          .from(pendudukTable)
          .where(wherePenduduk)
          .groupBy(pendudukTable.agama)
          .orderBy(desc(sql`count(${pendudukTable.id})`)),

        db
          .select({
            pekerjaan: pendudukTable.pekerjaan,
            count: sql<number>`cast(count(${pendudukTable.id}) as integer)`,
          })
          .from(pendudukTable)
          .where(wherePenduduk)
          .groupBy(pendudukTable.pekerjaan)
          .orderBy(desc(sql`count(${pendudukTable.id})`))
          .limit(10),

        db
          .select({
            shdk: pendudukTable.shdk,
            count: sql<number>`cast(count(${pendudukTable.id}) as integer)`,
          })
          .from(pendudukTable)
          .where(wherePenduduk)
          .groupBy(pendudukTable.shdk)
          .orderBy(desc(sql`count(${pendudukTable.id})`)),
      ]);

      const totalPenduduk = summaryDemografiRes[0]?.total ?? 0;
      const totalKK = totalKkRes[0]?.total ?? 0;
      const totalLakiLaki = summaryDemografiRes[0]?.lakiLaki ?? 0;
      const totalPerempuan = summaryDemografiRes[0]?.perempuan ?? 0;
      const totalUser = totalUserRes[0]?.total ?? 0;
      const rataRataAnggotaKK = totalKK > 0 ? Number((totalPenduduk / totalKK).toFixed(1)) : 0;

      const usiaRaw = summaryDemografiRes[0] ?? { balita: 0, anak: 0, remaja: 0, produktif: 0, lansia: 0 };
      const kelompokUsia = [
        { kelompok: "Balita (0-5 thn)", count: usiaRaw.balita },
        { kelompok: "Anak-anak (6-12 thn)", count: usiaRaw.anak },
        { kelompok: "Remaja (13-17 thn)", count: usiaRaw.remaja },
        { kelompok: "Usia Produktif (18-59 thn)", count: usiaRaw.produktif },
        { kelompok: "Lansia (60+ thn)", count: usiaRaw.lansia },
      ];

      const gender = [
        { jenisKelamin: "Laki-laki", count: totalLakiLaki },
        { jenisKelamin: "Perempuan", count: totalPerempuan },
      ];

      return reply.send({
        success: true,
        data: {
          summary: {
            totalPenduduk,
            totalKK,
            totalLakiLaki,
            totalPerempuan,
            rataRataAnggotaKK,
            totalUser,
          },
          gender,
          kelompokUsia,
          distribusiRt: distribusiRtRes,
          distribusiRw: distribusiRwRes,
          statusPerkawinan: statusPerkawinanRes,
          agama: agamaRes,
          pekerjaan: pekerjaanRes.map((p) => ({
            pekerjaan: p.pekerjaan || "Lainnya / Tidak Tercatat",
            count: p.count,
          })),
          shdk: shdkRes,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ success: false, message: "Gagal mengambil data statistik kependudukan." });
    }
  });

  fastify.get("/api/stats/pdf", async (request, reply) => {
    try {
      const { rt, rw } = request.query as { rt?: string; rw?: string };

      const currentUser = (request as any).user;
      if (currentUser?.role !== "admin") {
        if (currentUser?.rt && rt && rt !== "ALL" && rt !== currentUser.rt) {
          return reply.status(403).send({
            success: false,
            message: `Akses ditolak. Anda hanya berwenang untuk wilayah RT ${currentUser.rt}.`,
          });
        }
        if (currentUser?.rw && rw && rw !== "ALL" && rw !== currentUser.rw) {
          return reply.status(403).send({
            success: false,
            message: `Akses ditolak. Anda hanya berwenang untuk wilayah RW ${currentUser.rw}.`,
          });
        }
      }

      const effectiveRt = (currentUser?.role !== "admin" && currentUser?.rt) ? currentUser.rt : rt;
      const effectiveRw = (currentUser?.role !== "admin" && currentUser?.rw) ? currentUser.rw : rw;

      const pendudukConditions = [];
      const kkConditions = [];

      if (effectiveRt && effectiveRt !== "ALL") {
        pendudukConditions.push(eq(pendudukTable.rt, effectiveRt));
        kkConditions.push(eq(kartuKeluargaTable.rt, effectiveRt));
      }

      if (effectiveRw && effectiveRw !== "ALL") {
        pendudukConditions.push(eq(pendudukTable.rw, effectiveRw));
        kkConditions.push(eq(kartuKeluargaTable.rw, effectiveRw));
      }

      const wherePenduduk = pendudukConditions.length > 0 ? and(...pendudukConditions) : undefined;
      const whereKK = kkConditions.length > 0 ? and(...kkConditions) : undefined;

      const [
        summaryDemografiRes,
        totalKkRes,
        distribusiRtRes,
        statusPerkawinanRes,
        pekerjaanRes,
      ] = await Promise.all([
        db
          .select({
            total: sql<number>`cast(count(${pendudukTable.id}) as integer)`,
            lakiLaki: sql<number>`cast(count(case when ${pendudukTable.jenisKelamin} = 'Laki-laki' then 1 end) as integer)`,
            perempuan: sql<number>`cast(count(case when ${pendudukTable.jenisKelamin} = 'Perempuan' then 1 end) as integer)`,
            balita: sql<number>`cast(count(case when ${pendudukTable.tanggalLahir} <= CURRENT_DATE and EXTRACT(YEAR FROM age(CURRENT_DATE, ${pendudukTable.tanggalLahir})) between 0 and 5 then 1 end) as integer)`,
            anak: sql<number>`cast(count(case when EXTRACT(YEAR FROM age(CURRENT_DATE, ${pendudukTable.tanggalLahir})) between 6 and 12 then 1 end) as integer)`,
            remaja: sql<number>`cast(count(case when EXTRACT(YEAR FROM age(CURRENT_DATE, ${pendudukTable.tanggalLahir})) between 13 and 17 then 1 end) as integer)`,
            produktif: sql<number>`cast(count(case when EXTRACT(YEAR FROM age(CURRENT_DATE, ${pendudukTable.tanggalLahir})) between 18 and 59 then 1 end) as integer)`,
            lansia: sql<number>`cast(count(case when EXTRACT(YEAR FROM age(CURRENT_DATE, ${pendudukTable.tanggalLahir})) >= 60 then 1 end) as integer)`,
          })
          .from(pendudukTable)
          .where(wherePenduduk),

        db
          .select({
            total: sql<number>`cast(count(${kartuKeluargaTable.id}) as integer)`,
          })
          .from(kartuKeluargaTable)
          .where(whereKK),

        db
          .select({
            rt: pendudukTable.rt,
            total: sql<number>`cast(count(${pendudukTable.id}) as integer)`,
            lakiLaki: sql<number>`cast(count(case when ${pendudukTable.jenisKelamin} = 'Laki-laki' then 1 end) as integer)`,
            perempuan: sql<number>`cast(count(case when ${pendudukTable.jenisKelamin} = 'Perempuan' then 1 end) as integer)`,
          })
          .from(pendudukTable)
          .where(wherePenduduk)
          .groupBy(pendudukTable.rt)
          .orderBy(asc(pendudukTable.rt)),

        db
          .select({
            status: pendudukTable.statusPerkawinan,
            count: sql<number>`cast(count(${pendudukTable.id}) as integer)`,
          })
          .from(pendudukTable)
          .where(wherePenduduk)
          .groupBy(pendudukTable.statusPerkawinan)
          .orderBy(desc(sql`count(${pendudukTable.id})`)),

        db
          .select({
            pekerjaan: pendudukTable.pekerjaan,
            count: sql<number>`cast(count(${pendudukTable.id}) as integer)`,
          })
          .from(pendudukTable)
          .where(wherePenduduk)
          .groupBy(pendudukTable.pekerjaan)
          .orderBy(desc(sql`count(${pendudukTable.id})`))
          .limit(5),
      ]);

      const totalPenduduk = summaryDemografiRes[0]?.total ?? 0;
      const totalKK = totalKkRes[0]?.total ?? 0;
      const totalLakiLaki = summaryDemografiRes[0]?.lakiLaki ?? 0;
      const totalPerempuan = summaryDemografiRes[0]?.perempuan ?? 0;
      const rataRataKK = totalKK > 0 ? (totalPenduduk / totalKK).toFixed(1) : "0";

      const usia = summaryDemografiRes[0] ?? { balita: 0, anak: 0, remaja: 0, produktif: 0, lansia: 0 };

      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 40, bottom: 40, left: 45, right: 45 },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));

      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("PEMERINTAH KABUPATEN MALANG", 45, 40, { width: 505, align: "center" })
        .fontSize(14)
        .text("KECAMATAN KEPANJEN", 45, 56, { width: 505, align: "center" })
        .fontSize(16)
        .text("PEMERINTAH DESA KEDUNGSUMUR", 45, 74, { width: 505, align: "center" })
        .fontSize(9)
        .font("Helvetica")
        .text("Jl. Raya Kedungsumur No. 01, Kec. Kepanjen, Kab. Malang, Jawa Timur 65171", 45, 96, { width: 505, align: "center" });

      doc
        .moveTo(45, 112)
        .lineTo(550, 112)
        .lineWidth(1.5)
        .stroke()
        .moveTo(45, 114.5)
        .lineTo(550, 114.5)
        .lineWidth(0.5)
        .stroke();

      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .text("LAPORAN REKAPITULASI STATISTIK KEPENDUDUKAN", 45, 126, { width: 505, align: "center" });

      const wilayahLabel = (effectiveRt && effectiveRt !== "ALL" ? `RT ${effectiveRt} ` : "") + (effectiveRw && effectiveRw !== "ALL" ? `RW ${effectiveRw} ` : "");
      doc
        .fontSize(9)
        .font("Helvetica")
        .text(`Wilayah: ${wilayahLabel || "Seluruh Wilayah Desa"} | Dicetak Pada: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`, 45, 144, {
          width: 505,
          align: "center",
        });

      doc.fontSize(10).font("Helvetica-Bold").text("I. INDIKATOR UTAMA KEPENDUDUKAN", 45, 168);

      const tableTop1 = 184;
      doc.rect(45, tableTop1, 505, 38).fillAndStroke("#F5F5F5", "#CCCCCC");

      doc
        .fillColor("#000000")
        .fontSize(9)
        .font("Helvetica")
        .text(`• Total Penduduk : ${totalPenduduk} Jiwa (Laki-laki: ${totalLakiLaki}, Perempuan: ${totalPerempuan})`, 55, tableTop1 + 8)
        .text(`• Total Kepala Keluarga (KK) : ${totalKK} KK`, 55, tableTop1 + 22)
        .text(`• Rata-rata Anggota Keluarga : ${rataRataKK} Jiwa / KK`, 310, tableTop1 + 8)
        .text(`• Rasio Gender : ${totalPerempuan > 0 ? (totalLakiLaki / totalPerempuan).toFixed(2) : "1.00"} (L/P)`, 310, tableTop1 + 22);

      const section2TitleY = tableTop1 + 52;
      doc.fontSize(10).font("Helvetica-Bold").text("II. DEMOGRAFI KELOMPOK USIA & STATUS PERNIKAHAN", 45, section2TitleY);

      const tableTop2 = section2TitleY + 16;
      doc.rect(45, tableTop2, 245, 18).fillAndStroke("#2BEE34", "#2BEE34");
      doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(8.5).text("Kelompok Usia", 55, tableTop2 + 5);
      doc.text("Jumlah", 230, tableTop2 + 5, { align: "right", width: 50 });

      doc.rect(305, tableTop2, 245, 18).fillAndStroke("#2BEE34", "#2BEE34");
      doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(8.5).text("Status Perkawinan", 315, tableTop2 + 5);
      doc.text("Jumlah", 490, tableTop2 + 5, { align: "right", width: 50 });

      let rowY = tableTop2 + 18;
      doc.font("Helvetica").fontSize(8).fillColor("#000000");

      const usiaRows = [
        ["Balita (0 - 5 Tahun)", `${usia.balita} Jiwa`],
        ["Anak-anak (6 - 12 Tahun)", `${usia.anak} Jiwa`],
        ["Remaja (13 - 17 Tahun)", `${usia.remaja} Jiwa`],
        ["Usia Produktif (18 - 59 Tahun)", `${usia.produktif} Jiwa`],
        ["Lansia (60+ Tahun)", `${usia.lansia} Jiwa`],
      ];

      for (let i = 0; i < 5; i++) {
        const bg = i % 2 === 0 ? "#FAFAFA" : "#FFFFFF";
        doc.rect(45, rowY, 245, 16).fillAndStroke(bg, "#E5E5E5");
        doc.rect(305, rowY, 245, 16).fillAndStroke(bg, "#E5E5E5");

        doc.fillColor("#000000");
        if (usiaRows[i]) {
          doc.text(usiaRows[i]![0]!, 55, rowY + 4);
          doc.text(usiaRows[i]![1]!, 230, rowY + 4, { align: "right", width: 50 });
        }

        const sp = statusPerkawinanRes[i];
        if (sp) {
          doc.text(sp.status, 315, rowY + 4);
          doc.text(`${sp.count} Jiwa`, 490, rowY + 4, { align: "right", width: 50 });
        } else {
          doc.text("-", 315, rowY + 4);
        }

        rowY += 16;
      }

      const section3TitleY = rowY + 16;
      doc.fontSize(10).font("Helvetica-Bold").text("III. SEBARAN PENDUDUK PER RUKUN TETANGGA (RT)", 45, section3TitleY);

      const tableTop3 = section3TitleY + 16;
      doc.rect(45, tableTop3, 505, 18).fillAndStroke("#59C749", "#59C749");
      doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(8.5);
      doc.text("Wilayah RT", 55, tableTop3 + 5);
      doc.text("Laki-laki", 220, tableTop3 + 5, { align: "center", width: 70 });
      doc.text("Perempuan", 330, tableTop3 + 5, { align: "center", width: 70 });
      doc.text("Total Jiwa", 460, tableTop3 + 5, { align: "right", width: 80 });

      let rtRowY = tableTop3 + 18;
      doc.font("Helvetica").fontSize(8).fillColor("#000000");

      distribusiRtRes.forEach((rtItem, idx) => {
        if (rtRowY + 16 > 760) {
          doc.addPage();
          rtRowY = 50;
        }
        const bg = idx % 2 === 0 ? "#FAFAFA" : "#FFFFFF";
        doc.rect(45, rtRowY, 505, 16).fillAndStroke(bg, "#E5E5E5");
        doc.fillColor("#000000");
        doc.text(`Rukun Tetangga (RT ${rtItem.rt})`, 55, rtRowY + 4);
        doc.text(`${rtItem.lakiLaki} Jiwa`, 220, rtRowY + 4, { align: "center", width: 70 });
        doc.text(`${rtItem.perempuan} Jiwa`, 330, rtRowY + 4, { align: "center", width: 70 });
        doc.text(`${rtItem.total} Jiwa`, 460, rtRowY + 4, { align: "right", width: 80 });
        rtRowY += 16;
      });

      let section4TitleY = rtRowY + 16;
      if (section4TitleY + 34 + (pekerjaanRes.length * 16) > 760 && section4TitleY > 500) {
        doc.addPage();
        section4TitleY = 50;
      }
      doc.fontSize(10).font("Helvetica-Bold").text("IV. MATA PENCAHARIAN / PEKERJAAN UTAMA WARGA", 45, section4TitleY);

      const tableTop4 = section4TitleY + 16;
      doc.rect(45, tableTop4, 505, 18).fillAndStroke("#333333", "#333333");
      doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(8.5);
      doc.text("No", 55, tableTop4 + 5);
      doc.text("Jenis Pekerjaan", 90, tableTop4 + 5);
      doc.text("Jumlah Penduduk", 360, tableTop4 + 5);
      doc.text("Persentase", 460, tableTop4 + 5, { align: "right", width: 80 });

      let jobRowY = tableTop4 + 18;
      doc.font("Helvetica").fontSize(8).fillColor("#000000");

      pekerjaanRes.forEach((job, idx) => {
        if (jobRowY + 16 > 760) {
          doc.addPage();
          jobRowY = 50;
        }
        const bg = idx % 2 === 0 ? "#FAFAFA" : "#FFFFFF";
        const percent = totalPenduduk > 0 ? ((job.count / totalPenduduk) * 100).toFixed(1) : "0";
        doc.rect(45, jobRowY, 505, 16).fillAndStroke(bg, "#E5E5E5");
        doc.fillColor("#000000");
        doc.text(String(idx + 1), 55, jobRowY + 4);
        doc.text(job.pekerjaan || "Lainnya / Tidak Bekerja", 90, jobRowY + 4);
        doc.text(`${job.count} Orang`, 360, jobRowY + 4);
        doc.text(`${percent}%`, 460, jobRowY + 4, { align: "right", width: 80 });
        jobRowY += 16;
      });

      let signY = jobRowY + 24;
      if (signY + 70 > 760) {
        doc.addPage();
        signY = 50;
      }

      doc
        .fontSize(9)
        .font("Helvetica")
        .text("Mengetahui,", 55, signY)
        .text("Kepala Desa Kedungsumur", 55, signY + 12)
        .text(`Kedungsumur, ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`, 380, signY)
        .text("Petugas Operator Data,", 380, signY + 12);

      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("( ................................................ )", 55, signY + 55)
        .text("( ................................................ )", 380, signY + 55);

      const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", (err) => reject(err));
        doc.end();
      });

      reply.header("Content-Type", "application/pdf");
      reply.header("Content-Disposition", 'attachment; filename="laporan_statistik_desa_kedungsumur.pdf"');
      return reply.send(pdfBuffer);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ success: false, message: "Gagal men-generate laporan PDF statistik." });
    }
  });
}
