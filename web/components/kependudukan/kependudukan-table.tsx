"use client"

import {
  Loader2,
  Search,
  MoreHorizontal,
  Pencil,
  Trash,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import type { Penduduk } from "./types"

interface KependudukanTableProps {
  data: Penduduk[]
  isLoading: boolean
  currentPage: number
  totalPages: number
  totalData: number
  onPageChange: (page: number) => void
  onRowClick: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (item: { id: string; name: string }) => void
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

export function KependudukanTable({
  data,
  isLoading,
  currentPage,
  totalPages,
  totalData,
  onPageChange,
  onRowClick,
  onEdit,
  onDelete,
}: KependudukanTableProps) {
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
        <p className="font-medium text-foreground">Tidak ada data ditemukan</p>
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
              <TableHead className="font-medium h-12">NIK</TableHead>
              <TableHead className="font-medium h-12">Nama Lengkap</TableHead>
              <TableHead className="font-medium h-12">Jenis Kelamin</TableHead>
              <TableHead className="font-medium h-12">Alamat</TableHead>
              <TableHead className="font-medium h-12">Pekerjaan</TableHead>
              <TableHead className="w-[80px] h-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((penduduk) => (
              <TableRow
                key={penduduk.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onRowClick(penduduk.id)}
              >
                <TableCell className="font-mono text-sm">{penduduk.nik}</TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <Avatar size="sm">
                      {penduduk.fotoUrl ? (
                        <AvatarImage src={penduduk.fotoUrl} alt={penduduk.namaLengkap} />
                      ) : null}
                      <AvatarFallback>{getInitials(penduduk.namaLengkap)}</AvatarFallback>
                    </Avatar>
                    <span>{penduduk.namaLengkap}</span>
                  </div>
                </TableCell>
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
                        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Aksi
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => onEdit(penduduk.id)}
                        >
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          className="cursor-pointer"
                          onClick={() => onDelete({ id: penduduk.id, name: penduduk.namaLengkap })}
                        >
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-4 border-t">
          <div className="text-sm text-muted-foreground">
            Menampilkan <span className="font-medium">{data.length}</span> dari{" "}
            <span className="font-medium">{totalData}</span> data
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
