"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Loader2, ArrowLeft, User, MapPin, Calendar, Briefcase, FileText, Mosque, Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

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
  pekerjaan: string
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
            <CardContent className="grid gap-6 pt-6 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Nomor Induk Kependudukan (NIK)</p>
                <p className="text-lg font-mono">{data.nik}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Nomor Kartu Keluarga (KK)</p>
                <p className="text-lg font-mono">{data.noKk}</p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Nama Lengkap</p>
                <p className="text-xl font-semibold uppercase">{data.namaLengkap}</p>
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
                <Briefcase className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Pekerjaan</p>
                  <p className="font-medium">{data.pekerjaan || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}