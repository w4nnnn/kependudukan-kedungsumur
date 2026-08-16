"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Search, Plus, MoreHorizontal, Pencil, Trash } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"

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
import {
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const formSchema = z.object({
  nik: z.string().length(16, "NIK harus 16 digit"),
  noKk: z.string().length(16, "No KK harus 16 digit"),
  namaLengkap: z.string().min(3, "Nama lengkap minimal 3 karakter"),
  tempatLahir: z.string().min(3, "Tempat lahir wajib diisi"),
  tanggalLahir: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  jenisKelamin: z.enum(["Laki-laki", "Perempuan"]),
  alamat: z.string().min(5, "Alamat wajib diisi"),
  rt: z.string().min(1, "RT wajib diisi"),
  rw: z.string().min(1, "RW wajib diisi"),
  agama: z.string().min(2, "Agama wajib diisi"),
  statusPerkawinan: z.string().min(2, "Status perkawinan wajib diisi"),
  pekerjaan: z.string().min(2, "Pekerjaan wajib diisi"),
})

type PendudukFormValues = z.infer<typeof formSchema>

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
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { useSession } = authClient;
  const { data: session, isPending: isSessionPending } = useSession()

  const form = useForm<PendudukFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nik: "",
      noKk: "",
      namaLengkap: "",
      tempatLahir: "",
      tanggalLahir: "",
      jenisKelamin: "Laki-laki",
      alamat: "",
      rt: "",
      rw: "",
      agama: "",
      statusPerkawinan: "",
      pekerjaan: "",
    },
  })

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
        const text = await res.text()
        if (text) {
          const json = JSON.parse(text)
          if (json.success) {
            setDataPenduduk(json.data)
          }
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

  const onSubmit = async (values: PendudukFormValues) => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/penduduk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(values),
      })
      
      const json = await res.json()
      
      if (res.ok && json.success) {
        toast.success("Berhasil menambahkan data penduduk baru")
        form.reset()
        fetchPenduduk(searchQuery)
      } else {
        toast.error(json.message || "Gagal menambahkan data penduduk")
      }
    } catch (error) {
      console.error(error)
      toast.error("Terjadi kesalahan sistem")
    } finally {
      setIsSubmitting(false)
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between glass p-6 rounded-2xl mt-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Data Kependudukan</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Kelola data penduduk Desa Kedungsumur.
            </p>
          </div>
        </div>

        {/* Card Tabel */}
        <Card className="glass-dark border-border/20 overflow-hidden">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-border/10">
            <CardTitle className="text-xl font-medium tracking-wide">Daftar Penduduk</CardTitle>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="search"
                  placeholder="Cari nama penduduk..."
                  className="w-full pl-9 sm:w-72 bg-black/20 border-white/10 focus:border-primary/50 focus:bg-black/40 transition-all rounded-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button 
                onClick={() => router.push("/dashboard/tambah")}
                className="gap-2 font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
              >
                <Plus className="h-4 w-4" />
                Tambah Data
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
              <div className="overflow-x-auto mx-2">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/10 hover:bg-transparent bg-black/10">
                      <TableHead className="font-medium text-muted-foreground h-12">NIK</TableHead>
                      <TableHead className="font-medium text-muted-foreground h-12">Nama Lengkap</TableHead>
                      <TableHead className="font-medium text-muted-foreground h-12">Jenis Kelamin</TableHead>
                      <TableHead className="font-medium text-muted-foreground h-12">Alamat</TableHead>
                      <TableHead className="font-medium text-muted-foreground h-12">Pekerjaan</TableHead>
                      <TableHead className="w-[80px] h-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataPenduduk.map((penduduk) => (
                      <TableRow key={penduduk.id} className="border-border/10 hover:bg-white/5 transition-colors">
                        <TableCell className="font-mono text-sm">{penduduk.nik}</TableCell>
                        <TableCell className="font-medium">{penduduk.namaLengkap}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10">
                            {penduduk.jenisKelamin}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {penduduk.alamat}, RT {penduduk.rt}/RW {penduduk.rw}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{penduduk.pekerjaan}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring">
                              <span className="sr-only">Buka menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover/90 backdrop-blur-xl border-white/10 shadow-xl">
                              <DropdownMenuGroup>
                                <DropdownMenuLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Aksi</DropdownMenuLabel>
                                <DropdownMenuItem className="focus:bg-white/10 cursor-pointer">
                                  <Pencil className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
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
