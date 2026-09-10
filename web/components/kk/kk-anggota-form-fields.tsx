"use client"

import { UserCheck, UserPlus, Search, Calendar as CalendarIcon } from "lucide-react"
import { UseFormReturn } from "react-hook-form"
import { cn, formatDateId } from "@/lib/utils"
import { blockNonNumericKeyDown } from "@/lib/validation"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AGAMA_OPTIONS,
  STATUS_PERKAWINAN_OPTIONS,
  SHDK_OPTIONS,
} from "@/components/kependudukan/kependudukan-form-schema"
import { KependudukanPhotoUpload } from "@/components/kependudukan/kependudukan-photo-upload"
import type { CandidatePenduduk } from "./types"
import type { TambahAnggotaKkFormValues } from "./kk-form-schema"

interface KkAnggotaFormFieldsProps {
  form: UseFormReturn<TambahAnggotaKkFormValues>
  mode: "select" | "create"
  setMode: (mode: "select" | "create") => void
  candidateList: CandidatePenduduk[]
  candidateSearch: string
  setCandidateSearch: (search: string) => void
  selectedCandidate: CandidatePenduduk | null
  onSelectCandidate: (id: string | null) => void
  previewUrl: string | null
  onFileSelect: (file: File | null, url: string | null) => void
  onRemovePreview: () => void
}

export function KkAnggotaFormFields({
  form,
  mode,
  setMode,
  candidateList,
  candidateSearch,
  setCandidateSearch,
  selectedCandidate,
  onSelectCandidate,
  previewUrl,
  onFileSelect,
  onRemovePreview,
}: KkAnggotaFormFieldsProps) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form

  return (
    <div className="space-y-6">
      {/* Mode switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border bg-muted/20">
        <div>
          <h3 className="text-sm font-semibold">Sumber Data Anggota</h3>
          <p className="text-xs text-muted-foreground">Pilih cara menambahkan anggota ke KK ini</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setMode("select")
              setValue("mode", "select")
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              mode === "select"
                ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserCheck className="size-3.5" />
            <span>Pilih Penduduk Terdaftar</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("create")
              setValue("mode", "create")
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              mode === "create"
                ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserPlus className="size-3.5" />
            <span>Buat Penduduk Baru</span>
          </button>
        </div>
      </div>

      {/* SHDK & Urutan KK */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border bg-muted/10">
        <div className="space-y-2">
          <label className="text-sm font-medium">Status Hubungan di KK (SHDK) *</label>
          <Select
            value={watch("shdk")}
            onValueChange={(val) => setValue("shdk", val || "ANAK")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih status hubungan" />
            </SelectTrigger>
            <SelectContent>
              {SHDK_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.shdk && <p className="text-xs text-destructive">{errors.shdk.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Urutan Nomor dalam KK</label>
          <Input
            placeholder="Contoh: 1, 2, 3..."
            maxLength={3}
            inputMode="numeric"
            pattern="[0-9]*"
            onKeyDown={blockNonNumericKeyDown}
            {...register("urutanKk", {
              onChange: (e) => {
                e.target.value = e.target.value.replace(/\D/g, "")
              },
            })}
          />
        </div>
      </div>

      {/* Mode Select */}
      {mode === "select" && (
        <div className="space-y-4 p-4 rounded-xl border bg-muted/20">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Cari Data Penduduk</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ketik NIK (16 digit) atau Nama Penduduk..."
                className="pl-9 h-9 text-xs"
                value={candidateSearch}
                onChange={(e) => setCandidateSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Pilih dari Hasil Pencarian *</label>
            <Select
              value={watch("selectedPendudukId")}
              onValueChange={onSelectCandidate}
            >
              <SelectTrigger className="w-full text-xs h-9">
                <SelectValue placeholder="-- Pilih Penduduk Terdaftar --" />
              </SelectTrigger>
              <SelectContent className="max-h-56">
                {candidateList.length === 0 ? (
                  <div className="p-3 text-xs text-muted-foreground text-center">
                    Tidak ada penduduk ditemukan. Coba ketik nama atau NIK.
                  </div>
                ) : (
                  candidateList.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      {p.namaLengkap} - NIK: {p.nik} (Alamat: {p.alamat || "-"})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.selectedPendudukId && (
              <p className="text-xs text-destructive">{errors.selectedPendudukId.message}</p>
            )}
          </div>

          {selectedCandidate && (
            <div className="p-3 rounded-lg border bg-card text-xs space-y-1">
              <p className="font-semibold text-primary">Data Penduduk Terpilih:</p>
              <p>Nama: <strong>{selectedCandidate.namaLengkap}</strong></p>
              <p>NIK: <span className="font-mono">{selectedCandidate.nik}</span></p>
              <p>Alamat: {selectedCandidate.alamat || "-"}</p>
              {selectedCandidate.noKk && (
                <p className="text-amber-500 font-medium">
                  Saat ini terdaftar di KK: {selectedCandidate.noKk} (akan dimutasi ke KK ini)
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mode Create */}
      {mode === "create" && (
        <div className="space-y-6">
          <KependudukanPhotoUpload
            previewUrl={previewUrl}
            onFileSelect={onFileSelect}
            onRemovePreview={onRemovePreview}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-medium">Nomor Induk Kependudukan (NIK) *</label>
              <Input
                placeholder="16 Digit NIK (Angka)"
                maxLength={16}
                inputMode="numeric"
                pattern="[0-9]*"
                onKeyDown={blockNonNumericKeyDown}
                {...register("nik", {
                  onChange: (e) => {
                    e.target.value = e.target.value.replace(/\D/g, "")
                  },
                })}
              />
              {errors.nik && <p className="text-xs text-destructive">{errors.nik.message}</p>}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-medium">Nama Lengkap *</label>
              <Input placeholder="Nama Lengkap Sesuai Akta/KTP" {...register("namaLengkap")} />
              {errors.namaLengkap && (
                <p className="text-xs text-destructive">{errors.namaLengkap.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Tempat Lahir *</label>
              <Input placeholder="Kota/Kabupaten" {...register("tempatLahir")} />
              {errors.tempatLahir && (
                <p className="text-xs text-destructive">{errors.tempatLahir.message}</p>
              )}
            </div>

            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-medium">Tanggal Lahir *</label>
              <Popover>
                <PopoverTrigger
                  className={cn(
                    "w-full h-9 justify-start text-left font-normal inline-flex items-center rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                    !watch("tanggalLahir") && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                  {watch("tanggalLahir") ? (
                    formatDateId(watch("tanggalLahir") as Date)
                  ) : (
                    <span>Pilih tanggal lahir</span>
                  )}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    captionLayout="dropdown"
                    selected={watch("tanggalLahir") as Date}
                    onSelect={(date) => setValue("tanggalLahir", date as Date)}
                  />
                </PopoverContent>
              </Popover>
              {errors.tanggalLahir && (
                <p className="text-xs text-destructive">{errors.tanggalLahir.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Jenis Kelamin</label>
              <Select
                value={watch("jenisKelamin")}
                onValueChange={(val) => setValue("jenisKelamin", val as "Laki-laki" | "Perempuan")}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Pilih jenis kelamin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                  <SelectItem value="Perempuan">Perempuan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Agama</label>
              <Select
                value={watch("agama")}
                onValueChange={(val) => setValue("agama", val as any)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Pilih agama" />
                </SelectTrigger>
                <SelectContent>
                  {AGAMA_OPTIONS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Status Perkawinan</label>
              <Select
                value={watch("statusPerkawinan")}
                onValueChange={(val) => setValue("statusPerkawinan", val as any)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_PERKAWINAN_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Pekerjaan</label>
              <Input placeholder="Contoh: Pelajar / Belum Bekerja" {...register("pekerjaan")} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
