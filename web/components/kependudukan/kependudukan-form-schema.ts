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

export const AGAMA_OPTIONS = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"] as const
export const STATUS_PERKAWINAN_OPTIONS = ["Belum Kawin", "Kawin", "Cerai Hidup", "Cerai Mati"] as const
export const SHDK_OPTIONS = [
  "KEPALA KELUARGA",
  "SUAMI",
  "ISTRI",
  "ANAK",
  "MENANTU",
  "CUCU",
  "ORANGTUA",
  "MERTUA",
  "FAMILI LAIN",
  "PEMBANTU",
  "LAINNYA",
] as const

export const editPendudukFormSchema = z.object({
  nik: z
    .string()
    .length(16, "NIK harus tepat 16 digit")
    .regex(REGEX_NIK, "NIK hanya boleh berisi 16 digit angka"),
  noKk: z
    .string()
    .length(16, "Nomor KK harus tepat 16 digit")
    .regex(REGEX_NO_KK, "Nomor KK hanya boleh berisi 16 digit angka"),
  namaLengkap: z
    .string()
    .min(3, "Nama Lengkap minimal 3 karakter")
    .regex(REGEX_NAMA, "Nama hanya boleh berisi huruf, spasi, titik, atau tanda petik"),
  tempatLahir: z
    .string()
    .min(3, "Tempat Lahir minimal 3 karakter")
    .regex(REGEX_TEMPAT_LAHIR, "Tempat lahir hanya boleh berisi huruf dan spasi"),
  tanggalLahir: z.date({
    required_error: "Pilih tanggal lahir",
  }),
  jenisKelamin: z.enum(["Laki-laki", "Perempuan"], { required_error: "Pilih jenis kelamin" }),
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
  agama: z.enum(AGAMA_OPTIONS, { required_error: "Pilih agama" }),
  statusPerkawinan: z.enum(STATUS_PERKAWINAN_OPTIONS, { required_error: "Pilih status perkawinan" }),
  shdk: z.string().min(1, "Pilih status dalam keluarga"),
  pekerjaan: z
    .string()
    .min(2, "Pekerjaan wajib diisi")
    .regex(REGEX_PEKERJAAN, "Pekerjaan mengandung simbol yang tidak valid"),
})

export const tambahPendudukFormSchema = editPendudukFormSchema.extend({
  kkAlamat: z
    .string()
    .optional()
    .refine((val) => !val || (val.length >= 5 && REGEX_ALAMAT.test(val)), {
      message: "Alamat KK minimal 5 karakter dan tidak mengandung simbol ilegal",
    }),
  kkRt: z
    .string()
    .optional()
    .refine((val) => !val || REGEX_RT_RW.test(val), {
      message: "RT KK harus 3 digit angka (contoh: 001)",
    }),
  kkRw: z
    .string()
    .optional()
    .refine((val) => !val || REGEX_RT_RW.test(val), {
      message: "RW KK harus 3 digit angka (contoh: 002)",
    }),
  kkDusun: z
    .string()
    .optional()
    .refine((val) => !val || REGEX_DUSUN.test(val), {
      message: "Dusun mengandung simbol yang tidak valid",
    }),
  kkKodePos: z
    .string()
    .optional()
    .refine((val) => !val || REGEX_KODE_POS.test(val), {
      message: "Kode Pos harus 5 digit angka",
    }),
  kkTanggalDikeluarkan: z.date().optional(),
})

export type EditPendudukFormValues = z.infer<typeof editPendudukFormSchema>
export type TambahPendudukFormValues = z.infer<typeof tambahPendudukFormSchema>
