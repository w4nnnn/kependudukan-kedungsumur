export interface StatsData {
  summary: {
    totalPenduduk: number
    totalKK: number
    totalLakiLaki: number
    totalPerempuan: number
    rataRataAnggotaKK: number
    totalUser: number
  }
  gender: { jenisKelamin: string; count: number }[]
  kelompokUsia: { kelompok: string; count: number }[]
  distribusiRt: { rt: string; total: number; lakiLaki: number; perempuan: number }[]
  distribusiRw: { rw: string; total: number; lakiLaki: number; perempuan: number }[]
  statusPerkawinan: { status: string; count: number }[]
  agama: { agama: string; count: number }[]
  pekerjaan: { pekerjaan: string; count: number }[]
  shdk: { shdk: string; count: number }[]
}

export const PIE_COLORS = [
  "#2BEE34",
  "#59C749",
  "#38bdf8",
  "#f59e0b",
  "#a855f7",
  "#ec4899",
  "#94a3b8",
]
