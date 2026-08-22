"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Loader2,
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Shield,
  User,
  Ban,
  CheckCircle2,
} from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { toast } from "sonner"

interface AppUser {
  id: string
  name: string
  email: string
  username?: string | null
  displayUsername?: string | null
  role?: string | null
  banned?: boolean | null
  banReason?: string | null
  createdAt?: string | Date
  updatedAt?: string | Date
}

export default function PenggunaPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [dataUsers, setDataUsers] = useState<AppUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalData, setTotalData] = useState(0)
  const limit = 10
  const [deleteData, setDeleteData] = useState<{ id: string; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const { data: session, isPending: isSessionPending } = authClient.useSession()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isSessionPending && !session) {
      router.push("/login")
    }
  }, [mounted, session, isSessionPending, router])

  const totalPages = Math.max(1, Math.ceil(totalData / limit))

  const fetchUsers = async (search = "", page = 1) => {
    setIsLoading(true)
    try {
      const offset = (page - 1) * limit
      const queryParams: Record<string, string | number> = {
        limit,
        offset,
      }

      if (search.trim()) {
        queryParams.searchValue = search.trim()
        queryParams.searchField = search.includes("@") ? "email" : "name"
      }

      const res = await authClient.admin.listUsers({
        query: queryParams as any,
      })

      if (res.data) {
        setDataUsers(res.data.users as AppUser[])
        setTotalData(res.data.total ?? 0)
      } else if (res.error) {
        toast.error("Gagal memuat data pengguna", {
          description: res.error.message || "Pastikan Anda memiliki hak akses admin.",
        })
      }
    } catch (error) {
      console.error("Gagal mengambil data pengguna", error)
      toast.error("Terjadi kesalahan jaringan", {
        description: "Gagal terhubung ke server.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchUsers(searchQuery, currentPage)
    }
  }, [session, currentPage])

  useEffect(() => {
    if (!session) return
    const delayDebounceFn = setTimeout(() => {
      setCurrentPage(1)
      fetchUsers(searchQuery, 1)
    }, 500)
    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery, session])

  const handleDelete = async () => {
    if (!deleteData) return

    if (deleteData.id === session?.user?.id) {
      toast.error("Operasi ditolak", {
        description: "Anda tidak dapat menghapus akun Anda sendiri.",
      })
      setDeleteData(null)
      return
    }

    setIsDeleting(true)
    try {
      const res = await authClient.admin.removeUser({
        userId: deleteData.id,
      })

      if (res.error) {
        toast.error("Gagal menghapus pengguna", {
          description: res.error.message || "Terjadi kesalahan sistem.",
        })
      } else {
        toast.success("Berhasil", {
          description: `Pengguna ${deleteData.name} telah dihapus permanen.`,
        })
        fetchUsers(searchQuery, currentPage)
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
        {/* Header Modul */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-6 rounded-2xl mt-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manajemen Pengguna</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Kelola akun administrator dan staf sistem kependudukan Desa Kedungsumur.
            </p>
          </div>
        </div>

        {/* Card Tabel Pengguna */}
        <Card className="shadow-sm overflow-hidden">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b">
            <CardTitle className="flex items-center gap-2">
              <span>Daftar Pengguna</span>
            </CardTitle>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center w-full sm:w-auto">
              <div className="relative group w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors" />
                <Input
                  type="search"
                  placeholder="Cari nama atau email..."
                  className="w-full pl-9 sm:w-72 transition-all rounded-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                onClick={() => router.push("/pengguna/tambah")}
                className="gap-2 font-medium shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Tambah Pengguna
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : dataUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 opacity-50" />
                </div>
                <p className="font-medium text-foreground">Tidak ada pengguna ditemukan</p>
                <p className="text-sm mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="overflow-x-auto mx-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-medium h-12">Nama & Email</TableHead>
                        <TableHead className="font-medium h-12">Username</TableHead>
                        <TableHead className="font-medium h-12">Peran (Role)</TableHead>
                        <TableHead className="font-medium h-12">Status</TableHead>
                        <TableHead className="font-medium h-12">Terdaftar Pada</TableHead>
                        <TableHead className="w-[80px] h-12 text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dataUsers.map((user) => {
                        const isSelf = user.id === session.user.id
                        const isBanned = !!user.banned
                        const isAdmin = user.role === "admin"

                        return (
                          <TableRow
                            key={user.id}
                            className="hover:bg-muted/50 transition-colors"
                          >
                            <TableCell>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-foreground">
                                    {user.name}
                                  </span>
                                  {isSelf && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20">
                                      Akun Anda
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">{user.email}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {user.username || user.displayUsername || "-"}
                            </TableCell>
                            <TableCell>
                              {isAdmin ? (
                                <Badge className="gap-1 bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20">
                                  <Shield className="h-3 w-3" />
                                  Administrator
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="gap-1">
                                  <User className="h-3 w-3" />
                                  Staf / User
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {isBanned ? (
                                <Badge variant="destructive" className="gap-1">
                                  <Ban className="h-3 w-3" />
                                  Diblokir
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="gap-1 text-emerald-500 border-emerald-500/20 bg-emerald-500/10">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Aktif
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {user.createdAt
                                ? format(new Date(user.createdAt), "dd MMM yyyy", { locale: localeId })
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                  <span className="sr-only">Buka menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuGroup>
                                    <DropdownMenuLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                      Aksi
                                    </DropdownMenuLabel>
                                    <DropdownMenuItem
                                      className="cursor-pointer"
                                      onClick={() => router.push(`/pengguna/edit/${user.id}`)}
                                    >
                                      <Pencil className="mr-2 h-4 w-4" /> Edit & Kelola
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      variant="destructive"
                                      className="cursor-pointer"
                                      disabled={isSelf}
                                      onClick={() =>
                                        setDeleteData({
                                          id: user.id,
                                          name: user.name,
                                        })
                                      }
                                    >
                                      <Trash className="mr-2 h-4 w-4" /> Hapus
                                    </DropdownMenuItem>
                                  </DropdownMenuGroup>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Menampilkan <span className="font-medium">{dataUsers.length}</span> dari{" "}
                      <span className="font-medium">{totalData}</span> pengguna
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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

      {/* Dialog Konfirmasi Hapus */}
      <AlertDialog open={!!deleteData} onOpenChange={(open) => !open && setDeleteData(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Konfirmasi Hapus Pengguna
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus akun atas nama <strong>{deleteData?.name}</strong> secara permanen? Semua sesi login dan data terkait akun ini akan dihapus dari sistem.
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
