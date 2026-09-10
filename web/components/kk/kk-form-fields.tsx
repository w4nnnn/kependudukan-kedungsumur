"use client"

import { Calendar as CalendarIcon } from "lucide-react"
import { UseFormReturn } from "react-hook-form"
import { cn, formatDateId } from "@/lib/utils"
import { blockNonNumericKeyDown } from "@/lib/validation"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { EditKkFormValues } from "./kk-form-schema"

interface KkFormFieldsProps<T extends EditKkFormValues> {
  form: UseFormReturn<T>
}

export function KkFormFields<T extends EditKkFormValues>({ form }: KkFormFieldsProps<T>) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2 md:col-span-2">
        <label className="text-sm font-medium">Nomor Kartu Keluarga (KK) (16 Digit Angka)</label>
        <Input
          placeholder="16 Digit Nomor KK (Angka)"
          maxLength={16}
          inputMode="numeric"
          pattern="[0-9]*"
          onKeyDown={blockNonNumericKeyDown}
          {...register("noKk" as any, {
            onChange: (e) => {
              e.target.value = e.target.value.replace(/\D/g, "")
            },
          })}
        />
        {errors.noKk && <p className="text-sm text-destructive">{errors.noKk.message as string}</p>}
      </div>

      <div className="space-y-2 md:col-span-2">
        <label className="text-sm font-medium">Alamat Domisili Keluarga</label>
        <Input placeholder="Nama Jalan / Gang / No. Rumah" {...register("alamat" as any)} />
        {errors.alamat && <p className="text-sm text-destructive">{errors.alamat.message as string}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">RT</label>
        <Input
          placeholder="001"
          maxLength={3}
          inputMode="numeric"
          pattern="[0-9]*"
          onKeyDown={blockNonNumericKeyDown}
          {...register("rt" as any, {
            onChange: (e) => {
              e.target.value = e.target.value.replace(/\D/g, "")
            },
          })}
        />
        {errors.rt && <p className="text-sm text-destructive">{errors.rt.message as string}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">RW</label>
        <Input
          placeholder="002"
          maxLength={3}
          inputMode="numeric"
          pattern="[0-9]*"
          onKeyDown={blockNonNumericKeyDown}
          {...register("rw" as any, {
            onChange: (e) => {
              e.target.value = e.target.value.replace(/\D/g, "")
            },
          })}
        />
        {errors.rw && <p className="text-sm text-destructive">{errors.rw.message as string}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Dusun</label>
        <Input placeholder="Contoh: Dusun Krajan" {...register("dusun" as any)} />
        {errors.dusun && <p className="text-sm text-destructive">{errors.dusun.message as string}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Kode Pos (5 Digit Angka)</label>
        <Input
          placeholder="65171"
          maxLength={5}
          inputMode="numeric"
          pattern="[0-9]*"
          onKeyDown={blockNonNumericKeyDown}
          {...register("kodePos" as any, {
            onChange: (e) => {
              e.target.value = e.target.value.replace(/\D/g, "")
            },
          })}
        />
        {errors.kodePos && <p className="text-sm text-destructive">{errors.kodePos.message as string}</p>}
      </div>

      <div className="flex flex-col space-y-2 md:col-span-2">
        <label className="text-sm font-medium">Tanggal Dikeluarkan KK</label>
        <Popover>
          <PopoverTrigger
            className={cn(
              "w-full h-9 justify-start text-left font-normal inline-flex items-center rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
              !watch("tanggalDikeluarkan" as any) && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {watch("tanggalDikeluarkan" as any) ? (
              formatDateId(watch("tanggalDikeluarkan" as any) as Date)
            ) : (
              <span>Pilih tanggal terbit KK</span>
            )}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              captionLayout="dropdown"
              selected={watch("tanggalDikeluarkan" as any) as Date}
              onSelect={(date) => setValue("tanggalDikeluarkan" as any, date as any)}
            />
          </PopoverContent>
        </Popover>
        {errors.tanggalDikeluarkan && (
          <p className="text-sm text-destructive">{errors.tanggalDikeluarkan.message as string}</p>
        )}
      </div>
    </div>
  )
}
