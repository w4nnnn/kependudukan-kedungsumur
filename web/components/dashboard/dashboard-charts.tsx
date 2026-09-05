"use client"

import { TrendingUp, MapPin } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { StatsData } from "./types"

interface DashboardChartsProps {
  kelompokUsia: StatsData["kelompokUsia"]
  distribusiRt: StatsData["distribusiRt"]
}

export function DashboardCharts({ kelompokUsia, distribusiRt }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Kelompok Usia Bar Chart */}
      <Card className="border-2 border-border/60 shadow-xs">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" />
            Piramida & Distribusi Kelompok Usia
          </CardTitle>
          <CardDescription>
            Komposisi rentang usia balita, anak, remaja, produktif, dan lansia.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kelompokUsia} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="kelompok" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "var(--foreground)", fontWeight: "bold" }}
                />
                <Bar dataKey="count" name="Jumlah Jiwa" fill="#2BEE34" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Distribusi RT Stacked Bar Chart */}
      <Card className="border-2 border-border/60 shadow-xs">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="size-4 text-primary" />
            Kepadatan Penduduk per RT
          </CardTitle>
          <CardDescription>
            Jumlah warga terdaftar per rukun tetangga (RT 001 - 006).
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribusiRt} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="rt" tickFormatter={(val) => `RT ${val}`} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "var(--foreground)", fontWeight: "bold" }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                <Bar
                  dataKey="lakiLaki"
                  name="Laki-laki"
                  fill="#59C749"
                  stackId="a"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="perempuan"
                  name="Perempuan"
                  fill="#38bdf8"
                  stackId="a"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
