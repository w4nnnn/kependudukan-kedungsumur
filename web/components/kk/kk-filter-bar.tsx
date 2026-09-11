"use client"

import { Search, Download, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface KkFilterBarProps {
  selectedRt: string
  selectedRw: string
  searchQuery: string
  isAdmin?: boolean
  onRtChange: (rt: string) => void
  onRwChange: (rw: string) => void
  onSearchChange: (search: string) => void
  onExport: () => void
  onAddKK: () => void
}

export function KkFilterBar({
  selectedRt,
  selectedRw,
  searchQuery,
  isAdmin = false,
  onRtChange,
  onRwChange,
  onSearchChange,
  onExport,
  onAddKK,
}: KkFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-wrap">
      <div className="w-full sm:w-28">
        <Select value={selectedRt} onValueChange={(val) => onRtChange(val || "ALL")}>
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

      <div className="w-full sm:w-28">
        <Select value={selectedRw} onValueChange={(val) => onRwChange(val || "ALL")}>
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

      <div className="relative group w-full sm:w-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors" />
        <Input
          type="search"
          placeholder="Cari No KK atau Kepala Keluarga..."
          className="w-full pl-9 sm:w-64 transition-all rounded-lg"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {isAdmin && (
          <Button
            variant="outline"
            onClick={onExport}
            className="gap-2 font-medium shadow-xs"
            title="Ekspor Rekap Kartu Keluarga ke Excel"
          >
            <Download className="h-4 w-4" />
            <span>Ekspor</span>
          </Button>
        )}
        <Button onClick={onAddKK} className="gap-2 font-medium shadow-sm">
          <Plus className="h-4 w-4" />
          Tambah KK
        </Button>
      </div>
    </div>
  )
}
