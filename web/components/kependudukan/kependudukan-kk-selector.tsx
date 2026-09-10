"use client"

import { Home, FileText, Search, CheckCircle2, Calendar as CalendarIcon } from "lucide-react"
import { UseFormReturn } from "react-hook-form"
import { cn, formatDateId } from "@/lib/utils"
import { blockNonNumericKeyDown } from "@/lib/validation"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { CandidateKK } from "./types"
import type { TambahPendudukFormValues } from "./kependudukan-form-schema"

interface KependudukanKkSelectorProps {
  form: UseFormReturn<TambahPendudukFormValues>
  modeKk: "select" | "create"
  setModeKk: (mode: "select" | "create") => void
  kkSearch: string
  setKkSearch: (search: string) => void
  kkList: CandidateKK[]
  selectedKkId: string
  selectedKkData: CandidateKK | null
  isLoadingKk: boolean
  onSelectKk: (kkId: string) => void
}

export function KependudukanKkSelector({
  form,
  modeKk,
  setModeKk,
  kkSearch,
  setKkSearch,
  kkList,
  selectedKkId,
  selectedKkData,
  isLoadingKk,
  onSelectKk,
}: KependudukanKkSelectorProps) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form

  return (
    <div className="space-y-4 p-4 rounded-xl border bg-muted/20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Pengaturan Kartu Keluarga (KK)</h3>
          <p className="text-xs text-muted-foreground">Tentukan Kartu Keluarga tempat penduduk ini terdaftar.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setModeKk("select")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              modeKk === "select"
                ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                : "border-border/60 bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            <Home className="size-3.5" />
            <span>Pilih KK Terdaftar</span>
          </button>
          <button
            type="button"
            onClick={() => setModeKk("create")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              modeKk === "create"
                ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                : "border-border/60 bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="size-3.5" />
            <span>Buat KK Baru</span>
          </button>
        </div>
      </div>

      {modeKk === "select" ? (
        <div className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Cari Kartu Keluarga</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ketik 16 digit No KK atau Nama Kepala Keluarga..."
                className="pl-9 h-9 text-xs"
                value={kkSearch}
                onChange={(e) => setKkSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">Pilih dari Hasil Pencarian</label>
            <Select value={selectedKkId} onValueChange={(val) => onSelectKk(val || "")} disabled={isLoadingKk}>
              <SelectTrigger className="w-full text-xs h-9">
                <SelectValue placeholder={isLoadingKk ? "Memuat data KK..." : "-- Pilih Kartu Keluarga Terdaftar --"} />
              </SelectTrigger>
              <SelectContent className="max-h-56">
                {kkList.length === 0 ? (
                  <div className="p-3 text-xs text-muted-foreground text-center">
                    Tidak ada KK ditemukan. Silakan ketik di pencarian atau gunakan mode Buat KK Baru Lengkap.
                  </div>
                ) : (
                  kkList.map((kk) => (
                    <SelectItem key={kk.id} value={kk.id} className="text-xs">
                      No KK: {kk.noKk} - Kepala: {kk.kepalaKeluargaNama || "Belum ada"} (RT {kk.rt}/RW {kk.rw}, {kk.alamat})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.noKk && <p className="text-xs text-destructive">{errors.noKk.message}</p>}
          </div>

          {selectedKkData && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg border border-primary/30 bg-primary/5 text-xs text-foreground">
              <CheckCircle2 className="size-4 text-primary shrink-0" />
              <div>
                <span className="font-semibold">KK Terpilih:</span> {selectedKkData.noKk} ({selectedKkData.alamat}, RT {selectedKkData.rt}/RW {selectedKkData.rw})
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-medium">Nomor Kartu Keluarga (16 Digit Angka)</label>
              <Input
                placeholder="Contoh: 3573010101800001"
                maxLength={16}
                inputMode="numeric"
                pattern="[0-9]*"
                onKeyDown={blockNonNumericKeyDown}
                {...register("noKk", {
                  onChange: (e) => {
                    e.target.value = e.target.value.replace(/\D/g, "")
                  },
                })}
              />
              {errors.noKk && <p className="text-xs text-destructive">{errors.noKk.message}</p>}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-medium">Alamat Domisili Keluarga</label>
              <Input
                placeholder="Nama jalan, gang, atau nomor rumah"
                {...register("kkAlamat", {
                  onChange: (e) =>
                    setValue("alamat", e.target.value, {
                      shouldValidate: true,
                      shouldDirty: true,
                    }),
                })}
              />
              {errors.kkAlamat && <p className="text-xs text-destructive">{errors.kkAlamat.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">RT</label>
              <Input
                placeholder="001"
                maxLength={3}
                inputMode="numeric"
                pattern="[0-9]*"
                onKeyDown={blockNonNumericKeyDown}
                {...register("kkRt", {
                  onChange: (e) => {
                    const sanitized = e.target.value.replace(/\D/g, "")
                    e.target.value = sanitized
                    setValue("rt", sanitized, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  },
                })}
              />
              {errors.kkRt && <p className="text-xs text-destructive">{errors.kkRt.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">RW</label>
              <Input
                placeholder="002"
                maxLength={3}
                inputMode="numeric"
                pattern="[0-9]*"
                onKeyDown={blockNonNumericKeyDown}
                {...register("kkRw", {
                  onChange: (e) => {
                    const sanitized = e.target.value.replace(/\D/g, "")
                    e.target.value = sanitized
                    setValue("rw", sanitized, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  },
                })}
              />
              {errors.kkRw && <p className="text-xs text-destructive">{errors.kkRw.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Dusun</label>
              <Input placeholder="Contoh: Dusun Krajan" {...register("kkDusun")} />
              {errors.kkDusun && <p className="text-xs text-destructive">{errors.kkDusun.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Kode Pos (5 Digit Angka)</label>
              <Input
                placeholder="65171"
                maxLength={5}
                inputMode="numeric"
                pattern="[0-9]*"
                onKeyDown={blockNonNumericKeyDown}
                {...register("kkKodePos", {
                  onChange: (e) => {
                    e.target.value = e.target.value.replace(/\D/g, "")
                  },
                })}
              />
              {errors.kkKodePos && <p className="text-xs text-destructive">{errors.kkKodePos.message}</p>}
            </div>

            <div className="flex flex-col space-y-1.5 md:col-span-2">
              <label className="text-xs font-medium">Tanggal Dikeluarkan KK (Opsional)</label>
              <Popover>
                <PopoverTrigger
                  className={cn(
                    "w-full h-9 justify-start text-left font-normal inline-flex items-center rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                    !watch("kkTanggalDikeluarkan") && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                  {watch("kkTanggalDikeluarkan") ? (
                    formatDateId(watch("kkTanggalDikeluarkan") as Date)
                  ) : (
                    <span>Pilih tanggal terbit KK</span>
                  )}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    captionLayout="dropdown"
                    selected={watch("kkTanggalDikeluarkan") as Date}
                    onSelect={(date) => setValue("kkTanggalDikeluarkan", date as Date, { shouldValidate: true })}
                  />
                </PopoverContent>
              </Popover>
              {errors.kkTanggalDikeluarkan && (
                <p className="text-xs text-destructive">{errors.kkTanggalDikeluarkan.message}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
