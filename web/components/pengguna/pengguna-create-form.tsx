"use client"

import { Loader2, UserPlus } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select"
import { userSchema, type UserFormValues } from "./pengguna-form-schema"

interface PenggunaCreateFormProps {
  isLoading: boolean
  onSubmit: (data: UserFormValues) => void
}

export function PenggunaCreateForm({ isLoading, onSubmit }: PenggunaCreateFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      role: "user",
      rt: "",
      rw: "",
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Nama Lengkap</label>
          <Input placeholder="Contoh: Budi Santoso" {...register("name")} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Username</label>
          <Input placeholder="Contoh: budisantoso" {...register("username")} />
          {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <Input type="email" placeholder="budi@kedungsumur.desa.id" {...register("email")} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Kata Sandi (Password)</label>
          <Input type="password" placeholder="Minimal 6 karakter" {...register("password")} />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Peran (Role)</label>
          <Select
            value={watch("role")}
            onValueChange={(val) => setValue("role", val as "admin" | "user")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih Peran" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Peran Pengguna</SelectLabel>
                <SelectItem value="user">Staf (User)</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
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

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isLoading} className="gap-2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          {isLoading ? "Menyimpan..." : "Buat Akun"}
        </Button>
      </div>
    </form>
  )
}
