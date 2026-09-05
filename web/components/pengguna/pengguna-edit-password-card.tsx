"use client"

import { KeyRound, Loader2, Save } from "lucide-react"
import { UseFormReturn } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { PasswordFormValues } from "./pengguna-form-schema"

interface PenggunaEditPasswordCardProps {
  form: UseFormReturn<PasswordFormValues>
  isChanging: boolean
  onSubmit: (values: PasswordFormValues) => void
}

export function PenggunaEditPasswordCard({
  form,
  isChanging,
  onSubmit,
}: PenggunaEditPasswordCardProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form

  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          <div>
            <CardTitle>Ubah Kata Sandi (Password)</CardTitle>
            <CardDescription>
              Atur ulang kata sandi pengguna ini jika diperlukan.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Kata Sandi Baru</label>
              <Input
                type="password"
                placeholder="Minimal 6 karakter"
                {...register("newPassword")}
              />
              {errors.newPassword && (
                <p className="text-sm text-destructive">{errors.newPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Konfirmasi Kata Sandi</label>
              <Input
                type="password"
                placeholder="Ulangi kata sandi baru"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="secondary" disabled={isChanging} className="gap-2">
              {isChanging ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isChanging ? "Menyimpan..." : "Perbarui Kata Sandi"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
