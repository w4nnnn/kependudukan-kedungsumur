"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Search, Plus, MoreHorizontal, Pencil, Trash } from "lucide-react"

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Tipe data berdasarkan dokumentasi API
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

export default function DashboardPage() {
  const router = useRouter()
  const [dataPenduduk, setDataPenduduk] = useState<Penduduk[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  
  const { useSession } = authClient;
  const { data: session, isPending: isSessionPending } = useSession()

  useEffect(() => {
    // Jika selesai loading sesi dan tidak ada session, lempar ke login
    if (!isSessionPending && !session) {
      router.push("/login")
    }
  }, [session, isSessionPending, router])

  // Fetch Data Penduduk
  const fetchPenduduk = async (search = "") => {
    setIsLoading(true)
    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/penduduk`)
      if (search) {
        url.searchParams.append("search", search)
      }
      
      // Kita butuh kredensial (cookie) untuk dikirim ke API Fastify
      const res = await fetch(url.toString(), {
        credentials: "include", 
      })
      
      if (res.ok) {
        const json = await res.json()
        if (json.success) {
          setDataPenduduk(json.data)
        }
      } else if (res.status === 401 || res.status === 403) {
        // Jika API menolak karena sesi tidak valid
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

  // Handle Logout
  const handleLogout = async () => {
    await authClient.signOut()
    router.push("/login")
  }

  // Jika masih memeriksa sesi, tampilkan loading full-screen
  if (isSessionPending) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Jika tidak ada sesi (dan sedang di-redirect), jangan render konten dashboard
  if (!session) {
    return null
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40 p-4 md:p-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        
        {/* Header Dashboard */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Data Kependudukan</h1>
            <p className="text-muted-foreground text-sm">
              Kelola data penduduk Desa Kedungsumur. Selamat datang, {session.user.name}.
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>Keluar</Button>
        </div>

        {/* Card Tabel */}
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2">
            <CardTitle>Daftar Penduduk</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Cari nama penduduk..."
                  className="w-full pl-8 sm:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button size="sm" className="h-9 gap-1">
                <Plus className="h-4 w-4" />
                Tambah Data
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : dataPenduduk.length === 0 ? (
              <div className="flex justify-center p-8 text-sm text-muted-foreground">
                Tidak ada data penduduk yang ditemukan.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NIK</TableHead>
                      <TableHead>Nama Lengkap</TableHead>
                      <TableHead>Jenis Kelamin</TableHead>
                      <TableHead>Alamat</TableHead>
                      <TableHead>Pekerjaan</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataPenduduk.map((penduduk) => (
                      <TableRow key={penduduk.id}>
                        <TableCell className="font-medium">{penduduk.nik}</TableCell>
                        <TableCell>{penduduk.namaLengkap}</TableCell>
                        <TableCell>{penduduk.jenisKelamin}</TableCell>
                        <TableCell>
                          {penduduk.alamat}, RT {penduduk.rt}/RW {penduduk.rw}
                        </TableCell>
                        <TableCell>{penduduk.pekerjaan}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">
                              <span className="sr-only">Buka menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuGroup>
                                <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                <DropdownMenuItem>
                                  <Pencil className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
