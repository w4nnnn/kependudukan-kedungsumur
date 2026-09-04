"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Calendar as CalendarIcon, Loader2, ArrowLeft, Save, UserCheck, UserPlus, Users, Search } from "lucide-react"
import { format } from "date-fns"

import { cn, formatDateId } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select"
import { toast } from "sonner"

const formSchema = z.object({
  noKk: z.string().length(16, "Nomor KK harus tepat 16 digit"),
  alamat: z.string().min(5, "Alamat minimal 5 karakter"),
  rt: z.string().length(3, "RT harus 3 digit (contoh: 001)"),
  rw: z.string().length(3, "RW harus 3 digit (contoh: 002)"),
  dusun: z.string().optional(),
  kodePos: z.string().optional(),
  tanggalDikeluarkan: z.date().optional(),

  // Opsi Anggota / Kepala Keluarga
  modeKepala: z.enum(["none", "select", "create"]),
  selectedPendudukId: z.string().optional(),

  // Input data penduduk baru jika modeKepala === 'create'
  nikBaru: z.string().optional(),
  namaBaru: z.string().optional(),
  tempatLahirBaru: z.string().optional(),
  tanggalLahirBaru: z.date().optional(),
  jenisKelaminBaru: z.enum(["Laki-laki", "Perempuan"]).optional(),
  agamaBaru: z.enum(["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"]).optional(),
  statusPerkawinanBaru: z.enum(["Belum Kawin", "Kawin", "Cerai Hidup", "Cerai Mati"]).optional(),
  pekerjaanBaru: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface CandidatePenduduk {
  id: string
  nik: string
  namaLengkap: string
  alamat: string
}

export default function TambahKartuKeluargaPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [candidateList, setCandidateList] = useState<CandidatePenduduk[]>([])
  const [candidateSearch, setCandidateSearch] = useState("")

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      noKk: "",
      alamat: "",
      rt: "",
      rw: "",
      dusun: "Dusun Krajan",
      kodePos: "65171",
      tanggalDikeluarkan: undefined,
      modeKepala: "create",
      selectedPendudukId: "",
      nikBaru: "",
      namaBaru: "",
      tempatLahirBaru: "",
      tanggalLahirBaru: undefined,
      jenisKelaminBaru: "Laki-laki",
      agamaBaru: "Islam",
      statusPerkawinanBaru: "Kawin",
      pekerjaanBaru: "",
    },
  })

  const modeKepala = watch("modeKepala")

  useEffect(() => {
    if (modeKepala === "select") {
      const searchPenduduk = async () => {
        try {
          const url = new URL(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/penduduk`)
          url.searchParams.append("limit", "10")
          if (candidateSearch) {
            if (/^\d{16}$/.test(candidateSearch)) {
              url.searchParams.append("nik", candidateSearch)
            } else {
              url.searchParams.append("search", candidateSearch)
            }
          }
          const res = await fetch(url.toString(), { credentials: "include" })
          if (res.ok) {
            const json = await res.json()
            if (json.success) {
              setCandidateList(json.data)
            }
          }
        } catch (error) {
          console.error("Gagal memuat penduduk", error)
        }
      }

      const timer = setTimeout(searchPenduduk, 300)
      return () => clearTimeout(timer)
    }
  }, [modeKepala, candidateSearch])

  async function onSubmit(data: FormValues) {
    setIsLoading(true)

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
      const url = `${baseUrl}/api/kk`
      
      let payload: any = {
        noKk: data.noKk,
        alamat: data.alamat,
        rt: data.rt,
        rw: data.rw,
        dusun: data.dusun,
        kodePos: data.kodePos,
        tanggalDikeluarkan: data.tanggalDikeluarkan
          ? format(data.tanggalDikeluarkan, "yyyy-MM-dd")
          : undefined,
        modeKepala: data.modeKepala,
      }

      if (data.modeKepala === "select") {
        if (!data.selectedPendudukId) {
          toast.error("Pilih data penduduk kepala keluarga terlebih dahulu.")
          setIsLoading(false)
          return
        }
        payload.selectedPendudukId = data.selectedPendudukId
      } else if (data.modeKepala === "create") {
        if (!data.nikBaru || data.nikBaru.length !== 16) {
          toast.error("NIK Kepala Keluarga harus 16 digit.")
          setIsLoading(false)
          return
        }
        if (!data.namaBaru || data.namaBaru.length < 3) {
          toast.error("Nama Kepala Keluarga minimal 3 karakter.")
          setIsLoading(false)
          return
        }
        if (!data.tanggalLahirBaru) {
          toast.error("Pilih tanggal lahir Kepala Keluarga.")
          setIsLoading(false)
          return
        }

        payload.newPenduduk = {
          nik: data.nikBaru,
          namaLengkap: data.namaBaru,
          tempatLahir: data.tempatLahirBaru || "Kedungsumur",
          tanggalLahir: format(data.tanggalLahirBaru, "yyyy-MM-dd"),
          jenisKelamin: data.jenisKelaminBaru || "Laki-laki",
          agama: data.agamaBaru || "Islam",
          statusPerkawinan: data.statusPerkawinanBaru || "Kawin",
          pekerjaan: data.pekerjaanBaru || "Wiraswasta",
        }
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", 
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success("Berhasil", {
          description: "Data Kartu Keluarga baru berhasil dibuat.",
        })
        router.push(`/kk/${result.data.id}`)
      } else {
        toast.error("Gagal Menyimpan", {
          description: result.message || "Terjadi kesalahan pada server.",
        })
      }
    } catch (error) {
      toast.error("Error Sistem", {
        description: "Gagal menghubungi server.",
      })
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col p-4 md:p-8">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/kk")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tambah Kartu Keluarga</h1>
            <p className="text-muted-foreground text-sm">
              Buat data master KK baru serta inisialisasi Kepala Keluarga secara langsung.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Card 1: Data Master KK */}
          <Card>
            <CardHeader className="border-b pb-4">
              <CardTitle>1. Data Master Kartu Keluarga (KK)</CardTitle>
              <CardDescription>Nomor KK dan alamat domisili utama keluarga.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* No KK */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Nomor Kartu Keluarga (16 Digit)</label>
                  <Input placeholder="Contoh: 3573010101800001" maxLength={16} {...register("noKk")} />
                  {errors.noKk && <p className="text-sm text-destructive">{errors.noKk.message}</p>}
                </div>

                {/* Alamat */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Alamat Domisili Keluarga</label>
                  <Input placeholder="Nama jalan, gang, atau nomor rumah" {...register("alamat")} />
                  {errors.alamat && <p className="text-sm text-destructive">{errors.alamat.message}</p>}
                </div>

                {/* RT & RW */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">RT</label>
                  <Input placeholder="001" maxLength={3} {...register("rt")} />
                  {errors.rt && <p className="text-sm text-destructive">{errors.rt.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">RW</label>
                  <Input placeholder="002" maxLength={3} {...register("rw")} />
                  {errors.rw && <p className="text-sm text-destructive">{errors.rw.message}</p>}
                </div>

                {/* Dusun */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Dusun</label>
                  <Input placeholder="Contoh: Dusun Krajan" {...register("dusun")} />
                </div>

                {/* Kode Pos */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kode Pos</label>
                  <Input placeholder="65171" maxLength={10} {...register("kodePos")} />
                </div>

                {/* Tanggal Dikeluarkan */}
                <div className="flex flex-col space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Tanggal Dikeluarkan KK (Opsional)</label>
                  <Popover>
                    <PopoverTrigger className={cn(
                        "w-full h-9 justify-start text-left font-normal inline-flex items-center rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                        !watch("tanggalDikeluarkan") && "text-muted-foreground"
                      )}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {watch("tanggalDikeluarkan") ? formatDateId(watch("tanggalDikeluarkan") as Date) : <span>Pilih tanggal terbit KK</span>}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        captionLayout="dropdown"
                        selected={watch("tanggalDikeluarkan") as Date}
                        onSelect={(date) => setValue("tanggalDikeluarkan", date as Date)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Pengaturan Anggota / Kepala Keluarga */}
          <Card>
            <CardHeader className="border-b pb-4">
              <CardTitle>2. Pengaturan Kepala Keluarga</CardTitle>
              <CardDescription>Tentukan Kepala Keluarga saat membuat Kartu Keluarga ini.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setValue("modeKepala", "create")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all text-center gap-2 ${
                    modeKepala === "create"
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-xs ring-2 ring-primary/20"
                      : "border-border/60 bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <UserPlus className="size-5" />
                  <span className="text-xs">Input Penduduk Baru</span>
                </button>

                <button
                  type="button"
                  onClick={() => setValue("modeKepala", "select")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all text-center gap-2 ${
                    modeKepala === "select"
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-xs ring-2 ring-primary/20"
                      : "border-border/60 bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <UserCheck className="size-5" />
                  <span className="text-xs">Pilih Penduduk yang Ada</span>
                </button>

                <button
                  type="button"
                  onClick={() => setValue("modeKepala", "none")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all text-center gap-2 ${
                    modeKepala === "none"
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-xs ring-2 ring-primary/20"
                      : "border-border/60 bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Users className="size-5" />
                  <span className="text-xs">Nanti Saja</span>
                </button>
              </div>

              {/* Mode 1: Pilih Penduduk Existing */}
              {modeKepala === "select" && (
                <div className="p-4 rounded-xl border bg-muted/20 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cari Data Penduduk</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Ketik nama atau 16 digit NIK..."
                        className="pl-9"
                        value={candidateSearch}
                        onChange={(e) => setCandidateSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Pilih Penduduk</label>
                    <Select
                      value={watch("selectedPendudukId")}
                      onValueChange={(val) => setValue("selectedPendudukId", val || "")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="-- Pilih Penduduk untuk dijadikan Kepala Keluarga --" />
                      </SelectTrigger>
                      <SelectContent className="max-h-56">
                        {candidateList.map((cand) => (
                          <SelectItem key={cand.id} value={cand.id}>
                            {cand.namaLengkap} ({cand.nik}) - {cand.alamat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Mode 2: Input Penduduk Baru */}
              {modeKepala === "create" && (
                <div className="p-4 rounded-xl border bg-muted/20 space-y-4">
                  <h4 className="text-sm font-semibold text-foreground border-b pb-2">
                    Formulir Kepala Keluarga Baru
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">NIK Kepala Keluarga (16 Digit)</label>
                      <Input placeholder="16 Digit NIK" maxLength={16} {...register("nikBaru")} />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Nama Lengkap</label>
                      <Input placeholder="Nama Lengkap Sesuai KTP" {...register("namaBaru")} />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Tempat Lahir</label>
                      <Input placeholder="Kota/Kabupaten Lahir" {...register("tempatLahirBaru")} />
                    </div>

                    <div className="flex flex-col space-y-1.5">
                      <label className="text-xs font-medium">Tanggal Lahir</label>
                      <Popover>
                        <PopoverTrigger className={cn(
                            "w-full h-9 justify-start text-left font-normal inline-flex items-center rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                            !watch("tanggalLahirBaru") && "text-muted-foreground"
                          )}>
                          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                          {watch("tanggalLahirBaru") ? formatDateId(watch("tanggalLahirBaru") as Date) : <span>Pilih tanggal</span>}
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            captionLayout="dropdown"
                            selected={watch("tanggalLahirBaru") as Date}
                            onSelect={(date) => setValue("tanggalLahirBaru", date as Date)}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Jenis Kelamin</label>
                      <Select
                        value={watch("jenisKelaminBaru")}
                        onValueChange={(v: any) => setValue("jenisKelaminBaru", v)}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Pilih Jenis Kelamin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                          <SelectItem value="Perempuan">Perempuan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Agama</label>
                      <Select
                        value={watch("agamaBaru")}
                        onValueChange={(v: any) => setValue("agamaBaru", v)}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Pilih Agama" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Islam">Islam</SelectItem>
                          <SelectItem value="Kristen">Kristen</SelectItem>
                          <SelectItem value="Katolik">Katolik</SelectItem>
                          <SelectItem value="Hindu">Hindu</SelectItem>
                          <SelectItem value="Buddha">Buddha</SelectItem>
                          <SelectItem value="Konghucu">Konghucu</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Status Perkawinan</label>
                      <Select
                        value={watch("statusPerkawinanBaru")}
                        onValueChange={(v: any) => setValue("statusPerkawinanBaru", v)}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Pilih Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Kawin">Kawin</SelectItem>
                          <SelectItem value="Belum Kawin">Belum Kawin</SelectItem>
                          <SelectItem value="Cerai Hidup">Cerai Hidup</SelectItem>
                          <SelectItem value="Cerai Mati">Cerai Mati</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Pekerjaan</label>
                      <Input placeholder="Contoh: Wiraswasta" {...register("pekerjaanBaru")} />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => router.push("/kk")}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isLoading ? "Menyimpan..." : "Simpan & Buat Kartu Keluarga"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
