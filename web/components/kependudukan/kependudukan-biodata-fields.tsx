"use client"

import { Calendar as CalendarIcon } from "lucide-react"
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
  type EditPendudukFormValues,
} from "./kependudukan-form-schema"

interface KependudukanBiodataFieldsProps<T extends EditPendudukFormValues> {
  form: UseFormReturn<T>
  showNoKkField?: boolean
}

export function KependudukanBiodataFields<T extends EditPendudukFormValues>({
  form,
  showNoKkField = false,
}: KependudukanBiodataFieldsProps<T>) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Optional Nomor KK (if not using KK selector) */}
      {showNoKkField && (
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Nomor Kartu Keluarga (KK)</label>
          <Input
            placeholder="16 Digit Nomor KK"
            maxLength={16}
            onKeyDown={blockNonNumericKeyDown}
            {...register("noKk" as any)}
          />
          {errors.noKk && <p className="text-sm text-destructive">{errors.noKk.message as string}</p>}
        </div>
      )}

      {/* NIK */}
      <div className="space-y-2 md:col-span-2">
        <label className="text-sm font-medium">Nomor Induk Kependudukan (NIK)</label>
        <Input
          placeholder="16 Digit NIK"
          maxLength={16}
          onKeyDown={blockNonNumericKeyDown}
          {...register("nik" as any)}
        />
        {errors.nik && <p className="text-sm text-destructive">{errors.nik.message as string}</p>}
      </div>

      {/* Nama Lengkap */}
      <div className="space-y-2 md:col-span-2">
        <label className="text-sm font-medium">Nama Lengkap</label>
        <Input placeholder="Sesuai KTP/KK" {...register("namaLengkap" as any)} />
        {errors.namaLengkap && (
          <p className="text-sm text-destructive">{errors.namaLengkap.message as string}</p>
        )}
      </div>

      {/* Tempat & Tanggal Lahir */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Tempat Lahir</label>
        <Input placeholder="Nama Kota/Kabupaten" {...register("tempatLahir" as any)} />
        {errors.tempatLahir && (
          <p className="text-sm text-destructive">{errors.tempatLahir.message as string}</p>
        )}
      </div>

      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium">Tanggal Lahir</label>
        <Popover>
          <PopoverTrigger
            className={cn(
              "w-full h-9 justify-start text-left font-normal inline-flex items-center rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
              !watch("tanggalLahir" as any) && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {watch("tanggalLahir" as any) ? (
              formatDateId(watch("tanggalLahir" as any) as Date)
            ) : (
              <span>Pilih tanggal</span>
            )}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              captionLayout="dropdown"
              selected={watch("tanggalLahir" as any) as Date}
              onSelect={(date) => setValue("tanggalLahir" as any, date as any)}
            />
          </PopoverContent>
        </Popover>
        {errors.tanggalLahir && (
          <p className="text-sm text-destructive">{errors.tanggalLahir.message as string}</p>
        )}
      </div>

      {/* Jenis Kelamin */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Jenis Kelamin</label>
        <Select
          value={watch("jenisKelamin" as any)}
          onValueChange={(val) => setValue("jenisKelamin" as any, val as any)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih jenis kelamin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Laki-laki">Laki-laki</SelectItem>
            <SelectItem value="Perempuan">Perempuan</SelectItem>
          </SelectContent>
        </Select>
        {errors.jenisKelamin && (
          <p className="text-sm text-destructive">{errors.jenisKelamin.message as string}</p>
        )}
      </div>

      {/* Alamat */}
      <div className="space-y-2 md:col-span-2">
        <label className="text-sm font-medium">Alamat Lengkap</label>
        <Input placeholder="Nama Jalan / Dusun / RT / RW" {...register("alamat" as any)} />
        {errors.alamat && <p className="text-sm text-destructive">{errors.alamat.message as string}</p>}
      </div>

      {/* RT & RW */}
      <div className="space-y-2">
        <label className="text-sm font-medium">RT</label>
        <Input
          placeholder="Contoh: 001"
          maxLength={3}
          onKeyDown={blockNonNumericKeyDown}
          {...register("rt" as any)}
        />
        {errors.rt && <p className="text-sm text-destructive">{errors.rt.message as string}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">RW</label>
        <Input
          placeholder="Contoh: 002"
          maxLength={3}
          onKeyDown={blockNonNumericKeyDown}
          {...register("rw" as any)}
        />
        {errors.rw && <p className="text-sm text-destructive">{errors.rw.message as string}</p>}
      </div>

      {/* Agama */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Agama</label>
        <Select
          value={watch("agama" as any)}
          onValueChange={(val) => setValue("agama" as any, val as any)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih agama" />
          </SelectTrigger>
          <SelectContent>
            {AGAMA_OPTIONS.map((agama) => (
              <SelectItem key={agama} value={agama}>
                {agama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.agama && <p className="text-sm text-destructive">{errors.agama.message as string}</p>}
      </div>

      {/* Status Perkawinan */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Status Perkawinan</label>
        <Select
          value={watch("statusPerkawinan" as any)}
          onValueChange={(val) => setValue("statusPerkawinan" as any, val as any)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih status perkawinan" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_PERKAWINAN_OPTIONS.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.statusPerkawinan && (
          <p className="text-sm text-destructive">{errors.statusPerkawinan.message as string}</p>
        )}
      </div>

      {/* Status Hubungan Dalam Keluarga (SHDK) */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Status Hubungan di KK (SHDK)</label>
        <Select
          value={watch("shdk" as any)}
          onValueChange={(val) => setValue("shdk" as any, val as any)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih status dalam keluarga" />
          </SelectTrigger>
          <SelectContent>
            {SHDK_OPTIONS.map((shdk) => (
              <SelectItem key={shdk} value={shdk}>
                {shdk}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.shdk && <p className="text-sm text-destructive">{errors.shdk.message as string}</p>}
      </div>

      {/* Pekerjaan */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Pekerjaan</label>
        <Input placeholder="Contoh: Petani / Wiraswasta" {...register("pekerjaan" as any)} />
        {errors.pekerjaan && (
          <p className="text-sm text-destructive">{errors.pekerjaan.message as string}</p>
        )}
      </div>
    </div>
  )
}
