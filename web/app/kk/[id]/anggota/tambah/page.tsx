"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Calendar as CalendarIcon,
  Loader2,
  ArrowLeft,
  Save,
  Upload,
  X,
  Image as ImageIcon,
  Search,
  UserCheck,
  UserPlus,
} from "lucide-react"
import { format } from "date-fns"

import { cn, formatDateId } from "@/lib/utils"
import {
  REGEX_NIK,
  REGEX_NAMA,
  REGEX_TEMPAT_LAHIR,
  REGEX_PEKERJAAN,
  blockNonNumericKeyDown,
} from "@/lib/validation"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"

const SHDK_OPTIONS = [
  "SUAMI",
  "ISTRI",
  "ANAK",
  "MENANTU",
  "CUCU",
  "ORANG TUA",
  "MERTUA",
  "FAMILI LAIN",
  "PEMBANTU",
  "LAINNYA",
  "KEPALA KELUARGA",
]

const formSchema = z.object({
  mode: z.enum(["select", "create"]),
  selectedPendudukId: z.string().optional(),
  shdk: z.string().min(1, "Pilih status hubungan dalam keluarga"),
  urutanKk: z.string().optional(),

  nik: z
    .string()
    .optional()
    .refine((val) => !val || REGEX_NIK.test(val), {
      message: "NIK harus 16 digit angka",
    }),
  namaLengkap: z
    .string()
    .optional()
    .refine((val) => !val || (val.length >= 3 && REGEX_NAMA.test(val)), {
      message: "Nama minimal 3 karakter dan hanya boleh berisi huruf/spasi/titik/petik",
    }),
  tempatLahir: z
    .string()
    .optional()
    .refine((val) => !val || (val.length >= 3 && REGEX_TEMPAT_LAHIR.test(val)), {
      message: "Tempat lahir hanya boleh berisi huruf dan spasi",
    }),
  tanggalLahir: z.date().optional(),
  jenisKelamin: z.enum(["Laki-laki", "Perempuan"]).optional(),
  agama: z.enum(["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"]).optional(),
  statusPerkawinan: z.enum(["Belum Kawin", "Kawin", "Cerai Hidup", "Cerai Mati"]).optional(),
  pekerjaan: z
    .string()
    .optional()
    .refine((val) => !val || REGEX_PEKERJAAN.test(val), {
      message: "Pekerjaan mengandung simbol yang tidak valid",
    }),
})

type FormValues = z.infer<typeof formSchema>

interface CandidatePenduduk {
  id: string
  nik: string
  namaLengkap: string
  alamat: string
  rt: string
  rw: string
  shdk?: string
  noKk?: string
}

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

export default function TambahAnggotaKKPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const kkId = params?.id

  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingKK, setIsFetchingKK] = useState(true)
  const [kkInfo, setKkInfo] = useState<KKInfo | null>(null)

  const [mode, setMode] = useState<"select" | "create">("select")
  const [candidateList, setCandidateList] = useState<CandidatePenduduk[]>([])
  const [candidateSearch, setCandidateSearch] = useState("")
  const [selectedCandidate, setSelectedCandidate] = useState<CandidatePenduduk | null>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { useSession } = authClient
  const { data: session, isPending: isSessionPending } = useSession()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mode: "select",
      selectedPendudukId: "",
      shdk: "ANAK",
      urutanKk: "1",
      nik: "",
      namaLengkap: "",
      tempatLahir: "Kedungsumur",
      tanggalLahir: undefined,
      jenisKelamin: "Laki-laki",
      agama: "Islam",
      statusPerkawinan: "Belum Kawin",
      pekerjaan: "",
    },
  })

  useEffect(() => {
    if (!isSessionPending && !session) {
      router.push("/login")
    }
  }, [session, isSessionPending, router])

  useEffect(() => {
    if (!kkId) return
    const fetchKK = async () => {
      setIsFetchingKK(true)
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/kk/${kkId}`, {
          credentials: "include",
        })
        const json = await res.json()
        if (res.ok && json.success) {
          setKkInfo({
            id: json.data.id,
            noKk: json.data.noKk,
            alamat: json.data.alamat,
            rt: json.data.rt,
            rw: json.data.rw,
            dusun: json.data.dusun,
            jumlahAnggota: json.data.anggota?.length || 0,
            kepalaKeluargaNama: json.data.kepalaKeluarga?.namaLengkap || "Belum ada",
          })
          const nextUrutan = String((json.data.anggota?.length || 0) + 1)
          setValue("urutanKk", nextUrutan)
        } else {
          toast.error("Gagal memuat data Kartu Keluarga")
          router.push("/kk")
        }
      } catch (err) {
        toast.error("Kesalahan jaringan")
      } finally {
        setIsFetchingKK(false)
      }
    }

    fetchKK()
  }, [kkId, router, setValue])

  useEffect(() => {
    if (mode !== "select") return

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
      } catch (err) {
        console.error("Gagal mencari penduduk", err)
      }
    }

    const timer = setTimeout(searchPenduduk, 300)
    return () => clearTimeout(timer)
  }, [mode, candidateSearch])

  const handleSelectCandidate = (candId: string | null) => {
    if (!candId) return
    setValue("selectedPendudukId", candId)
    const found = candidateList.find((c) => c.id === candId)
    if (found) {
      setSelectedCandidate(found)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    if (!allowedTypes.includes(file.type)) {
      toast.error("Format file tidak didukung", {
        description: "Harap unggah gambar bertipe JPG, PNG, atau WebP.",
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file terlalu besar", {
        description: "Maksimal ukuran foto adalah 5MB.",
      })
      return
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleRemovePhoto = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  async function onSubmit(data: FormValues) {
    if (!kkId || !kkInfo) return
    setIsLoading(true)

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

      if (mode === "select") {
        if (!data.selectedPendudukId) {
          toast.error("Pilih data penduduk terlebih dahulu.")
          setIsLoading(false)
          return
        }

        const res = await fetch(`${baseUrl}/api/kk/${kkId}/anggota`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            pendudukId: data.selectedPendudukId,
            shdk: data.shdk,
            urutanKk: data.urutanKk,
          }),
        })

        const json = await res.json()
        if (res.ok && json.success) {
          toast.success("Berhasil", {
            description: json.message || "Anggota keluarga berhasil ditambahkan.",
          })
          router.push(`/kk/${kkId}`)
        } else {
          toast.error("Gagal menambahkan anggota", { description: json.message })
        }
      } else {
        if (!data.nik || data.nik.length !== 16) {
          toast.error("NIK harus tepat 16 digit.")
          setIsLoading(false)
          return
        }
        if (!data.namaLengkap || data.namaLengkap.length < 3) {
          toast.error("Nama lengkap minimal 3 karakter.")
          setIsLoading(false)
          return
        }
        if (!data.tanggalLahir) {
          toast.error("Pilih tanggal lahir penduduk.")
          setIsLoading(false)
          return
        }

        const payload = {
          nik: data.nik,
          noKk: kkInfo.noKk,
          kartuKeluargaId: kkId,
          namaLengkap: data.namaLengkap,
          tempatLahir: data.tempatLahir || "Kedungsumur",
          tanggalLahir: format(data.tanggalLahir, "yyyy-MM-dd"),
          jenisKelamin: data.jenisKelamin || "Laki-laki",
          alamat: kkInfo.alamat,
          rt: kkInfo.rt,
          rw: kkInfo.rw,
          agama: data.agama || "Islam",
          statusPerkawinan: data.statusPerkawinan || "Belum Kawin",
          shdk: data.shdk || "ANAK",
          urutanKk: data.urutanKk || "1",
          pekerjaan: data.pekerjaan || "Belum/Tidak Bekerja",
        }

        const response = await fetch(`${baseUrl}/api/penduduk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        })

        const result = await response.json()
        if (response.ok && result.success) {
          const newId = result.data?.id
          if (selectedFile && newId) {
            try {
              const formData = new FormData()
              formData.append("file", selectedFile)
              await fetch(`${baseUrl}/api/penduduk/${newId}/foto`, {
                method: "POST",
                credentials: "include",
                body: formData,
              })
            } catch (uploadErr) {
              console.error("Gagal mengunggah foto:", uploadErr)
            }
          }

          toast.success("Berhasil", {
            description: "Penduduk baru berhasil dibuat dan didaftarkan ke KK ini.",
          })
          router.push(`/kk/${kkId}`)
        } else {
          toast.error("Gagal Menyimpan", {
            description: result.message || "Terjadi kesalahan server.",
          })
        }
      }
    } catch (err) {
      toast.error("Error Sistem", { description: "Gagal menghubungi server." })
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetchingKK) {
    return (
      <div className="flex h-full min-h-screen items-center justify-center p-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col p-4 md:p-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push(`/kk/${kkId}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tambah Anggota Kartu Keluarga</h1>
            <p className="text-muted-foreground text-sm">
              Tambahkan anggota keluarga ke lembar KK No. {kkInfo?.noKk}.
            </p>
          </div>
        </div>

        {kkInfo && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Nomor KK:</span>
                  <p className="font-mono font-bold text-sm text-foreground">{kkInfo.noKk}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Kepala Keluarga:</span>
                  <p className="font-semibold text-sm text-foreground uppercase">{kkInfo.kepalaKeluargaNama}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Alamat Domisili:</span>
                  <p className="font-medium text-foreground">{kkInfo.alamat} (RT {kkInfo.rt}/RW {kkInfo.rw})</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader className="border-b pb-4">
              <CardTitle>Pilih Metode Penambahan</CardTitle>
              <CardDescription>
                Pilih penduduk yang sudah terdata atau input formulir penduduk baru.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMode("select")
                    setValue("mode", "select")
                  }}
                  className={`flex items-center justify-center p-4 rounded-xl border-2 transition-all gap-3 ${
                    mode === "select"
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-xs ring-2 ring-primary/20"
                      : "border-border/60 bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <UserCheck className="size-5" />
                  <div className="text-left">
                    <p className="text-sm font-semibold">Pilih Penduduk Terdaftar</p>
                    <p className="text-xs font-normal opacity-80">Tautkan data penduduk yang sudah ada</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode("create")
                    setValue("mode", "create")
                  }}
                  className={`flex items-center justify-center p-4 rounded-xl border-2 transition-all gap-3 ${
                    mode === "create"
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-xs ring-2 ring-primary/20"
                      : "border-border/60 bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <UserPlus className="size-5" />
                  <div className="text-left">
                    <p className="text-sm font-semibold">Daftarkan Penduduk Baru</p>
                    <p className="text-xs font-normal opacity-80">Buat data baru langsung masuk KK ini</p>
                  </div>
                </button>
              </div>

              {mode === "select" ? (
                <div className="p-4 rounded-xl border bg-muted/20 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cari Penduduk</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Ketik 16 digit NIK atau Nama Penduduk..."
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
                      onValueChange={handleSelectCandidate}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="-- Pilih Penduduk yang akan dimasukkan ke KK --" />
                      </SelectTrigger>
                      <SelectContent className="max-h-56">
                        {candidateList.length === 0 ? (
                          <div className="p-3 text-xs text-muted-foreground text-center">
                            Tidak ada penduduk ditemukan. Silakan ketik nama/NIK lain atau gunakan mode Daftarkan Penduduk Baru.
                          </div>
                        ) : (
                          candidateList.map((cand) => (
                            <SelectItem key={cand.id} value={cand.id}>
                              {cand.namaLengkap} ({cand.nik}) - RT {cand.rt}/RW {cand.rw}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedCandidate && (
                    <div className="p-3 rounded-lg border bg-background text-xs space-y-1">
                      <p className="font-semibold text-foreground">Detail Penduduk Terpilih:</p>
                      <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">{selectedCandidate.namaLengkap}</span> (NIK: {selectedCandidate.nik})
                      </p>
                      <p className="text-muted-foreground">Alamat Asal: {selectedCandidate.alamat} (RT {selectedCandidate.rt}/RW {selectedCandidate.rw})</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl border bg-muted/20 space-y-6">
                  <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl border bg-background">
                    <div className="relative group">
                      <Avatar className="size-20 rounded-2xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-background">
                        {previewUrl ? (
                          <AvatarImage src={previewUrl} alt="Preview Foto" className="rounded-2xl object-cover size-full" />
                        ) : null}
                        <AvatarFallback className="rounded-2xl bg-transparent">
                          <ImageIcon className="size-6 text-muted-foreground/50" />
                        </AvatarFallback>
                      </Avatar>
                      {previewUrl && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-sm hover:bg-destructive/90 transition-colors"
                          title="Hapus foto"
                        >
                          <X className="size-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="flex-1 space-y-1 text-center sm:text-left">
                      <label className="text-xs font-medium leading-none">Pasfoto Penduduk (Opsional)</label>
                      <p className="text-[11px] text-muted-foreground">JPG, PNG, atau WebP. Maks 5MB.</p>
                      <div className="pt-1">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/jpeg,image/png,image/webp,image/jpg"
                          className="hidden"
                          id="foto-upload-anggota"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={() => fileInputRef.current?.click()}
                          className="gap-1.5"
                        >
                          <Upload className="size-3.5" />
                          {previewUrl ? "Ganti Foto" : "Pilih Foto"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-medium">Nomor Induk Kependudukan (NIK)</label>
                      <Input
                        placeholder="16 Digit NIK"
                        maxLength={16}
                        onKeyDown={blockNonNumericKeyDown}
                        {...register("nik")}
                      />
                      {errors.nik && <p className="text-xs text-destructive">{errors.nik.message}</p>}
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-medium">Nama Lengkap</label>
                      <Input placeholder="Nama Lengkap Sesuai KTP" {...register("namaLengkap")} />
                      {errors.namaLengkap && <p className="text-xs text-destructive">{errors.namaLengkap.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Tempat Lahir</label>
                      <Input placeholder="Kota/Kabupaten Lahir" {...register("tempatLahir")} />
                      {errors.tempatLahir && <p className="text-xs text-destructive">{errors.tempatLahir.message}</p>}
                    </div>

                    <div className="flex flex-col space-y-1.5">
                      <label className="text-xs font-medium">Tanggal Lahir</label>
                      <Popover>
                        <PopoverTrigger className={cn(
                            "w-full h-8 justify-start text-left font-normal inline-flex items-center rounded-lg border border-input bg-transparent px-2.5 py-1 text-xs shadow-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                            !watch("tanggalLahir") && "text-muted-foreground"
                          )}>
                          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                          {watch("tanggalLahir") ? formatDateId(watch("tanggalLahir") as Date) : <span>Pilih tanggal</span>}
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            captionLayout="dropdown"
                            selected={watch("tanggalLahir") as Date}
                            onSelect={(date) => setValue("tanggalLahir", date as Date)}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Jenis Kelamin</label>
                      <Select
                        value={watch("jenisKelamin")}
                        onValueChange={(v: any) => setValue("jenisKelamin", v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
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
                        value={watch("agama")}
                        onValueChange={(v: any) => setValue("agama", v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
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
                        value={watch("statusPerkawinan")}
                        onValueChange={(v: any) => setValue("statusPerkawinan", v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Pilih Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Belum Kawin">Belum Kawin</SelectItem>
                          <SelectItem value="Kawin">Kawin</SelectItem>
                          <SelectItem value="Cerai Hidup">Cerai Hidup</SelectItem>
                          <SelectItem value="Cerai Mati">Cerai Mati</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Pekerjaan</label>
                      <Input placeholder="Contoh: Pelajar/Mahasiswa" {...register("pekerjaan")} />
                      {errors.pekerjaan && <p className="text-xs text-destructive">{errors.pekerjaan.message}</p>}
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl border bg-muted/10 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Kedudukan dalam Kartu Keluarga</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Status Hubungan di KK (SHDK)</label>
                    <Select
                      value={watch("shdk")}
                      onValueChange={(v) => setValue("shdk", v || "ANAK")}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Pilih SHDK" />
                      </SelectTrigger>
                      <SelectContent className="max-h-56">
                        <SelectGroup>
                          <SelectLabel>Pilihan SHDK</SelectLabel>
                          {SHDK_OPTIONS.map((shdk) => (
                            <SelectItem key={shdk} value={shdk} className="text-xs">
                              {shdk}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {errors.shdk && <p className="text-xs text-destructive">{errors.shdk.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Nomor Urut di KK</label>
                    <Select
                      value={watch("urutanKk")}
                      onValueChange={(v) => setValue("urutanKk", v || undefined)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Urutan" />
                      </SelectTrigger>
                      <SelectContent className="max-h-56">
                        {Array.from({ length: 15 }, (_, i) => String(i + 1)).map((num) => (
                          <SelectItem key={num} value={num} className="text-xs">
                            Nomor Urut {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => router.push(`/kk/${kkId}`)}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isLoading ? "Menyimpan..." : "Simpan Anggota Keluarga"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
