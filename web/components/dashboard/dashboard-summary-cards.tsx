"use client"

import { Users, Home, UserCheck, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { StatsData } from "./types"

export function DashboardSummaryCards({ summary }: { summary: StatsData["summary"] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Penduduk */}
      <Card className="border-2 border-border/60 shadow-xs hover:border-primary/40 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Penduduk
          </CardTitle>
          <Users className="size-4 text-primary" />
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-2xl font-bold text-foreground">
            {summary.totalPenduduk.toLocaleString("id-ID")}{" "}
            <span className="text-sm font-normal text-muted-foreground">Jiwa</span>
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              L: <strong className="text-foreground">{summary.totalLakiLaki}</strong>
            </span>
            <span>•</span>
            <span>
              P: <strong className="text-foreground">{summary.totalPerempuan}</strong>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Total Kartu Keluarga */}
      <Card className="border-2 border-border/60 shadow-xs hover:border-primary/40 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Kartu Keluarga
          </CardTitle>
          <Home className="size-4 text-primary" />
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-2xl font-bold text-foreground">
            {summary.totalKK.toLocaleString("id-ID")}{" "}
            <span className="text-sm font-normal text-muted-foreground">KK</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Rata-rata: <strong className="text-foreground">{summary.rataRataAnggotaKK}</strong> Jiwa / KK
          </p>
        </CardContent>
      </Card>

      {/* Kepala Keluarga */}
      <Card className="border-2 border-border/60 shadow-xs hover:border-primary/40 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Kepala Keluarga Terdaftar
          </CardTitle>
          <UserCheck className="size-4 text-primary" />
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-2xl font-bold text-foreground">
            {summary.totalKK.toLocaleString("id-ID")}{" "}
            <span className="text-sm font-normal text-muted-foreground">Kepala</span>
          </p>
          <p className="text-xs text-muted-foreground">Unit keluarga aktif Desa Kedungsumur</p>
        </CardContent>
      </Card>

      {/* Petugas / Admin */}
      <Card className="border-2 border-border/60 shadow-xs hover:border-primary/40 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Petugas Sistem
          </CardTitle>
          <ShieldCheck className="size-4 text-primary" />
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-2xl font-bold text-foreground">
            {summary.totalUser.toLocaleString("id-ID")}{" "}
            <span className="text-sm font-normal text-muted-foreground">Akun</span>
          </p>
          <p className="text-xs text-muted-foreground">Administrator & Operator Aktif</p>
        </CardContent>
      </Card>
    </div>
  )
}
