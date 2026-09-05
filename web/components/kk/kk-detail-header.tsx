"use client"

import { ArrowLeft, Printer, Pencil, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface KkDetailHeaderProps {
  kkId: string
  isAddingAnggota?: boolean
  onBack: () => void
  onPrint: () => void
  onEdit: () => void
  onToggleTambahAnggota: () => void
}

export function KkDetailHeader({
  isAddingAnggota = false,
  onBack,
  onPrint,
  onEdit,
  onToggleTambahAnggota,
}: KkDetailHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onBack}>
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
        <Button variant="outline" onClick={onPrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Cetak KK
        </Button>
        <Button variant="outline" onClick={onEdit} className="gap-2">
          <Pencil className="h-4 w-4" />
          Edit KK
        </Button>
        <Button
          onClick={onToggleTambahAnggota}
          className="gap-2"
          variant={isAddingAnggota ? "secondary" : "default"}
        >
          {isAddingAnggota ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {isAddingAnggota ? "Tutup Formulir" : "Tambah Anggota"}
        </Button>
      </div>
    </div>
  )
}
