"use client"

import Link from "next/link"
import { Users, UserMinus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { formatDateId } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { AnggotaPenduduk } from "./types"

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

interface KkAnggotaTableProps {
  anggota: AnggotaPenduduk[]
  onRemove: (item: AnggotaPenduduk) => void
}

export function KkAnggotaTable({ anggota, onRemove }: KkAnggotaTableProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Users className="size-5 text-primary" />
          Susunan Anggota Keluarga ({anggota.length} Jiwa)
        </h3>
      </div>

      {anggota.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 border rounded-xl bg-muted/10 text-muted-foreground text-center">
          <Users className="size-10 opacity-30 mb-2" />
          <p className="font-medium">Belum ada anggota keluarga dalam KK ini.</p>
          <p className="text-xs mt-1">
            Klik tombol &quot;Tambah Anggota&quot; di atas untuk menautkan penduduk ke KK ini.
          </p>
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
              {anggota.map((item, idx) => (
                <TableRow key={item.id} className="hover:bg-muted/30">
                  <TableCell className="text-center font-mono text-xs">
                    {item.urutanKk || idx + 1}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Avatar size="sm">
                        {item.fotoUrl ? (
                          <AvatarImage src={item.fotoUrl} alt={item.namaLengkap} />
                        ) : null}
                        <AvatarFallback>{getInitials(item.namaLengkap)}</AvatarFallback>
                      </Avatar>
                      <Link
                        href={`/kependudukan/${item.id}`}
                        className="hover:underline font-semibold text-foreground"
                      >
                        {item.namaLengkap}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{item.nik}</TableCell>
                  <TableCell className="text-xs">{item.jenisKelamin}</TableCell>
                  <TableCell className="text-xs">
                    {item.tempatLahir}, {formatDateId(item.tanggalLahir, "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="text-xs">{item.agama}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        item.shdk.toUpperCase() === "KEPALA KELUARGA"
                          ? "bg-primary/20 text-primary border border-primary/30"
                          : "bg-muted text-muted-foreground border"
                      }`}
                    >
                      {item.shdk}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs">{item.pekerjaan || "-"}</TableCell>
                  <TableCell className="text-center print:hidden">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8"
                      onClick={() => onRemove(item)}
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
  )
}
