"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Calendar as CalendarIcon, Loader2, ArrowLeft, Save, Upload, X, Image as ImageIcon, Search, Home, FileText, CheckCircle2 } from "lucide-react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue , SelectLabel, SelectGroup } from "@/components/ui/select"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"

const formSchema = z.object({
  nik: z.string().length(16, "NIK harus tepat 16 digit"),
  noKk: z.string().length(16, "No KK harus tepat 16 digit"),
  namaLengkap: z.string().min(3, "Nama Lengkap minimal 3 karakter"),
  tempatLahir: z.string().min(3, "Tempat Lahir minimal 3 karakter"),
  tanggalLahir: z.date({
    required_error: "Pilih tanggal lahir",
  }),
  jenisKelamin: z.enum(["Laki-laki", "Perempuan"], { required_error: "Pilih jenis kelamin" }),
  alamat: z.string().min(5, "Alamat minimal 5 karakter"),
  rt: z.string().length(3, "RT harus 3 digit (contoh: 001)"),
  rw: z.string().length(3, "RW harus 3 digit (contoh: 002)"),
  agama: z.enum(["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"], { required_error: "Pilih agama" }),
  statusPerkawinan: z.enum(["Belum Kawin", "Kawin", "Cerai Hidup", "Cerai Mati"], { required_error: "Pilih status perkawinan" }),
  shdk: z.string().min(1, "Pilih status dalam keluarga"),
  pekerjaan: z.string().min(2, "Pekerjaan wajib diisi"),
})

type FormValues = z.infer<typeof formSchema>

interface CandidateKK {
  id: string
  noKk: string
  kepalaKeluargaNama: string | null
  alamat: string
  rt: string
  rw: string
  dusun?: string | null
}

export default function TambahPendudukPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [modeKk, setModeKk] = useState<"select" | "manual">("select")
  const [kkSearch, setKkSearch] = useState("")
  const [kkList, setKkList] = useState<CandidateKK[]>([])
  const [selectedKkId, setSelectedKkId] = useState<string>("")
  const [selectedKkData, setSelectedKkData] = useState<CandidateKK | null>(null)
  const [isLoadingKk, setIsLoadingKk] = useState(false)

  useEffect(() => {
    if (modeKk !== "select") return

    const fetchKkOptions = async () => {
      setIsLoadingKk(true)
      try {
        const url = new URL(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/kk`)
        url.searchParams.append("limit", "10")
        if (kkSearch) {
          if (/^\d{16}$/.test(kkSearch)) {
            url.searchParams.append("nokk", kkSearch)
          } else {
            url.searchParams.append("search", kkSearch)
          }
        }
        const res = await fetch(url.toString(), { credentials: "include" })
        if (res.ok) {
          const json = await res.json()
          if (json.success) {
            setKkList(json.data)
          }
        }
      } catch (error) {
        console.error("Gagal memuat daftar KK", error)
      } finally {
        setIsLoadingKk(false)
      }
    }

    const timer = setTimeout(fetchKkOptions, 300)
    return () => clearTimeout(timer)
  }, [modeKk, kkSearch])

  const handleSelectKk = (kkId: string | null) => {
    if (!kkId) return
    setSelectedKkId(kkId)
    const found = kkList.find((item) => item.id === kkId)
    if (found) {
      setSelectedKkData(found)
      setValue("noKk", found.noKk, { shouldValidate: true })
      setValue("alamat", found.alamat, { shouldValidate: true })
      setValue("rt", found.rt, { shouldValidate: true })
      setValue("rw", found.rw, { shouldValidate: true })
      toast.success("Data Kartu Keluarga dipilih", {
        description: `Nomor KK ${found.noKk} dan alamat berhasil diisikan.`,
      })
    }
  }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nik: "",
      noKk: "",
      namaLengkap: "",
      tempatLahir: "",
      jenisKelamin: undefined,
      alamat: "",
      rt: "",
      rw: "",
      agama: undefined,
      statusPerkawinan: undefined,
      shdk: "KEPALA KELUARGA",
      pekerjaan: "",
    },
  })

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
    setIsLoading(true)

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
      const url = `${baseUrl}/api/penduduk`
      
      const formattedData = {
        ...data,
        tanggalLahir: format(data.tanggalLahir, "yyyy-MM-dd"),
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", 
        body: JSON.stringify(formattedData),
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
          } catch (uploadError) {
            console.error("Gagal mengunggah foto penduduk:", uploadError)
          }
        }

        toast.success("Berhasil", {
          description: "Data penduduk berhasil ditambahkan.",
        })
        router.push("/kependudukan")
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
      <div className="mx-auto w-full max-w-4xl space-y-6">
        
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/kependudukan")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tambah Penduduk</h1>
            <p className="text-muted-foreground text-sm">
              Masukkan data penduduk baru sesuai dokumen resmi.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Formulir Kependudukan</CardTitle>
            <CardDescription>Semua kolom wajib diisi dengan benar.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl border bg-muted/20">
                <div className="relative group">
                  <Avatar className="size-24 rounded-2xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-background">
                    {previewUrl ? (
                      <AvatarImage src={previewUrl} alt="Preview Foto" className="rounded-2xl object-cover size-full" />
                    ) : null}
                    <AvatarFallback className="rounded-2xl bg-transparent">
                      <ImageIcon className="size-8 text-muted-foreground/50" />
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
                <div className="flex-1 space-y-1.5 text-center sm:text-left">
                  <label className="text-sm font-medium leading-none">Pasfoto Penduduk (Opsional)</label>
                  <p className="text-xs text-muted-foreground">
                    Format JPG, PNG, atau WebP. Maksimal 5MB.
                  </p>
                  <div className="pt-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      className="hidden"
                      id="foto-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-2"
                    >
                      <Upload className="size-4" />
                      {previewUrl ? "Ganti Foto" : "Pilih Foto"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-4 rounded-xl border bg-muted/20">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Pengaturan Kartu Keluarga (KK)</h3>
                    <p className="text-xs text-muted-foreground">Tentukan Kartu Keluarga tempat penduduk ini terdaftar.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setModeKk("select")}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                        modeKk === "select"
                          ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                          : "border-border/60 bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Home className="size-3.5" />
                      <span>Pilih KK Terdaftar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModeKk("manual")
                        setSelectedKkId("")
                        setSelectedKkData(null)
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                        modeKk === "manual"
                          ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                          : "border-border/60 bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <FileText className="size-3.5" />
                      <span>Input No KK Manual</span>
                    </button>
                  </div>
                </div>

                {modeKk === "select" ? (
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Cari Kartu Keluarga</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Ketik 16 digit No KK atau Nama Kepala Keluarga..."
                          className="pl-9 h-9 text-xs"
                          value={kkSearch}
                          onChange={(e) => setKkSearch(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Pilih dari Hasil Pencarian</label>
                      <Select
                        value={selectedKkId}
                        onValueChange={handleSelectKk}
                        disabled={isLoadingKk}
                      >
                        <SelectTrigger className="w-full text-xs h-9">
                          <SelectValue placeholder={isLoadingKk ? "Memuat data KK..." : "-- Pilih Kartu Keluarga Terdaftar --"} />
                        </SelectTrigger>
                        <SelectContent className="max-h-56">
                          {kkList.length === 0 ? (
                            <div className="p-3 text-xs text-muted-foreground text-center">
                              Tidak ada KK ditemukan. Silakan ketik di pencarian atau gunakan mode Input Manual.
                            </div>
                          ) : (
                            kkList.map((kk) => (
                              <SelectItem key={kk.id} value={kk.id} className="text-xs">
                                No KK: {kk.noKk} - Kepala: {kk.kepalaKeluargaNama || "Belum ada"} (RT {kk.rt}/RW {kk.rw}, {kk.alamat})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {errors.noKk && <p className="text-xs text-destructive">{errors.noKk.message}</p>}
                    </div>

                    {selectedKkData && (
                      <div className="flex items-center gap-2 p-2.5 rounded-lg border border-primary/30 bg-primary/5 text-xs text-foreground">
                        <CheckCircle2 className="size-4 text-primary shrink-0" />
                        <div>
                          <span className="font-semibold">KK Terpilih:</span> {selectedKkData.noKk} ({selectedKkData.alamat}, RT {selectedKkData.rt}/RW {selectedKkData.rw})
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-medium">Nomor Kartu Keluarga (16 Digit)</label>
                    <Input placeholder="16 Digit No KK" maxLength={16} {...register("noKk")} />
                    {errors.noKk && <p className="text-xs text-destructive">{errors.noKk.message}</p>}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Nomor Induk Kependudukan (NIK)</label>
                  <Input placeholder="16 Digit NIK" maxLength={16} {...register("nik")} />
                  {errors.nik && <p className="text-sm text-destructive">{errors.nik.message}</p>}
                </div>

                {/* Nama Lengkap */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Nama Lengkap</label>
                  <Input placeholder="Sesuai KTP/KK" {...register("namaLengkap")} />
                  {errors.namaLengkap && <p className="text-sm text-destructive">{errors.namaLengkap.message}</p>}
                </div>

                {/* Tempat & Tanggal Lahir */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tempat Lahir</label>
                  <Input placeholder="Nama Kota/Kabupaten" {...register("tempatLahir")} />
                  {errors.tempatLahir && <p className="text-sm text-destructive">{errors.tempatLahir.message}</p>}
                </div>

                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Tanggal Lahir</label>
                  <Popover>
                    <PopoverTrigger className={cn(
                        "w-full h-9 justify-start text-left font-normal inline-flex items-center rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                        !watch("tanggalLahir") && "text-muted-foreground"
                      )}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {watch("tanggalLahir") ? format(watch("tanggalLahir"), "PPP") : <span>Pilih tanggal</span>}
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
                  {errors.tanggalLahir && <p className="text-sm text-destructive">{errors.tanggalLahir.message}</p>}
                </div>

                {/* Jenis Kelamin */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Jenis Kelamin</label>
                  <Select onValueChange={(v) => setValue("jenisKelamin", v as "Laki-laki" | "Perempuan")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Jenis Kelamin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Jenis Kelamin</SelectLabel>
                        <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                        <SelectItem value="Perempuan">Perempuan</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {errors.jenisKelamin && <p className="text-sm text-destructive">{errors.jenisKelamin.message}</p>}
                </div>

                {/* Pekerjaan */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pekerjaan</label>
                  <Input placeholder="Contoh: Wiraswasta" {...register("pekerjaan")} />
                  {errors.pekerjaan && <p className="text-sm text-destructive">{errors.pekerjaan.message}</p>}
                </div>

                {/* Agama */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Agama</label>
                  <Select onValueChange={(v: any) => setValue("agama", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Agama" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Agama</SelectLabel>
                        <SelectItem value="Islam">Islam</SelectItem>
                        <SelectItem value="Kristen">Kristen</SelectItem>
                        <SelectItem value="Katolik">Katolik</SelectItem>
                        <SelectItem value="Hindu">Hindu</SelectItem>
                        <SelectItem value="Buddha">Buddha</SelectItem>
                        <SelectItem value="Konghucu">Konghucu</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {errors.agama && <p className="text-sm text-destructive">{errors.agama.message}</p>}
                </div>

                {/* Status Perkawinan */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status Perkawinan</label>
                  <Select onValueChange={(v: any) => setValue("statusPerkawinan", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Status Perkawinan</SelectLabel>
                        <SelectItem value="Belum Kawin">Belum Kawin</SelectItem>
                        <SelectItem value="Kawin">Kawin</SelectItem>
                        <SelectItem value="Cerai Hidup">Cerai Hidup</SelectItem>
                        <SelectItem value="Cerai Mati">Cerai Mati</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {errors.statusPerkawinan && <p className="text-sm text-destructive">{errors.statusPerkawinan.message}</p>}
                </div>

                {/* Status Hubungan Dalam Keluarga (SHDK) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status Hubungan di KK (SHDK)</label>
                  <Select value={watch("shdk")} onValueChange={(v: any) => setValue("shdk", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih SHDK" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>SHDK</SelectLabel>
                        <SelectItem value="KEPALA KELUARGA">Kepala Keluarga</SelectItem>
                        <SelectItem value="SUAMI">Suami</SelectItem>
                        <SelectItem value="ISTRI">Istri</SelectItem>
                        <SelectItem value="ANAK">Anak</SelectItem>
                        <SelectItem value="MENANTU">Menantu</SelectItem>
                        <SelectItem value="CUCU">Cucu</SelectItem>
                        <SelectItem value="ORANG TUA">Orang Tua</SelectItem>
                        <SelectItem value="MERTUA">Mertua</SelectItem>
                        <SelectItem value="FAMILI LAIN">Famili Lain</SelectItem>
                        <SelectItem value="LAINNYA">Lainnya</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {errors.shdk && <p className="text-sm text-destructive">{errors.shdk.message}</p>}
                </div>

                {/* Alamat Lengkap */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Alamat</label>
                  <Input placeholder="Nama jalan, gang, atau blok" {...register("alamat")} />
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
              </div>

              <div className="flex justify-end pt-6">
                <Button type="submit" disabled={isLoading} className="gap-2">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isLoading ? "Menyimpan..." : "Simpan Data"}
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
