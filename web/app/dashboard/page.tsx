"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Loader2,
  Users,
  Home,
  UserCheck,
  Briefcase,
  ShieldCheck,
  TrendingUp,
  MapPin,
  RefreshCw,
  FileText,
  Download,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from "recharts"

import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

interface StatsData {
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

const PIE_COLORS = ["#2BEE34", "#59C749", "#38bdf8", "#f59e0b", "#a855f7", "#ec4899", "#94a3b8"]

export default function DashboardPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [data, setData] = useState<StatsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRt, setSelectedRt] = useState<string>("ALL")
  const [selectedRw, setSelectedRw] = useState<string>("ALL")

  const { data: session, isPending: isSessionPending } = authClient.useSession()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isSessionPending && !session) {
      router.push("/login")
    }
  }, [mounted, session, isSessionPending, router])

  const fetchStats = async (rt = "ALL", rw = "ALL") => {
    setIsLoading(true)
    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/stats`)
      if (rt !== "ALL") url.searchParams.append("rt", rt)
      if (rw !== "ALL") url.searchParams.append("rw", rw)

      const res = await fetch(url.toString(), {
        credentials: "include",
      })

      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          setData(json.data)
        }
      } else if (res.status === 401 || res.status === 403) {
        router.push("/login")
      }
    } catch (error) {
      console.error("Gagal memuat statistik", error)
      toast.error("Gagal memuat data statistik")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchStats(selectedRt, selectedRw)
    }
  }, [session, selectedRt, selectedRw])

  const handleExportPDF = () => {
    const url = new URL(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/stats/pdf`)
    if (selectedRt !== "ALL") url.searchParams.append("rt", selectedRt)
    if (selectedRw !== "ALL") url.searchParams.append("rw", selectedRw)
    window.open(url.toString(), "_blank")
  }

  if (!mounted || isSessionPending) {
    return (
      <div className="flex h-full min-h-screen items-center justify-center p-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="flex w-full flex-col p-4 md:p-8 space-y-6">
      {/* Header Dashboard */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-6 rounded-2xl bg-card border-2 border-border/60 shadow-xs">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Dashboard & Statistik Desa
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Visualisasi demografi dan kependudukan Desa Kedungsumur secara real-time.
          </p>
        </div>

        {/* Filter Wilayah RT/RW */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-28">
            <Select value={selectedRt} onValueChange={(val) => setSelectedRt(val || "ALL")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="RT" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua RT</SelectItem>
                <SelectItem value="001">RT 001</SelectItem>
                <SelectItem value="002">RT 002</SelectItem>
                <SelectItem value="003">RT 003</SelectItem>
                <SelectItem value="004">RT 004</SelectItem>
                <SelectItem value="005">RT 005</SelectItem>
                <SelectItem value="006">RT 006</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-28">
            <Select value={selectedRw} onValueChange={(val) => setSelectedRw(val || "ALL")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="RW" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua RW</SelectItem>
                <SelectItem value="001">RW 001</SelectItem>
                <SelectItem value="002">RW 002</SelectItem>
                <SelectItem value="003">RW 003</SelectItem>
                <SelectItem value="004">RW 004</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            onClick={handleExportPDF}
            className="gap-2 font-medium shadow-xs"
            title="Unduh Laporan Resmi Statistik Kependudukan (PDF)"
          >
            <FileText className="size-4 text-primary" />
            <span>Unduh Laporan PDF</span>
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchStats(selectedRt, selectedRw)}
            disabled={isLoading}
            title="Segarkan Data"
          >
            <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {isLoading && !data ? (
        <div className="flex justify-center p-16">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : data ? (
        <>
          {/* Section 1: KPI Cards */}
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
                  {data.summary.totalPenduduk.toLocaleString("id-ID")} <span className="text-sm font-normal text-muted-foreground">Jiwa</span>
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>L: <strong className="text-foreground">{data.summary.totalLakiLaki}</strong></span>
                  <span>•</span>
                  <span>P: <strong className="text-foreground">{data.summary.totalPerempuan}</strong></span>
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
                  {data.summary.totalKK.toLocaleString("id-ID")} <span className="text-sm font-normal text-muted-foreground">KK</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Rata-rata: <strong className="text-foreground">{data.summary.rataRataAnggotaKK}</strong> Jiwa / KK
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
                  {data.summary.totalKK.toLocaleString("id-ID")} <span className="text-sm font-normal text-muted-foreground">Kepala</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Unit keluarga aktif Desa Kedungsumur
                </p>
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
                  {data.summary.totalUser.toLocaleString("id-ID")} <span className="text-sm font-normal text-muted-foreground">Akun</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Administrator & Operator Aktif
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Section 2: Grafik Distribusi Usia & Wilayah RT */}
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
                    <BarChart data={data.kelompokUsia} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="kelompok" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "8px" }}
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
                    <BarChart data={data.distribusiRt} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="rt" tickFormatter={(val) => `RT ${val}`} tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "8px" }}
                        labelStyle={{ color: "var(--foreground)", fontWeight: "bold" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                      <Bar dataKey="lakiLaki" name="Laki-laki" fill="#59C749" stackId="a" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="perempuan" name="Perempuan" fill="#38bdf8" stackId="a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section 3: Status Pernikahan, Gender & Pekerjaan */}
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
                        data={data.statusPerkawinan}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {data.statusPerkawinan.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "8px" }}
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
                        data={data.agama}
                        dataKey="count"
                        nameKey="agama"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {data.agama.map((_, index) => (
                          <Cell key={`cell-agama-${index}`} fill={PIE_COLORS[(index + 2) % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "8px" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top 5 Pekerjaan Bar Chart Horizontal */}
            <Card className="border-2 border-border/60 shadow-xs">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="size-4 text-primary" />
                  Mata Pencaharian Terbanyak
                </CardTitle>
                <CardDescription>Top pekerjaan penduduk desa</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                {data.pekerjaan.slice(0, 5).map((p, idx) => {
                  const percent = data.summary.totalPenduduk > 0
                    ? Math.round((p.count / data.summary.totalPenduduk) * 100)
                    : 0
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="truncate max-w-[180px]">{p.pekerjaan}</span>
                        <span className="font-mono text-muted-foreground">{p.count} org ({percent}%)</span>
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
        </>
      ) : null}
    </div>
  )
}
