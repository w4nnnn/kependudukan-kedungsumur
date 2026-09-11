"use client"

import {
  Loader2,
  Search,
  MoreHorizontal,
  Pencil,
  Trash,
  ChevronLeft,
  ChevronRight,
  Eye,
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
import type { KartuKeluarga } from "./types"

interface KkTableProps {
  data: KartuKeluarga[]
  isLoading: boolean
  currentPage: number
  totalPages: number
  totalData: number
  isAdmin?: boolean
  onPageChange: (page: number) => void
  onRowClick: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (item: { id: string; noKk: string }) => void
}

export function KkTable({
  data,
  isLoading,
  currentPage,
  totalPages,
  totalData,
  isAdmin = false,
  onPageChange,
  onRowClick,
  onEdit,
  onDelete,
}: KkTableProps) {
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
        <p className="font-medium text-foreground">Tidak ada data Kartu Keluarga ditemukan</p>
        <p className="text-sm mt-1">Coba gunakan kata kunci pencarian atau filter RT/RW yang lain.</p>
      </div>
    )
  }

  return (
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
            {data.map((kk) => (
              <TableRow
                key={kk.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onRowClick(kk.id)}
              >
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
                        <span
                          key={idx}
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground border"
                        >
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
                    <span className="text-muted-foreground text-xs italic">Belum ada anggota</span>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {kk.alamat} {kk.dusun ? `(${kk.dusun})` : ""}
                </TableCell>
                <TableCell className="text-sm font-medium">
                  RT {kk.rt} / RW {kk.rw}
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
                        <DropdownMenuItem className="cursor-pointer" onClick={() => onRowClick(kk.id)}>
                          <Eye className="mr-2 h-4 w-4" /> Buka Detail KK
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer" onClick={() => onEdit(kk.id)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit KK
                        </DropdownMenuItem>
                        {isAdmin && (
                          <DropdownMenuItem
                            variant="destructive"
                            className="cursor-pointer"
                            onClick={() => onDelete({ id: kk.id, noKk: kk.noKk })}
                          >
                            <Trash className="mr-2 h-4 w-4" /> Hapus KK
                          </DropdownMenuItem>
                        )}
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
            <span className="font-medium">{totalData}</span> KK
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
