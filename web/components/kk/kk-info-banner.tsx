"use client"

import { Home, Users, UserCheck } from "lucide-react"

interface KKInfo {
  id: string
  noKk: string
  alamat: string
  rt: string
  rw: string
  dusun?: string | null
  jumlahAnggota: number
  kepalaKeluargaNama?: string | null
}

export function KkInfoBanner({ kkInfo }: { kkInfo: KKInfo }) {
  return (
    <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-primary/10 pb-2">
        <div className="flex items-center gap-2 font-mono font-bold text-base text-primary">
          <Home className="size-4" />
          <span>No. KK: {kkInfo.noKk}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="size-3.5" />
          <span>Total Anggota: <strong className="text-foreground">{kkInfo.jumlahAnggota} Jiwa</strong></span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <UserCheck className="size-3.5 text-muted-foreground" />
          <span>Kepala Keluarga: <strong className="text-foreground">{kkInfo.kepalaKeluargaNama}</strong></span>
        </div>
        <div>
          <span>Alamat: <strong className="text-foreground">{kkInfo.alamat} (RT {kkInfo.rt}/RW {kkInfo.rw}, {kkInfo.dusun || "-"})</strong></span>
        </div>
      </div>
    </div>
  )
}
