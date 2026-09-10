"use client"

import { UserPlus, UserCheck, Users, Search, Calendar as CalendarIcon } from "lucide-react"
import { UseFormReturn } from "react-hook-form"
import { cn, formatDateId } from "@/lib/utils"
import { blockNonNumericKeyDown } from "@/lib/validation"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AGAMA_OPTIONS, STATUS_PERKAWINAN_OPTIONS } from "@/components/kependudukan/kependudukan-form-schema"
import type { CandidatePenduduk } from "./types"
import type { TambahKkFormValues } from "./kk-form-schema"

interface KkKepalaSelectorProps {
  form: UseFormReturn<TambahKkFormValues>
  candidateList: CandidatePenduduk[]
  candidateSearch: string
  setCandidateSearch: (search: string) => void
}

export function KkKepalaSelector({
  form,
  candidateList,
  candidateSearch,
  setCandidateSearch,
}: KkKepalaSelectorProps) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form

  const modeKepala = watch("modeKepala")

  return (
    <div className="space-y-4 p-4 rounded-xl border bg-muted/20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Pengaturan Kepala Keluarga</h3>
          <p className="text-xs text-muted-foreground">
            Tentukan data Kepala Keluarga pada lembar KK ini.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setValue("modeKepala", "create")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              modeKepala === "create"
                ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                : "border-border/60 bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserPlus className="size-3.5" />
            <span>Buat Penduduk Baru</span>
          </button>
          <button
            type="button"
            onClick={() => setValue("modeKepala", "select")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              modeKepala === "select"
                ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                : "border-border/60 bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserCheck className="size-3.5" />
            <span>Pilih dari Penduduk</span>
          </button>
          <button
            type="button"
            onClick={() => setValue("modeKepala", "none")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              modeKepala === "none"
                ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                : "border-border/60 bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="size-3.5" />
            <span>Tanpa Kepala (Nanti)</span>
          </button>
        </div>
      </div>

      {modeKepala === "select" && (
        <div className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Cari Data Penduduk</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ketik NIK atau Nama Penduduk..."
                className="pl-9 h-9 text-xs"
                value={candidateSearch}
                onChange={(e) => setCandidateSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">Pilih Calon Kepala Keluarga</label>
            <Select
              value={watch("selectedPendudukId")}
              onValueChange={(val) => setValue("selectedPendudukId", val || "")}
            >
              <SelectTrigger className="w-full text-xs h-9">
                <SelectValue placeholder="-- Pilih Penduduk Terdaftar --" />
              </SelectTrigger>
              <SelectContent className="max-h-56">
                {candidateList.length === 0 ? (
                  <div className="p-3 text-xs text-muted-foreground text-center">
                    Tidak ada penduduk ditemukan. Silakan cari nama/NIK lain.
                  </div>
                ) : (
                  candidateList.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      {p.namaLengkap} - NIK: {p.nik} ({p.alamat})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {modeKepala === "create" && (
        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-medium">Nomor Induk Kependudukan (NIK) (16 Digit Angka)</label>
              <Input
                placeholder="16 Digit NIK Kepala Keluarga (Angka)"
                maxLength={16}
                inputMode="numeric"
                pattern="[0-9]*"
                onKeyDown={blockNonNumericKeyDown}
                {...register("nikBaru", {
                  onChange: (e) => {
                    e.target.value = e.target.value.replace(/\D/g, "")
                  },
                })}
              />
              {errors.nikBaru && <p className="text-xs text-destructive">{errors.nikBaru.message}</p>}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-medium">Nama Lengkap</label>
              <Input placeholder="Nama Lengkap Kepala Keluarga" {...register("namaBaru")} />
              {errors.namaBaru && <p className="text-xs text-destructive">{errors.namaBaru.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Tempat Lahir</label>
              <Input placeholder="Kota / Kabupaten" {...register("tempatLahirBaru")} />
              {errors.tempatLahirBaru && (
                <p className="text-xs text-destructive">{errors.tempatLahirBaru.message}</p>
              )}
            </div>

            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-medium">Tanggal Lahir</label>
              <Popover>
                <PopoverTrigger
                  className={cn(
                    "w-full h-9 justify-start text-left font-normal inline-flex items-center rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                    !watch("tanggalLahirBaru") && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                  {watch("tanggalLahirBaru") ? (
                    formatDateId(watch("tanggalLahirBaru") as Date)
                  ) : (
                    <span>Pilih tanggal lahir</span>
                  )}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    captionLayout="dropdown"
                    selected={watch("tanggalLahirBaru") as Date}
                    onSelect={(date) => setValue("tanggalLahirBaru", date as Date, { shouldValidate: true })}
                  />
                </PopoverContent>
              </Popover>
              {errors.tanggalLahirBaru && (
                <p className="text-xs text-destructive">{errors.tanggalLahirBaru.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Jenis Kelamin</label>
              <Select
                value={watch("jenisKelaminBaru")}
                onValueChange={(val) =>
                  setValue("jenisKelaminBaru", val as "Laki-laki" | "Perempuan", { shouldValidate: true })
                }
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Pilih jenis kelamin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                  <SelectItem value="Perempuan">Perempuan</SelectItem>
                </SelectContent>
              </Select>
              {errors.jenisKelaminBaru && (
                <p className="text-xs text-destructive">{errors.jenisKelaminBaru.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Agama</label>
              <Select
                value={watch("agamaBaru")}
                onValueChange={(val) => setValue("agamaBaru", val as any, { shouldValidate: true })}
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
              {errors.agamaBaru && <p className="text-xs text-destructive">{errors.agamaBaru.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Status Perkawinan</label>
              <Select
                value={watch("statusPerkawinanBaru")}
                onValueChange={(val) =>
                  setValue("statusPerkawinanBaru", val as any, { shouldValidate: true })
                }
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
              {errors.statusPerkawinanBaru && (
                <p className="text-xs text-destructive">{errors.statusPerkawinanBaru.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Pekerjaan</label>
              <Input placeholder="Contoh: Petani / Wiraswasta" {...register("pekerjaanBaru")} />
              {errors.pekerjaanBaru && (
                <p className="text-xs text-destructive">{errors.pekerjaanBaru.message}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {modeKepala === "none" && (
        <div className="p-3 text-xs text-muted-foreground bg-background rounded-lg border">
          KK akan dibuat tanpa data Kepala Keluarga terlebih dahulu. Anda dapat menambahkan anggota
          dan menetapkan Kepala Keluarga nanti.
        </div>
      )}
    </div>
  )
}
