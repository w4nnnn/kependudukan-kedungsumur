"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Calendar as CalendarIcon, Loader2, ArrowLeft, Save } from "lucide-react"
import { format, parseISO } from "date-fns"

import { cn, formatDateId } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

const formSchema = z.object({
  noKk: z.string().length(16, "Nomor KK harus tepat 16 digit"),
  alamat: z.string().min(5, "Alamat minimal 5 karakter"),
  rt: z.string().length(3, "RT harus 3 digit (contoh: 001)"),
  rw: z.string().length(3, "RW harus 3 digit (contoh: 002)"),
  dusun: z.string().optional(),
  kodePos: z.string().optional(),
  tanggalDikeluarkan: z.date().optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function EditKartuKeluargaPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const routeId = params?.id

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
      noKk: "",
      alamat: "",
      rt: "",
      rw: "",
      dusun: "",
      kodePos: "",
      tanggalDikeluarkan: undefined,
    },
  })

  useEffect(() => {
    if (!routeId) return

    const fetchKK = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/kk/${routeId}`, {
          credentials: "include",
        })

        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data) {
            const kk = json.data
            reset({
              noKk: kk.noKk,
              alamat: kk.alamat,
              rt: kk.rt,
              rw: kk.rw,
              dusun: kk.dusun || "",
              kodePos: kk.kodePos || "",
              tanggalDikeluarkan: kk.tanggalDikeluarkan ? parseISO(kk.tanggalDikeluarkan) : undefined,
            })
          }
        } else {
          toast.error("Gagal mengambil data Kartu Keluarga")
          router.push("/kk")
        }
      } catch (error) {
        toast.error("Terjadi kesalahan sistem")
        router.push("/kk")
      } finally {
        setIsFetching(false)
      }
    }

    fetchKK()
  }, [routeId, reset, router])

  async function onSubmit(data: FormValues) {
    if (!routeId) return
    setIsLoading(true)

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
      const url = `${baseUrl}/api/kk/${routeId}`
      
      const formattedData = {
        ...data,
        tanggalDikeluarkan: data.tanggalDikeluarkan
          ? format(data.tanggalDikeluarkan, "yyyy-MM-dd")
          : null,
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
          description: "Data Kartu Keluarga berhasil diperbarui.",
        })
        router.push(`/kk/${routeId}`)
      } else {
        toast.error("Gagal Memperbarui", {
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
      <div className="flex min-h-screen items-center justify-center p-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col p-4 md:p-8">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push(`/kk/${routeId}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Kartu Keluarga</h1>
            <p className="text-muted-foreground text-sm">
              Perbarui informasi alamat dan domisili KK (otomatis disinkronkan ke seluruh anggota keluarga).
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Formulir Ubah Kartu Keluarga</CardTitle>
            <CardDescription>Pastikan data yang diinput sesuai dokumen kependudukan resmi.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => router.push(`/kk/${routeId}`)}>
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading} className="gap-2">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
