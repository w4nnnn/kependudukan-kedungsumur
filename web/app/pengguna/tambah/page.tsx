"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"
import type { UserFormValues } from "@/components/pengguna/pengguna-form-schema"
import { PenggunaCreateForm } from "@/components/pengguna/pengguna-create-form"

export default function TambahPenggunaPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

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
          rt: data.rt || null,
          rw: data.rw || null,
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
        toast.error("Gagal Menambahkan", { description: msg })
      }
    } catch (error) {
      console.error(error)
      toast.error("Kesalahan Jaringan", { description: "Gagal terhubung ke server." })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col p-4 md:p-8">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/pengguna")}>
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
            <PenggunaCreateForm isLoading={isLoading} onSubmit={onSubmit} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
