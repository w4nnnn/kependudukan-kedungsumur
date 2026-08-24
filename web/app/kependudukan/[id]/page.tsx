"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Loader2, ArrowLeft, User, MapPin, Calendar, Briefcase, FileText, Mosque, Pencil, Users, ArrowUpRight, Home } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

interface RingkasanAnggota {
  id: string
  nik: string
  namaLengkap: string
  shdk: string
  urutanKk?: string | null
  jenisKelamin: string
  fotoUrl?: string | null
}

interface KartuKeluargaSingkat {
  id: string
  noKk: string
  alamat: string
  rt: string
  rw: string
  dusun?: string | null
}

interface Penduduk {
  id: string
  nik: string
  noKk: string
  namaLengkap: string
  tempatLahir: string
  tanggalLahir: string
  jenisKelamin: string
  alamat: string
  rt: string
  rw: string
  agama: string
  statusPerkawinan: string
  shdk?: string | null
  kartuKeluargaId?: string | null
  namaAyah?: string | null
  namaIbu?: string | null
  pendidikan?: string | null
  golonganDarah?: string | null
  pekerjaan: string
  foto?: string | null
  fotoUrl?: string | null
  kartuKeluarga?: KartuKeluargaSingkat | null
  anggotaKeluarga?: RingkasanAnggota[]
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "P"
  )
}

export default function DetailPendudukPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const routeId = params?.id

  const [data, setData] = useState<Penduduk | null>(null)
  const [isFetching, setIsFetching] = useState(true)

  const { useSession } = authClient;
  const { data: session, isPending: isSessionPending } = useSession()

  useEffect(() => {
    if (!routeId) return;

    const fetchPenduduk = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/penduduk/${routeId}`, {
          credentials: "include",
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setData(json.data);
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
  }, [routeId, router]);

  useEffect(() => {
    if (!isSessionPending && !session) {
      router.push("/login")
    }
  }, [session, isSessionPending, router])

  if (isSessionPending || isFetching) {
    return (
      <div className="flex h-full min-h-screen items-center justify-center p-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session || !data) return null

  return (
    <div className="flex min-h-screen w-full flex-col p-4 md:p-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => router.push("/kependudukan")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Detail Penduduk</h1>
              <p className="text-muted-foreground text-sm">
                Informasi lengkap data penduduk Desa Kedungsumur.
              </p>
            </div>
          </div>
          <Button onClick={() => router.push(`/kependudukan/edit/${data.id}`)} className="gap-2">
            <Pencil className="h-4 w-4" />
            Edit Data
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Card Identitas Utama */}
          <Card className="md:col-span-2">
            <CardHeader className="border-b pb-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <CardTitle>Identitas Utama</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-6 pt-6 items-center sm:items-start">
              <Avatar className="size-24 sm:size-28 rounded-2xl shrink-0 border shadow-sm">
                {data.fotoUrl ? (
                  <AvatarImage src={data.fotoUrl} alt={data.namaLengkap} className="rounded-2xl object-cover" />
                ) : null}
                <AvatarFallback className="rounded-2xl text-2xl font-semibold">{getInitials(data.namaLengkap)}</AvatarFallback>
              </Avatar>
              <div className="grid gap-6 flex-1 w-full sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Nomor Induk Kependudukan (NIK)</p>
                  <p className="text-lg font-mono">{data.nik}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Nomor Kartu Keluarga (KK)</p>
                  <p className="text-lg font-mono">{data.noKk}</p>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Nama Lengkap</p>
                  <p className="text-xl font-semibold uppercase">{data.namaLengkap}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card Data Pribadi */}
          <Card>
            <CardHeader className="border-b pb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <CardTitle>Data Pribadi</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 pt-6">
              <div className="flex items-start gap-4">
                <Calendar className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Tempat, Tanggal Lahir</p>
                  <p className="font-medium">
                    {data.tempatLahir}, {format(new Date(data.tanggalLahir), "dd MMMM yyyy", { locale: localeId })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <User className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Jenis Kelamin</p>
                  <p className="font-medium">{data.jenisKelamin}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Mosque className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Agama</p>
                  <p className="font-medium">{data.agama}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card Domisili & Status */}
          <Card>
            <CardHeader className="border-b pb-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <CardTitle>Domisili & Pekerjaan</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 pt-6">
              <div className="flex items-start gap-4">
                <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Alamat Lengkap</p>
                  <p className="font-medium">{data.alamat}</p>
                  <p className="text-sm text-muted-foreground">RT {data.rt} / RW {data.rw}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <User className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Status Perkawinan</p>
                  <p className="font-medium">{data.statusPerkawinan}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <User className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Status Hubungan di KK (SHDK)</p>
                  <p className="font-semibold">{data.shdk || "KEPALA KELUARGA"}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Briefcase className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Pekerjaan</p>
                  <p className="font-medium">{data.pekerjaan || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card Info Keluarga Singkat */}
          <Card className="md:col-span-2">
            <CardHeader className="border-b pb-4 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <div>
                  <CardTitle>Informasi Keluarga</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Anggota yang terdaftar dalam satu Kartu Keluarga (No. {data.noKk})
                  </p>
                </div>
              </div>
              {data.kartuKeluargaId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/kk/${data.kartuKeluargaId}`)}
                  className="gap-1 text-xs"
                >
                  <span>Buka Lembar KK</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="pt-6">
              {data.anggotaKeluarga && data.anggotaKeluarga.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {data.anggotaKeluarga.map((anggota) => {
                    const isCurrent = anggota.id === data.id;
                    return (
                      <div
                        key={anggota.id}
                        onClick={() => {
                          if (!isCurrent) {
                            router.push(`/kependudukan/${anggota.id}`)
                          }
                        }}
                        className={`group relative flex flex-col justify-between p-3.5 rounded-xl border-2 transition-all duration-200 ${
                          isCurrent
                            ? "border-primary bg-primary/10 shadow-md cursor-default ring-2 ring-primary/30"
                            : "border-border/60 bg-card hover:bg-muted/50 hover:border-primary/40 hover:shadow-xs cursor-pointer"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <Avatar className={`size-10 shrink-0 border-2 ${isCurrent ? "border-primary" : "border-border"}`}>
                              {anggota.fotoUrl ? (
                                <AvatarImage src={anggota.fotoUrl} alt={anggota.namaLengkap} />
                              ) : null}
                              <AvatarFallback className="text-xs font-semibold">
                                {getInitials(anggota.namaLengkap)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <p className={`text-sm font-semibold truncate ${
                                  isCurrent ? "text-primary font-bold" : "text-foreground group-hover:text-primary transition-colors"
                                }`}>
                                  {anggota.namaLengkap}
                                </p>
                                {isCurrent && (
                                  <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-bold shadow-xs shrink-0">
                                    Sedang Dilihat
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] font-mono text-muted-foreground truncate">
                                NIK: {anggota.nik}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md font-medium tracking-wide shrink-0 ${
                              anggota.shdk === "KEPALA KELUARGA"
                                ? "bg-primary/20 text-primary border border-primary/40 font-semibold"
                                : isCurrent
                                ? "bg-background text-foreground border border-border"
                                : "bg-muted text-muted-foreground border border-border/50"
                            }`}
                          >
                            {anggota.shdk}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  Belum ada anggota keluarga lain yang terhubung dengan No KK ini.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}