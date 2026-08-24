"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Calendar as CalendarIcon, Loader2, ArrowLeft, Save, Upload, X, Image as ImageIcon } from "lucide-react"
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

export default function TambahPendudukPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* NIK & KK */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nomor Induk Kependudukan (NIK)</label>
                  <Input placeholder="16 Digit NIK" maxLength={16} {...register("nik")} />
                  {errors.nik && <p className="text-sm text-destructive">{errors.nik.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nomor Kartu Keluarga (KK)</label>
                  <Input placeholder="16 Digit No KK" maxLength={16} {...register("noKk")} />
                  {errors.noKk && <p className="text-sm text-destructive">{errors.noKk.message}</p>}
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
