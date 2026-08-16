"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Search, Plus, MoreHorizontal, Pencil, Trash, AlertTriangle } from "lucide-react"

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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination"
import { toast } from "sonner"

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

export default function KependudukanPage() {
  const router = useRouter()
  const [dataPenduduk, setDataPenduduk] = useState<Penduduk[]>([])
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 })
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteData, setDeleteData] = useState<{ id: string, name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const { useSession } = authClient;
  const { data: session, isPending: isSessionPending } = useSession()

  useEffect(() => {
    // Jika selesai loading sesi dan tidak ada session, lempar ke login
    if (!isSessionPending && !session) {
      router.push("/login")
    }
  }, [session, isSessionPending, router])

  // Fetch Data Penduduk
  const fetchPenduduk = async (search = "", page = 1) => {
    setIsLoading(true)
    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/penduduk`)
      url.searchParams.append("page", page.toString())
      url.searchParams.append("limit", "10")

      if (search) {
        if (/^\d{16}$/.test(search)) {
          url.searchParams.append("nik", search)
        } else {
          url.searchParams.append("search", search)
        }
      }
      
      const res = await fetch(url.toString(), {
        credentials: "include", 
      })
      
      if (res.ok) {
        const text = await res.text()
        if (text) {
          const json = JSON.parse(text)
          if (json.success) {
            setDataPenduduk(json.data)
            if (json.meta) setMeta(json.meta)
          }
        }
      } else if (res.status === 401 || res.status === 403) {
        router.push("/login")
      }
    } catch (error) {
      console.error("Gagal mengambil data penduduk", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Load data awal
  useEffect(() => {
    // Hanya fetch data jika pengguna sudah dipastikan login
    if (session) {
      fetchPenduduk()
    }
  }, [session])

  // Handle pencarian (debounce sederhana)
  useEffect(() => {
    if (!session) return
    const delayDebounceFn = setTimeout(() => {
      fetchPenduduk(searchQuery)
    }, 500)
    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery, session])

  const handleDelete = async () => {
    if (!deleteData) return
    
    setIsDeleting(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/penduduk/${deleteData.id}`, {
        method: "DELETE",
        credentials: "include",
      })

      const result = await res.json()

      if (res.ok && result.success) {
        toast.success("Berhasil", {
          description: `Data ${deleteData.name} telah dihapus.`,
        })
        fetchPenduduk(searchQuery)
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

  // Jika masih memeriksa sesi, tampilkan loading full-screen
  if (isSessionPending) {
    return (
      <div className="flex h-full items-center justify-center p-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Jika tidak ada sesi (dan sedang di-redirect), jangan render konten dashboard
  if (!session) {
    return null
  }

  return (
    <div className="flex w-full flex-col p-4 md:p-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        
        {/* Header Dashboard */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-6 rounded-2xl mt-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Data Kependudukan</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Kelola data penduduk Desa Kedungsumur. Selamat datang, {session.user.name}.
            </p>
          </div>
        </div>

        {/* Card Tabel */}
        <Card className="shadow-sm overflow-hidden">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b">
            <CardTitle className="flex items-center gap-2">
              <span>Daftar Penduduk</span>
            </CardTitle>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center w-full sm:w-auto">
              <div className="relative group w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors" />
                  <Input
                    type="search"
                    placeholder="Cari nama atau NIK (16 digit)..."
                    className="w-full pl-9 sm:w-72 transition-all rounded-lg"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
              </div>
              <Button 
                onClick={() => router.push("/kependudukan/tambah")}
                className="gap-2 font-medium shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Tambah Penduduk
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : dataPenduduk.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 opacity-50" />
                </div>
                <p className="font-medium text-foreground">Tidak ada data ditemukan</p>
                <p className="text-sm mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
              </div>
            ) : (
              <div className="flex flex-col w-full">
                <div className="overflow-x-auto mx-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-medium h-12">NIK</TableHead>
                        <TableHead className="font-medium h-12">Nama Lengkap</TableHead>
                        <TableHead className="font-medium h-12">Jenis Kelamin</TableHead>
                        <TableHead className="font-medium h-12">Alamat</TableHead>
                        <TableHead className="font-medium h-12">Pekerjaan</TableHead>
                        <TableHead className="w-[80px] h-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dataPenduduk.map((penduduk) => (
                        <TableRow key={penduduk.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/kependudukan/${penduduk.id}`)}>
                          <TableCell className="font-mono text-sm">{penduduk.nik}</TableCell>
                          <TableCell className="font-medium">{penduduk.namaLengkap}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border">
                              {penduduk.jenisKelamin}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">
                            {penduduk.alamat}, RT {penduduk.rt}/RW {penduduk.rw}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{penduduk.pekerjaan}</TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                <span className="sr-only">Buka menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuGroup>
                                  <DropdownMenuLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Aksi</DropdownMenuLabel>
                                  <DropdownMenuItem className="cursor-pointer" onClick={() => router.push(`/kependudukan/edit/${penduduk.id}`)}>
                                    <Pencil className="mr-2 h-4 w-4" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem variant="destructive" className="cursor-pointer" onClick={() => setDeleteData({ id: penduduk.id, name: penduduk.namaLengkap })}>
                                    <Trash className="mr-2 h-4 w-4" /> Hapus
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
                
                {meta.totalPages > 1 && (
                  <div className="border-t p-4 mt-auto">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              if (meta.page > 1) fetchPenduduk(searchQuery, meta.page - 1);
                            }}
                            className={meta.page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: meta.totalPages }).map((_, i) => {
                          const pageNumber = i + 1;
                          
                          if (
                            meta.totalPages > 5 && 
                            pageNumber !== 1 && 
                            pageNumber !== meta.totalPages && 
                            Math.abs(pageNumber - meta.page) > 1
                          ) {
                            if (pageNumber === 2 || pageNumber === meta.totalPages - 1) {
                              return (
                                <PaginationItem key={`ellipsis-${pageNumber}`}>
                                  <PaginationEllipsis />
                                </PaginationItem>
                              )
                            }
                            return null;
                          }
                          
                          return (
                            <PaginationItem key={pageNumber}>
                              <PaginationLink
                                href="#"
                                isActive={meta.page === pageNumber}
                                onClick={(e) => {
                                  e.preventDefault();
                                  fetchPenduduk(searchQuery, pageNumber);
                                }}
                              >
                                {pageNumber}
                              </PaginationLink>
                            </PaginationItem>
                          )
                        })}

                        <PaginationItem>
                          <PaginationNext 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              if (meta.page < meta.totalPages) fetchPenduduk(searchQuery, meta.page + 1);
                            }}
                            className={meta.page >= meta.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
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
              <AlertTriangle className="h-5 w-5 text-destructive" /> Konfirmasi Penghapusan
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data kependudukan atas nama <strong>{deleteData?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
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
