"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, ArrowLeft, UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel,
  SelectGroup,
} from "@/components/ui/select"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"

const userSchema = z.object({
  name: z.string().min(3, "Nama lengkap minimal 3 karakter"),
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .regex(/^[a-zA-Z0-9_.-]+$/, "Username hanya boleh huruf, angka, underscore, titik, dan strip"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(["admin", "user"], {
    required_error: "Pilih peran (role) pengguna",
  }),
})

type UserFormValues = z.infer<typeof userSchema>

export default function TambahPenggunaPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

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
    },
  })

  async function onSubmit(data: UserFormValues) {
    setIsLoading(true)

    try {
      const res = await authClient.admin.createUser({
        name: data.name,
        email: data.email.toLowerCase(),
        password: data.password,
        role: data.role,
        data: {
          username: data.username.toLowerCase(),
        },
      })

      if (res.data) {
        toast.success("Berhasil", {
          description: `Pengguna ${data.name} berhasil dibuat.`,
        })
        router.push("/pengguna")
      } else if (res.error) {
        let msg = res.error.message || "Gagal membuat pengguna baru."
        if (
          res.error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" ||
          res.error.message?.toLowerCase().includes("email")
        ) {
          msg = "Email atau username sudah terdaftar dalam sistem."
        }
        toast.error("Gagal Menambahkan", {
          description: msg,
        })
      }
    } catch (error) {
      console.error(error)
      toast.error("Kesalahan Jaringan", {
        description: "Gagal terhubung ke server.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col p-4 md:p-8">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/pengguna")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tambah Pengguna Baru</h1>
            <p className="text-muted-foreground text-sm">
              Buat akun administrator atau staf baru untuk sistem kependudukan.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Formulir Akun Pengguna</CardTitle>
            <CardDescription>
              Isi data kredensial login dan profil pengguna di bawah ini.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Nama Lengkap */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Nama Lengkap</label>
                  <Input
                    placeholder="Contoh: Budi Santoso"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Username</label>
                  <Input
                    placeholder="Contoh: budisantoso"
                    {...register("username")}
                  />
                  {errors.username && (
                    <p className="text-sm text-destructive">{errors.username.message}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    placeholder="budi@kedungsumur.desa.id"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kata Sandi (Password)</label>
                  <Input
                    type="password"
                    placeholder="Minimal 6 karakter"
                    {...register("password")}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>

                {/* Role */}
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
                  {errors.role && (
                    <p className="text-sm text-destructive">{errors.role.message}</p>
                  )}
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
