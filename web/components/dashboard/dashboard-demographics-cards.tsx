"use client"

import { Briefcase } from "lucide-react"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PIE_COLORS, type StatsData } from "./types"

interface DashboardDemographicsCardsProps {
  statusPerkawinan: StatsData["statusPerkawinan"]
  agama: StatsData["agama"]
  pekerjaan: StatsData["pekerjaan"]
  totalPenduduk: number
}

export function DashboardDemographicsCards({
  statusPerkawinan,
  agama,
  pekerjaan,
  totalPenduduk,
}: DashboardDemographicsCardsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Status Perkawinan Donut */}
      <Card className="border-2 border-border/60 shadow-xs">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base">Status Pernikahan</CardTitle>
          <CardDescription>Persentase status pernikahan warga</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 flex flex-col items-center justify-center">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPerkawinan}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {statusPerkawinan.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Agama Donut */}
      <Card className="border-2 border-border/60 shadow-xs">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base">Komposisi Agama</CardTitle>
          <CardDescription>Sebaran kepercayaan penduduk</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 flex flex-col items-center justify-center">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={agama}
                  dataKey="count"
                  nameKey="agama"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {agama.map((_, index) => (
                    <Cell
                      key={`cell-agama-${index}`}
                      fill={PIE_COLORS[(index + 2) % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top 5 Pekerjaan Progress List */}
      <Card className="border-2 border-border/60 shadow-xs">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Briefcase className="size-4 text-primary" />
            Mata Pencaharian Terbanyak
          </CardTitle>
          <CardDescription>Top pekerjaan penduduk desa</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-3">
          {pekerjaan.slice(0, 5).map((p, idx) => {
            const percent =
              totalPenduduk > 0 ? Math.round((p.count / totalPenduduk) * 100) : 0
            return (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="truncate max-w-[180px]">{p.pekerjaan}</span>
                  <span className="font-mono text-muted-foreground">
                    {p.count} org ({percent}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
