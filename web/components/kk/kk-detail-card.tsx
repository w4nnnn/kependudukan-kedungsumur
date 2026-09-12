"use client"

import { UserCheck, MapPin, Home, Calendar } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { formatDateId } from "@/lib/utils"
import type { KartuKeluargaDetail } from "./types"

export function KkDetailCard({ data }: { data: KartuKeluargaDetail }) {
  return (
    <Card className="border-2 border-primary/20 shadow-md">
      <div className="bg-muted/40 border-b p-6 text-center space-y-1">
        <h2 className="text-xl font-extrabold tracking-wider uppercase text-foreground">
          KARTU KELUARGA
        </h2>
        <p className="text-2xl font-mono font-bold tracking-widest text-primary">
          No. {data.noKk}
        </p>
      </div>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/10 p-4 rounded-xl border">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <UserCheck className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
              <div>
                <span className="text-xs text-muted-foreground uppercase font-semibold">
                  Nama Kepala Keluarga
                </span>
                <p className="font-semibold text-base text-foreground uppercase">
                  {data.kepalaKeluarga?.namaLengkap || data.kepalaKeluargaId || "Belum Ditentukan"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
              <div>
                <span className="text-xs text-muted-foreground uppercase font-semibold">
                  Alamat Domisili
                </span>
                <p className="font-medium text-foreground">
                  {data.alamat} {data.dusun ? `(${data.dusun})` : ""}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Home className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
              <div>
                <span className="text-xs text-muted-foreground uppercase font-semibold">
                  RT / RW & Wilayah
                </span>
                <p className="font-medium text-foreground">
                  RT {data.rt} / RW {data.rw}, Desa Kedungsumur {data.kodePos ? `(${data.kodePos})` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
              <div>
                <span className="text-xs text-muted-foreground uppercase font-semibold">
                  Tanggal Terbit KK
                </span>
                <p className="font-medium text-foreground">
                  {data.tanggalDikeluarkan
                    ? formatDateId(data.tanggalDikeluarkan, "dd MMMM yyyy")
                    : "Tidak Tercatat"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
