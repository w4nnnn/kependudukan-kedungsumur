export interface KartuKeluarga {
  id: string
  noKk: string
  kepalaKeluargaId?: string | null
  kepalaKeluargaNama?: string | null
  kepalaKeluargaNik?: string | null
  alamat: string
  rt: string
  rw: string
  dusun?: string | null
  kodePos?: string | null
  tanggalDikeluarkan?: string | null
  jumlahAnggota: number
  daftarAnggota?: string[]
}

export interface AnggotaPenduduk {
  id: string
  nik: string
  noKk: string
  namaLengkap: string
  tempatLahir: string
  tanggalLahir: string
  jenisKelamin: string
  alamat?: string
  rt?: string
  rw?: string
  agama: string
  statusPerkawinan: string
  shdk: string
  urutanKk?: string | null
  namaAyah?: string | null
  namaIbu?: string | null
  pendidikan?: string | null
  golonganDarah?: string | null
  pekerjaan?: string | null
  fotoUrl?: string | null
}

export interface KartuKeluargaDetail {
  id: string
  noKk: string
  kepalaKeluargaId?: string | null
  alamat: string
  rt: string
  rw: string
  dusun?: string | null
  kodePos?: string | null
  tanggalDikeluarkan?: string | null
  jumlahAnggota: number
  kepalaKeluarga?: AnggotaPenduduk | null
  anggota: AnggotaPenduduk[]
}

export interface CandidatePenduduk {
  id: string
  nik: string
  namaLengkap: string
  alamat: string
  rt?: string
  rw?: string
  shdk?: string
  noKk?: string
}
