export interface Penduduk {
  id: string
  nik: string
  noKk: string
  namaLengkap: string
  tempatLahir: string
  tanggalLahir: string
  jenisKelamin: string
  alamat: string
  rt: string
  rw: string
  agama: string
  statusPerkawinan: string
  pekerjaan: string
  foto?: string | null
  fotoUrl?: string | null
  shdk?: string | null
  kartuKeluargaId?: string | null
  namaAyah?: string | null
  namaIbu?: string | null
  pendidikan?: string | null
  golonganDarah?: string | null
  kartuKeluarga?: KartuKeluargaSingkat | null
  anggotaKeluarga?: RingkasanAnggota[]
}

export interface RingkasanAnggota {
  id: string
  nik: string
  namaLengkap: string
  shdk: string
  urutanKk?: string | null
  jenisKelamin: string
  fotoUrl?: string | null
}

export interface KartuKeluargaSingkat {
  id: string
  noKk: string
  alamat: string
  rt: string
  rw: string
  dusun?: string | null
}

export interface CandidateKK {
  id: string
  noKk: string
  kepalaKeluargaNama: string | null
  alamat: string
  rt: string
  rw: string
  dusun?: string | null
}

export interface ImportResult {
  totalDiproses: number
  berhasil: number
  dilewati: number
  errors: string[]
}
