"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Loader2, ArrowLeft, Plus, UserCheck, UserMinus, Pencil, Printer, Users, Home, MapPin, Calendar, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"
import { format, parseISO } from "date-fns"
import { id as localeId } from "date-fns/locale"

interface AnggotaPenduduk {
  id: string
  nik: string
  noKk: string
  namaLengkap: string
  tempatLahir: string
  tanggalLahir: string
  jenisKelamin: string
  alamat?: string
  rt?: string
  rw?: string
  agama: string
  statusPerkawinan: string
  shdk: string
  urutanKk?: string | null
  namaAyah?: string | null
  namaIbu?: string | null
  pendidikan?: string | null
  golonganDarah?: string | null
  pekerjaan?: string | null
  fotoUrl?: string | null
}

interface KartuKeluargaDetail {
  id: string
  noKk: string
  kepalaKeluargaId?: string | null
  alamat: string
  rt: string
  rw: string
  dusun?: string | null
  kodePos?: string | null
  tanggalDikeluarkan?: string | null
  jumlahAnggota: number
  kepalaKeluarga?: AnggotaPenduduk | null
  anggota: AnggotaPenduduk[]
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

const SHDK_OPTIONS = [
  "KEPALA KELUARGA",
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
]

export default function DetailKartuKeluargaPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const routeId = params?.id

  const [data, setData] = useState<KartuKeluargaDetail | null>(null)
  const [isFetching, setIsFetching] = useState(true)

  const [removeCandidate, setRemoveCandidate] = useState<AnggotaPenduduk | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)

  const { useSession } = authClient
  const { data: session, isPending: isSessionPending } = useSession()

  const fetchKKDetail = async () => {
    if (!routeId) return
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/kk/${routeId}`, {
        credentials: "include",
      })

      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          setData(json.data)
        } else {
          toast.error("Gagal memuat data Kartu Keluarga")
          router.push("/kk")
        }
      } else {
        toast.error("Gagal memuat data Kartu Keluarga")
        router.push("/kk")
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem")
      router.push("/kk")
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    fetchKKDetail()
  }, [routeId])

  useEffect(() => {
    if (!isSessionPending && !session) {
      router.push("/login")
    }
  }, [session, isSessionPending, router])

  const handleRemoveAnggota = async () => {
    if (!removeCandidate || !routeId) return

    setIsRemoving(true)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/kk/${routeId}/anggota/${removeCandidate.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      )

      const json = await res.json()
      if (res.ok && json.success) {
        toast.success("Berhasil", { description: json.message })
        fetchKKDetail()
      } else {
        toast.error("Gagal mengeluarkan anggota", { description: json.message })
      }
    } catch (err) {
      toast.error("Kesalahan jaringan")
    } finally {
      setIsRemoving(false)
      setRemoveCandidate(null)
    }
  }

  const handlePrint = () => {
    window.print()
  }

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
      <div className="mx-auto w-full max-w-5xl space-y-6">
        
        {/* Top Actions & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => router.push("/kk")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Detail Kartu Keluarga</h1>
              <p className="text-muted-foreground text-sm">
                Informasi lembar KK dan susunan anggota keluarga resmi.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Cetak KK
            </Button>
            <Button variant="outline" onClick={() => router.push(`/kk/edit/${data.id}`)} className="gap-2">
              <Pencil className="h-4 w-4" />
              Edit KK
            </Button>
            <Button onClick={() => router.push(`/kk/${data.id}/anggota/tambah`)} className="gap-2">
              <Plus className="h-4 w-4" />
              Tambah Anggota
            </Button>
          </div>
        </div>

        {/* Master Kartu Keluarga View */}
        <Card className="border-2 border-primary/20 shadow-md">
          <div className="bg-muted/40 border-b p-6 text-center space-y-1">
            <h2 className="text-xl font-extrabold tracking-wider uppercase text-foreground">
              KARTU KELUARGA
            </h2>
            <p className="text-2xl font-mono font-bold tracking-widest text-primary">
              No. {data.noKk}
            </p>
          </div>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/10 p-4 rounded-xl border">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <UserCheck className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                  <div>
                    <span className="text-xs text-muted-foreground uppercase font-semibold">Nama Kepala Keluarga</span>
                    <p className="font-semibold text-base text-foreground uppercase">
                      {data.kepalaKeluarga?.namaLengkap || data.kepalaKeluargaId || "Belum Ditentukan"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                  <div>
                    <span className="text-xs text-muted-foreground uppercase font-semibold">Alamat Domisili</span>
                    <p className="font-medium text-foreground">
                      {data.alamat} {data.dusun ? `(${data.dusun})` : ""}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Home className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                  <div>
                    <span className="text-xs text-muted-foreground uppercase font-semibold">RT / RW & Wilayah</span>
                    <p className="font-medium text-foreground">
                      RT {data.rt} / RW {data.rw}, Desa Kedungsumur {data.kodePos ? `(${data.kodePos})` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                  <div>
                    <span className="text-xs text-muted-foreground uppercase font-semibold">Tanggal Terbit KK</span>
                    <p className="font-medium text-foreground">
                      {data.tanggalDikeluarkan
                        ? format(parseISO(data.tanggalDikeluarkan), "dd MMMM yyyy", { locale: localeId })
                        : "Tidak Tercatat"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Susunan Anggota Keluarga */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Users className="size-5 text-primary" />
                  Susunan Anggota Keluarga ({data.anggota.length} Jiwa)
                </h3>
              </div>

              {data.anggota.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 border rounded-xl bg-muted/10 text-muted-foreground text-center">
                  <Users className="size-10 opacity-30 mb-2" />
                  <p className="font-medium">Belum ada anggota keluarga dalam KK ini.</p>
                  <p className="text-xs mt-1">Klik tombol "Tambah Anggota" di atas untuk menautkan penduduk ke KK ini.</p>
                </div>
              ) : (
                <div className="border rounded-xl overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-12 text-center">No</TableHead>
                        <TableHead>Nama Lengkap</TableHead>
                        <TableHead>NIK</TableHead>
                        <TableHead>Jenis Kelamin</TableHead>
                        <TableHead>Tempat, Tgl Lahir</TableHead>
                        <TableHead>Agama</TableHead>
                        <TableHead>Status Hubungan (SHDK)</TableHead>
                        <TableHead>Pekerjaan</TableHead>
                        <TableHead className="w-16 text-center print:hidden"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.anggota.map((item, idx) => (
                        <TableRow key={item.id} className="hover:bg-muted/30">
                          <TableCell className="text-center font-mono text-xs">{item.urutanKk || idx + 1}</TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Avatar size="sm">
                                {item.fotoUrl ? (
                                  <AvatarImage src={item.fotoUrl} alt={item.namaLengkap} />
                                ) : null}
                                <AvatarFallback>{getInitials(item.namaLengkap)}</AvatarFallback>
                              </Avatar>
                              <a href={`/kependudukan/${item.id}`} className="hover:underline font-semibold text-foreground">
                                {item.namaLengkap}
                              </a>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{item.nik}</TableCell>
                          <TableCell className="text-xs">{item.jenisKelamin}</TableCell>
                          <TableCell className="text-xs">
                            {item.tempatLahir}, {format(new Date(item.tanggalLahir), "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell className="text-xs">{item.agama}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                              item.shdk.toUpperCase() === "KEPALA KELUARGA"
                                ? "bg-primary/20 text-primary border border-primary/30"
                                : "bg-muted text-muted-foreground border"
                            }`}>
                              {item.shdk}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs">{item.pekerjaan || "-"}</TableCell>
                          <TableCell className="text-center print:hidden">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8"
                              onClick={() => setRemoveCandidate(item)}
                              title="Keluarkan dari KK"
                            >
                              <UserMinus className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

          </CardContent>
        </Card>
      </div>

      {/* Alert Keluarkan Anggota */}
      <AlertDialog open={!!removeCandidate} onOpenChange={(open) => !open && setRemoveCandidate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Keluarkan Anggota Keluarga?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin mengeluarkan <strong>{removeCandidate?.namaLengkap}</strong> dari Kartu Keluarga ini? Data kependudukan individu tetap tersimpan di sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleRemoveAnggota()
              }}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Keluarkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
