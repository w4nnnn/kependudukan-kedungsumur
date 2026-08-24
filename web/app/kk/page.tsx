"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Search, Plus, MoreHorizontal, Pencil, Trash, AlertTriangle, ChevronLeft, ChevronRight, Eye, Home } from "lucide-react"

import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

interface KartuKeluarga {
  id: string
  noKk: string
  kepalaKeluargaId?: string | null
  kepalaKeluargaNama?: string | null
  kepalaKeluargaNik?: string | null
  alamat: string
  rt: string
  rw: string
  dusun?: string | null
  kodePos?: string | null
  tanggalDikeluarkan?: string | null
  jumlahAnggota: number
  daftarAnggota?: string[]
}

export default function KartuKeluargaPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [dataKK, setDataKK] = useState<KartuKeluarga[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRt, setSelectedRt] = useState<string>("ALL")
  const [selectedRw, setSelectedRw] = useState<string>("ALL")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalData, setTotalData] = useState(0)
  const limit = 10
  const [deleteData, setDeleteData] = useState<{ id: string, noKk: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const { useSession } = authClient
  const { data: session, isPending: isSessionPending } = useSession()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isSessionPending && !session) {
      router.push("/login")
    }
  }, [mounted, session, isSessionPending, router])

  const fetchKK = async (search = "", rt = "ALL", rw = "ALL", page = 1) => {
    setIsLoading(true)
    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/kk`)
      url.searchParams.append("page", page.toString())
      url.searchParams.append("limit", limit.toString())

      if (search) {
        if (/^\d{16}$/.test(search)) {
          url.searchParams.append("nokk", search)
        } else {
          url.searchParams.append("search", search)
        }
      }

      if (rt !== "ALL") {
        url.searchParams.append("rt", rt)
      }

      if (rw !== "ALL") {
        url.searchParams.append("rw", rw)
      }
      
      const res = await fetch(url.toString(), {
        credentials: "include", 
      })
      
      if (res.ok) {
        const text = await res.text()
        if (text) {
          const json = JSON.parse(text)
          if (json.success) {
            setDataKK(json.data)
            if (json.meta) {
              setTotalPages(json.meta.totalPages)
              setTotalData(json.meta.total)
            }
          }
        }
      } else if (res.status === 401 || res.status === 403) {
        router.push("/login")
      }
    } catch (error) {
      console.error("Gagal mengambil data Kartu Keluarga", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchKK(searchQuery, selectedRt, selectedRw, currentPage)
    }
  }, [session, currentPage, selectedRt, selectedRw])

  useEffect(() => {
    if (!session) return
    const delayDebounceFn = setTimeout(() => {
      setCurrentPage(1)
      fetchKK(searchQuery, selectedRt, selectedRw, 1)
    }, 500)
    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery, session])

  const handleDelete = async () => {
    if (!deleteData) return
    
    setIsDeleting(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/kk/${deleteData.id}`, {
        method: "DELETE",
        credentials: "include",
      })

      const result = await res.json()

      if (res.ok && result.success) {
        toast.success("Berhasil", {
          description: `Data KK No. ${deleteData.noKk} telah dihapus.`,
        })
        fetchKK(searchQuery, selectedRt, selectedRw, currentPage)
      } else {
        toast.error("Gagal menghapus data", {
          description: result.message || "Terjadi kesalahan sistem.",
        })
      }
    } catch (error) {
      toast.error("Kesalahan jaringan", {
        description: "Gagal terhubung ke server.",
      })
    } finally {
      setIsDeleting(false)
      setDeleteData(null)
    }
  }

  if (!mounted || isSessionPending) {
    return (
      <div className="flex h-full items-center justify-center p-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="flex w-full flex-col p-4 md:p-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        
        {/* Header Dashboard */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-6 rounded-2xl mt-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Data Kartu Keluarga</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Kelola data keluarga, susunan anggota, dan mutasi KK Desa Kedungsumur.
            </p>
          </div>
        </div>

        {/* Card Tabel */}
        <Card className="shadow-sm overflow-hidden">
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between pb-4 border-b">
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" />
              <span>Daftar Kartu Keluarga</span>
            </CardTitle>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-wrap">
              {/* Filter RT */}
              <div className="w-full sm:w-28">
                <Select value={selectedRt} onValueChange={(val) => { setSelectedRt(val || "ALL"); setCurrentPage(1); }}>
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

              {/* Filter RW */}
              <div className="w-full sm:w-28">
                <Select value={selectedRw} onValueChange={(val) => { setSelectedRw(val || "ALL"); setCurrentPage(1); }}>
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

              {/* Search */}
              <div className="relative group w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors" />
                <Input
                  type="search"
                  placeholder="Cari No KK atau Kepala Keluarga..."
                  className="w-full pl-9 sm:w-64 transition-all rounded-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button 
                onClick={() => router.push("/kk/tambah")}
                className="gap-2 font-medium shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Tambah KK
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : dataKK.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 opacity-50" />
                </div>
                <p className="font-medium text-foreground">Tidak ada data Kartu Keluarga ditemukan</p>
                <p className="text-sm mt-1">Coba gunakan kata kunci pencarian atau filter RT/RW yang lain.</p>
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="overflow-x-auto mx-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-medium h-12">No. KK</TableHead>
                        <TableHead className="font-medium h-12">Kepala Keluarga</TableHead>
                        <TableHead className="font-medium h-12">Anggota Keluarga</TableHead>
                        <TableHead className="font-medium h-12">Alamat Domisili</TableHead>
                        <TableHead className="font-medium h-12">RT / RW</TableHead>
                        <TableHead className="w-[80px] h-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dataKK.map((kk) => (
                        <TableRow key={kk.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/kk/${kk.id}`)}>
                          <TableCell className="font-mono font-medium text-sm text-foreground">{kk.noKk}</TableCell>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground">{kk.kepalaKeluargaNama || "-"}</span>
                              {kk.kepalaKeluargaNik && (
                                <span className="font-mono text-xs text-muted-foreground">NIK: {kk.kepalaKeluargaNik}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm max-w-xs">
                            {kk.daftarAnggota && kk.daftarAnggota.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {kk.daftarAnggota.slice(0, 3).map((nama, idx) => (
                                  <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground border">
                                    {nama}
                                  </span>
                                ))}
                                {kk.daftarAnggota.length > 3 && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                                    +{kk.daftarAnggota.length - 3} lainnya
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Belum ada anggota</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {kk.alamat} {kk.dusun ? `(${kk.dusun})` : ""}
                          </TableCell>
                          <TableCell className="text-sm">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground border">
                              RT {kk.rt} / RW {kk.rw}
                            </span>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                <span className="sr-only">Buka menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuGroup>
                                  <DropdownMenuLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Aksi</DropdownMenuLabel>
                                  <DropdownMenuItem className="cursor-pointer" onClick={() => router.push(`/kk/${kk.id}`)}>
                                    <Eye className="mr-2 h-4 w-4" /> Lihat Detail
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer" onClick={() => router.push(`/kk/edit/${kk.id}`)}>
                                    <Pencil className="mr-2 h-4 w-4" /> Edit KK
                                  </DropdownMenuItem>
                                  <DropdownMenuItem variant="destructive" className="cursor-pointer" onClick={() => setDeleteData({ id: kk.id, noKk: kk.noKk })}>
                                    <Trash className="mr-2 h-4 w-4" /> Hapus KK
                                  </DropdownMenuItem>
                                </DropdownMenuGroup>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Menampilkan <span className="font-medium">{dataKK.length}</span> dari <span className="font-medium">{totalData}</span> KK
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1 || isLoading}
                        className="h-8 gap-1 px-2.5"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span>Sebelumnya</span>
                      </Button>
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <span className="w-8 text-center">{currentPage}</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="w-8 text-center">{totalPages}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || isLoading}
                        className="h-8 gap-1 px-2.5"
                      >
                        <span>Selanjutnya</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteData} onOpenChange={(open) => !open && setDeleteData(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Konfirmasi Hapus Kartu Keluarga
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data Kartu Keluarga dengan No. <strong>{deleteData?.noKk}</strong>? Anggota penduduk yang terhubung akan dilepaskan status KK-nya. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menghapus...
                </>
              ) : (
                "Hapus Permanen"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
