"use client"

import { useRef } from "react"
import { Download, Upload, FileSpreadsheet, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { ImportResult } from "./types"

interface KependudukanImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  importFile: File | null
  setImportFile: (file: File | null) => void
  isImporting: boolean
  importResult: ImportResult | null
  onDownloadTemplate: () => void
  onSubmit: () => void
}

export function KependudukanImportDialog({
  open,
  onOpenChange,
  importFile,
  setImportFile,
  isImporting,
  importResult,
  onDownloadTemplate,
  onSubmit,
}: KependudukanImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Impor Data Penduduk (Excel)
          </DialogTitle>
          <DialogDescription>
            Unggah file spreadsheet <strong>.xlsx</strong> sesuai template resmi sistem kependudukan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">Template Format Excel</p>
              <p className="text-[11px] text-muted-foreground">Unduh format kolom yang sudah divalidasi sistem</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onDownloadTemplate}
              className="gap-1.5 text-xs"
            >
              <Download className="size-3.5" />
              Unduh Template
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">Pilih File Excel (.xlsx)</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed transition-colors cursor-pointer ${
                importFile ? "border-primary/60 bg-primary/5" : "border-border hover:border-primary/40 bg-card"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
              />
              <FileSpreadsheet className={`size-8 mb-2 ${importFile ? "text-primary" : "text-muted-foreground"}`} />
              <p className="text-xs font-medium text-center text-foreground">
                {importFile ? importFile.name : "Klik untuk memilih file spreadsheet"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Maksimal ukuran file 10MB
              </p>
            </div>
          </div>

          {importResult && (
            <div className="p-3.5 rounded-xl border bg-muted/20 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <CheckCircle2 className="size-4 text-emerald-500" />
                Laporan Hasil Impor
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2 rounded-lg bg-card border">
                  <span className="text-[10px] text-muted-foreground">Diproses</span>
                  <p className="font-bold text-sm text-foreground">{importResult.totalDiproses}</p>
                </div>
                <div className="p-2 rounded-lg bg-card border">
                  <span className="text-[10px] text-emerald-500">Berhasil</span>
                  <p className="font-bold text-sm text-emerald-500">{importResult.berhasil}</p>
                </div>
                <div className="p-2 rounded-lg bg-card border">
                  <span className="text-[10px] text-amber-500">Dilewati (Duplikat)</span>
                  <p className="font-bold text-sm text-amber-500">{importResult.dilewati}</p>
                </div>
              </div>
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="space-y-1 pt-1 text-[11px] text-destructive">
                  <p className="font-semibold">Catatan Kesalahan Format:</p>
                  <ul className="list-disc list-inside space-y-0.5 max-h-20 overflow-y-auto">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting}>
            Tutup
          </Button>
          <Button onClick={onSubmit} disabled={isImporting || !importFile} className="gap-2">
            {isImporting ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {isImporting ? "Memproses..." : "Mulai Impor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
