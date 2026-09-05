"use client"

import { FileText, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DashboardHeaderProps {
  selectedRt: string
  selectedRw: string
  onRtChange: (rt: string) => void
  onRwChange: (rw: string) => void
  onExportPDF: () => void
  onRefresh: () => void
  isLoading: boolean
}

export function DashboardHeader({
  selectedRt,
  selectedRw,
  onRtChange,
  onRwChange,
  onExportPDF,
  onRefresh,
  isLoading,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-6 rounded-2xl bg-card border-2 border-border/60 shadow-xs">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Dashboard & Statistik Desa
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Visualisasi demografi dan kependudukan Desa Kedungsumur secara real-time.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="w-28">
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

        <div className="w-28">
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

        <Button
          variant="outline"
          onClick={onExportPDF}
          className="gap-2 font-medium shadow-xs"
          title="Unduh Laporan Resmi Statistik Kependudukan (PDF)"
        >
          <FileText className="size-4 text-primary" />
          <span>Unduh Laporan PDF</span>
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={isLoading}
          title="Segarkan Data"
        >
          <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>
    </div>
  )
}
