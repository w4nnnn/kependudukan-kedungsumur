"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Calendar as CalendarIcon, Loader2, ArrowLeft, Save } from "lucide-react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue , SelectLabel, SelectGroup } from "@/components/ui/select"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner" // Asumsi menggunakan sonner dari shadcn

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
  pekerjaan: z.string().min(2, "Pekerjaan wajib diisi"),
})

type FormValues = z.infer<typeof formSchema>

export default function EditPendudukPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = React.use(params)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
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
      pekerjaan: "",
    },
  })

  useEffect(() => {
    if (!id) return;

    const fetchPenduduk = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/penduduk/${id}`, {
          credentials: "include",
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const data = json.data;
            
            if (data.tanggalLahir) {
              data.tanggalLahir = new Date(data.tanggalLahir);
            }
            
            const safeData = {
              ...data,
              pekerjaan: data.pekerjaan || "",
            };
            
            reset(safeData);
          } else {
            toast.error("Gagal memuat data penduduk");
            router.push("/kependudukan");
          }
        } else {
          toast.error("Gagal memuat data penduduk");
          router.push("/kependudukan");
        }
      } catch (error) {
        toast.error("Terjadi kesalahan sistem");
        router.push("/kependudukan");
      } finally {
        setIsFetching(false);
      }
    };

    fetchPenduduk();
  }, [id, reset, router]);

  async function onSubmit(data: FormValues) {
    setIsLoading(true)

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/penduduk/${id}`
      
      const formattedData = {
        ...data,
        tanggalLahir: format(data.tanggalLahir, "yyyy-MM-dd"),
      }

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", 
        body: JSON.stringify(formattedData),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success("Berhasil", {
          description: "Data penduduk berhasil diperbarui.",
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

  if (isFetching) {
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
          <Button variant="outline" size="icon" onClick={() => router.push("/kependudukan")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Data Penduduk</h1>
            <p className="text-muted-foreground text-sm">
              Ubah informasi penduduk Desa Kedungsumur.
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
