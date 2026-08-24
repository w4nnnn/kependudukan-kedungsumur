import type { FastifyInstance } from "fastify";
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

      const pendudukConditions = [];
      const kkConditions = [];

      if (rt && rt !== "ALL") {
        pendudukConditions.push(eq(pendudukTable.rt, rt));
        kkConditions.push(eq(kartuKeluargaTable.rt, rt));
      }

      if (rw && rw !== "ALL") {
        pendudukConditions.push(eq(pendudukTable.rw, rw));
        kkConditions.push(eq(kartuKeluargaTable.rw, rw));
      }

      const wherePenduduk = pendudukConditions.length > 0 ? and(...pendudukConditions) : undefined;
      const whereKK = kkConditions.length > 0 ? and(...kkConditions) : undefined;

      const [
        totalPendudukRes,
        genderCountRes,
        totalKkRes,
        totalUserRes,
        kelompokUsiaRes,
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
          })
          .from(pendudukTable)
          .where(wherePenduduk),

        db
          .select({
            jenisKelamin: pendudukTable.jenisKelamin,
            count: sql<number>`cast(count(${pendudukTable.id}) as integer)`,
          })
          .from(pendudukTable)
          .where(wherePenduduk)
          .groupBy(pendudukTable.jenisKelamin),

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
            balita: sql<number>`cast(count(case when EXTRACT(YEAR FROM age(CURRENT_DATE, ${pendudukTable.tanggalLahir})) <= 5 then 1 end) as integer)`,
            anak: sql<number>`cast(count(case when EXTRACT(YEAR FROM age(CURRENT_DATE, ${pendudukTable.tanggalLahir})) between 6 and 12 then 1 end) as integer)`,
            remaja: sql<number>`cast(count(case when EXTRACT(YEAR FROM age(CURRENT_DATE, ${pendudukTable.tanggalLahir})) between 13 and 17 then 1 end) as integer)`,
            produktif: sql<number>`cast(count(case when EXTRACT(YEAR FROM age(CURRENT_DATE, ${pendudukTable.tanggalLahir})) between 18 and 59 then 1 end) as integer)`,
            lansia: sql<number>`cast(count(case when EXTRACT(YEAR FROM age(CURRENT_DATE, ${pendudukTable.tanggalLahir})) >= 60 then 1 end) as integer)`,
          })
          .from(pendudukTable)
          .where(wherePenduduk),

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

      const totalPenduduk = totalPendudukRes[0]?.total ?? 0;
      const totalKK = totalKkRes[0]?.total ?? 0;
      const totalLakiLaki = totalPendudukRes[0]?.lakiLaki ?? 0;
      const totalPerempuan = totalPendudukRes[0]?.perempuan ?? 0;
      const totalUser = totalUserRes[0]?.total ?? 0;
      const rataRataAnggotaKK = totalKK > 0 ? Number((totalPenduduk / totalKK).toFixed(1)) : 0;

      const usiaRaw = kelompokUsiaRes[0] ?? { balita: 0, anak: 0, remaja: 0, produktif: 0, lansia: 0 };
      const kelompokUsia = [
        { kelompok: "Balita (0-5 thn)", count: usiaRaw.balita },
        { kelompok: "Anak-anak (6-12 thn)", count: usiaRaw.anak },
        { kelompok: "Remaja (13-17 thn)", count: usiaRaw.remaja },
        { kelompok: "Usia Produktif (18-59 thn)", count: usiaRaw.produktif },
        { kelompok: "Lansia (60+ thn)", count: usiaRaw.lansia },
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
          gender: genderCountRes,
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
}
