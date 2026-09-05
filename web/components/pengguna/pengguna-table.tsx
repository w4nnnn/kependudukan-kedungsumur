"use client"

import {
  Loader2,
  Search,
  MoreHorizontal,
  Pencil,
  Trash,
  ChevronLeft,
  ChevronRight,
  Shield,
  User,
  Ban,
  CheckCircle2,
} from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { Button } from "@/components/ui/button"
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
import type { AppUser } from "./types"

interface PenggunaTableProps {
  data: AppUser[]
  isLoading: boolean
  currentPage: number
  totalPages: number
  totalData: number
  onPageChange: (page: number) => void
  onEdit: (id: string) => void
  onDelete: (item: { id: string; name: string }) => void
}

export function PenggunaTable({
  data,
  isLoading,
  currentPage,
  totalPages,
  totalData,
  onPageChange,
  onEdit,
  onDelete,
}: PenggunaTableProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
        <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <Search className="h-6 w-6 opacity-50" />
        </div>
        <p className="font-medium text-foreground">Tidak ada pengguna ditemukan</p>
        <p className="text-sm mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto mx-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-medium h-12">Nama & Email</TableHead>
              <TableHead className="font-medium h-12">Username</TableHead>
              <TableHead className="font-medium h-12">Role / Peran</TableHead>
              <TableHead className="font-medium h-12">Wilayah Tugas</TableHead>
              <TableHead className="font-medium h-12">Status</TableHead>
              <TableHead className="font-medium h-12">Dibuat Pada</TableHead>
              <TableHead className="w-[80px] h-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((user) => (
              <TableRow key={user.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground">{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {user.displayUsername || user.username || "-"}
                </TableCell>
                <TableCell>
                  {user.role === "admin" ? (
                    <Badge variant="default" className="gap-1 bg-primary text-primary-foreground">
                      <Shield className="h-3 w-3" />
                      Administrator
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <User className="h-3 w-3" />
                      Operator RT/RW
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {user.rt || user.rw ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground border">
                      RT {user.rt || "-"} / RW {user.rw || "-"}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs italic">Semua Wilayah</span>
                  )}
                </TableCell>
                <TableCell>
                  {user.banned ? (
                    <Badge variant="destructive" className="gap-1">
                      <Ban className="h-3 w-3" />
                      Diblokir
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-emerald-500 border-emerald-500/30 bg-emerald-500/10">
                      <CheckCircle2 className="h-3 w-3" />
                      Aktif
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {user.createdAt
                    ? format(new Date(user.createdAt), "dd MMM yyyy", { locale: localeId })
                    : "-"}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <span className="sr-only">Buka menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Aksi
                        </DropdownMenuLabel>
                        <DropdownMenuItem className="cursor-pointer" onClick={() => onEdit(user.id)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit & Akses
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          className="cursor-pointer"
                          onClick={() => onDelete({ id: user.id, name: user.name })}
                        >
                          <Trash className="mr-2 h-4 w-4" /> Hapus Akun
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-4 border-t">
          <div className="text-sm text-muted-foreground">
            Menampilkan <span className="font-medium">{data.length}</span> dari{" "}
            <span className="font-medium">{totalData}</span> pengguna
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
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
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
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
  )
}
