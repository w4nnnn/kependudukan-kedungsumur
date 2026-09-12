import * as z from "zod"
import {
  REGEX_NIK,
  REGEX_NO_KK,
  REGEX_RT_RW,
  REGEX_KODE_POS,
  REGEX_NAMA,
  REGEX_TEMPAT_LAHIR,
  REGEX_ALAMAT,
  REGEX_PEKERJAAN,
  REGEX_DUSUN,
} from "@/lib/validation"

export const editKkFormSchema = z.object({
  noKk: z
    .string()
    .length(16, "Nomor KK harus tepat 16 digit")
    .regex(REGEX_NO_KK, "Nomor KK hanya boleh berisi 16 digit angka"),
  alamat: z
    .string()
    .min(5, "Alamat minimal 5 karakter")
    .regex(REGEX_ALAMAT, "Alamat mengandung simbol yang tidak valid"),
  rt: z
    .string()
    .length(3, "RT harus 3 digit (contoh: 001)")
    .regex(REGEX_RT_RW, "RT harus berupa 3 digit angka"),
  rw: z
    .string()
    .length(3, "RW harus 3 digit (contoh: 002)")
    .regex(REGEX_RT_RW, "RW harus berupa 3 digit angka"),
  dusun: z
    .string()
    .optional()
    .refine((val) => !val || REGEX_DUSUN.test(val), {
      message: "Dusun mengandung simbol yang tidak valid",
    }),
  kodePos: z
    .string()
    .optional()
    .refine((val) => !val || REGEX_KODE_POS.test(val), {
      message: "Kode Pos harus 5 digit angka",
    }),
  tanggalDikeluarkan: z.date().optional(),
  kepalaKeluargaId: z.string().optional().nullable(),
})

export const tambahKkFormSchema = editKkFormSchema.extend({
  modeKepala: z.enum(["none", "select", "create"]),
  selectedPendudukId: z.string().optional(),

  nikBaru: z
    .string()
    .optional()
    .refine((val) => !val || REGEX_NIK.test(val), {
      message: "NIK hanya boleh berisi 16 digit angka",
    }),
  namaBaru: z
    .string()
    .optional()
    .refine((val) => !val || REGEX_NAMA.test(val), {
      message: "Nama hanya boleh berisi huruf, spasi, titik, atau tanda petik",
    }),
  tempatLahirBaru: z
    .string()
    .optional()
    .refine((val) => !val || REGEX_TEMPAT_LAHIR.test(val), {
      message: "Tempat lahir hanya boleh berisi huruf dan spasi",
    }),
  tanggalLahirBaru: z.date().optional(),
  jenisKelaminBaru: z.enum(["Laki-laki", "Perempuan"]).optional(),
  agamaBaru: z.enum(["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"]).optional(),
  statusPerkawinanBaru: z.enum(["Belum Kawin", "Kawin", "Cerai Hidup", "Cerai Mati"]).optional(),
  pekerjaanBaru: z
    .string()
    .optional()
    .refine((val) => !val || REGEX_PEKERJAAN.test(val), {
      message: "Pekerjaan mengandung simbol yang tidak valid",
    }),
})

export const tambahAnggotaKkFormSchema = z.object({
  mode: z.enum(["select", "create"]),
  selectedPendudukId: z.string().optional(),
  shdk: z.string().min(1, "Pilih status hubungan dalam keluarga"),
  urutanKk: z.string().optional(),

  nik: z
    .string()
    .optional()
    .refine((val) => !val || REGEX_NIK.test(val), {
      message: "NIK harus 16 digit angka",
    }),
  namaLengkap: z
    .string()
    .optional()
    .refine((val) => !val || (val.length >= 3 && REGEX_NAMA.test(val)), {
      message: "Nama minimal 3 karakter dan hanya boleh berisi huruf/spasi/titik/petik",
    }),
  tempatLahir: z
    .string()
    .optional()
    .refine((val) => !val || (val.length >= 3 && REGEX_TEMPAT_LAHIR.test(val)), {
      message: "Tempat lahir hanya boleh berisi huruf dan spasi",
    }),
  tanggalLahir: z.date().optional(),
  jenisKelamin: z.enum(["Laki-laki", "Perempuan"]).optional(),
  agama: z.enum(["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"]).optional(),
  statusPerkawinan: z.enum(["Belum Kawin", "Kawin", "Cerai Hidup", "Cerai Mati"]).optional(),
  pekerjaan: z
    .string()
    .optional()
    .refine((val) => !val || REGEX_PEKERJAAN.test(val), {
      message: "Pekerjaan mengandung simbol yang tidak valid",
    }),
})

export type EditKkFormValues = z.infer<typeof editKkFormSchema>
export type TambahKkFormValues = z.infer<typeof tambahKkFormSchema>
export type TambahAnggotaKkFormValues = z.infer<typeof tambahAnggotaKkFormSchema>
