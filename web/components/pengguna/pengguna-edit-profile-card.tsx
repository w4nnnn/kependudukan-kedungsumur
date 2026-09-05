"use client"

import { User, Loader2, Save } from "lucide-react"
import { UseFormReturn } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ProfileFormValues } from "./pengguna-form-schema"

interface PenggunaEditProfileCardProps {
  form: UseFormReturn<ProfileFormValues>
  isSaving: boolean
  isSelf: boolean
  onSubmit: (values: ProfileFormValues) => void
}

export function PenggunaEditProfileCard({
  form,
  isSaving,
  isSelf,
  onSubmit,
}: PenggunaEditProfileCardProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form

  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5" />
          <div>
            <CardTitle>Profil & Hak Akses</CardTitle>
            <CardDescription>
              Perbarui nama lengkap, email, dan peran wewenang pengguna.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Lengkap</label>
              <Input {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Peran Pengguna (Role)</label>
              <Select
                value={watch("role")}
                onValueChange={(val) => setValue("role", val as "admin" | "user")}
                disabled={isSelf}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Peran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Staf (User)</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
              {isSelf && (
                <p className="text-xs text-muted-foreground">
                  Anda tidak dapat mengubah peran akun Anda sendiri.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Wilayah RT Tugas (Opsional)</label>
              <Input placeholder="Contoh: 001" maxLength={3} {...register("rt")} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Wilayah RW Tugas (Opsional)</label>
              <Input placeholder="Contoh: 002" maxLength={3} {...register("rw")} />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? "Menyimpan..." : "Simpan Perubahan Profil"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
