"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Loader2,
  ArrowLeft,
  User,
  KeyRound,
  ShieldAlert,
  Save,
  CheckCircle2,
  Ban,
  Trash2,
  AlertTriangle,
} from "lucide-react"

import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

// Profile Schema
const profileSchema = z.object({
  name: z.string().min(3, "Nama lengkap minimal 3 karakter"),
  email: z.string().email("Format email tidak valid"),
  role: z.enum(["admin", "user"]),
})

type ProfileFormValues = z.infer<typeof profileSchema>

// Password Schema
const passwordSchema = z
  .object({
    newPassword: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string().min(6, "Konfirmasi password minimal 6 karakter"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  })

type PasswordFormValues = z.infer<typeof passwordSchema>

interface UserDetail {
  id: string
  name: string
  email: string
  username?: string | null
  displayUsername?: string | null
  role?: string | null
  banned?: boolean | null
  banReason?: string | null
  createdAt?: string | Date
}

export default function EditPenggunaPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const userId = params?.id

  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [userData, setUserData] = useState<UserDetail | null>(null)

  // Submitting States
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isUpdatingBan, setIsUpdatingBan] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [banReasonInput, setBanReasonInput] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const { data: session, isPending: isSessionPending } = authClient.useSession()

  // Profile Form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    setValue: setProfileValue,
    watch: watchProfile,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "user",
    },
  })

  // Password Form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  })

  // Load User Data
  const loadUser = async () => {
    if (!userId) return
    setIsLoadingUser(true)
    try {
      // Ambil user dari listUsers filter id atau query list
      const res = await authClient.admin.listUsers({
        query: {
          limit: 100,
        },
      })

      if (res.data) {
        const found = (res.data.users as UserDetail[]).find((u) => u.id === userId)
        if (found) {
          setUserData(found)
          resetProfile({
            name: found.name,
            email: found.email,
            role: (found.role as "admin" | "user") || "user",
          })
          setBanReasonInput(found.banReason || "")
        } else {
          toast.error("Pengguna tidak ditemukan")
          router.push("/pengguna")
        }
      } else {
        toast.error("Gagal memuat data pengguna", {
          description: res.error?.message,
        })
        router.push("/pengguna")
      }
    } catch (error) {
      console.error(error)
      toast.error("Kesalahan jaringan", {
        description: "Gagal terhubung ke server.",
      })
      router.push("/pengguna")
    } finally {
      setIsLoadingUser(false)
    }
  }

  useEffect(() => {
    if (!isSessionPending && !session) {
      router.push("/login")
    } else if (session) {
      loadUser()
    }
  }, [userId, session, isSessionPending])

  // Handle Update Profile & Role
  async function onProfileSubmit(values: ProfileFormValues) {
    if (!userId) return
    setIsSavingProfile(true)

    try {
      // Update User Name & Email
      const updateRes = await authClient.admin.updateUser({
        userId,
        data: {
          name: values.name,
          email: values.email.toLowerCase(),
          role: values.role,
        },
      })

      if (updateRes.error) {
        toast.error("Gagal memperbarui profil", {
          description: updateRes.error.message || "Terjadi kesalahan.",
        })
        return
      }

      // Pastikan role tersinkronkan juga via setRole
      const roleRes = await authClient.admin.setRole({
        userId,
        role: values.role,
      })

      if (roleRes.error) {
        toast.error("Gagal memperbarui peran", {
          description: roleRes.error.message,
        })
        return
      }

      toast.success("Berhasil", {
        description: "Data profil dan peran pengguna berhasil diperbarui.",
      })
      loadUser()
    } catch (error) {
      console.error(error)
      toast.error("Kesalahan Jaringan", {
        description: "Gagal terhubung ke server.",
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  // Handle Set Password
  async function onPasswordSubmit(values: PasswordFormValues) {
    if (!userId) return
    setIsChangingPassword(true)

    try {
      const res = await authClient.admin.setUserPassword({
        userId,
        newPassword: values.newPassword,
      })

      if (res.error) {
        toast.error("Gagal mengganti kata sandi", {
          description: res.error.message || "Terjadi kesalahan pada server.",
        })
      } else {
        toast.success("Berhasil", {
          description: "Kata sandi pengguna berhasil diubah.",
        })
        resetPassword()
      }
    } catch (error) {
      console.error(error)
      toast.error("Kesalahan Jaringan", {
        description: "Gagal terhubung ke server.",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  // Handle Ban / Unban
  async function toggleBan() {
    if (!userId || !userData) return

    if (userData.id === session?.user?.id) {
      toast.error("Operasi ditolak", {
        description: "Anda tidak dapat memblokir akun Anda sendiri.",
      })
      return
    }

    setIsUpdatingBan(true)

    try {
      if (userData.banned) {
        // Unban
        const res = await authClient.admin.unbanUser({
          userId,
        })

        if (res.error) {
          toast.error("Gagal membuka blokir", {
            description: res.error.message,
          })
        } else {
          toast.success("Berhasil", {
            description: "Status blokir pengguna telah dicabut.",
          })
          loadUser()
        }
      } else {
        // Ban
        const res = await authClient.admin.banUser({
          userId,
          banReason: banReasonInput.trim() || "Diblokir oleh administrator",
        })

        if (res.error) {
          toast.error("Gagal memblokir pengguna", {
            description: res.error.message,
          })
        } else {
          toast.success("Berhasil", {
            description: "Akun pengguna telah diblokir.",
          })
          loadUser()
        }
      }
    } catch (error) {
      console.error(error)
      toast.error("Kesalahan Jaringan", {
        description: "Gagal terhubung ke server.",
      })
    } finally {
      setIsUpdatingBan(false)
    }
  }

  // Handle Delete User
  async function handleDeleteUser() {
    if (!userId || !userData) return

    if (userData.id === session?.user?.id) {
      toast.error("Operasi ditolak", {
        description: "Anda tidak dapat menghapus akun Anda sendiri.",
      })
      setShowDeleteDialog(false)
      return
    }

    setIsDeleting(true)

    try {
      const res = await authClient.admin.removeUser({
        userId,
      })

      if (res.error) {
        toast.error("Gagal menghapus pengguna", {
          description: res.error.message,
        })
      } else {
        toast.success("Berhasil", {
          description: `Akun ${userData.name} telah dihapus permanen.`,
        })
        router.push("/pengguna")
      }
    } catch (error) {
      console.error(error)
      toast.error("Kesalahan Jaringan", {
        description: "Gagal terhubung ke server.",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  if (isSessionPending || isLoadingUser) {
    return (
      <div className="flex h-full min-h-screen items-center justify-center p-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session || !userData) return null

  const isSelf = userData.id === session.user.id

  return (
    <div className="flex min-h-screen w-full flex-col p-4 md:p-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/pengguna")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{userData.name}</h1>
              {userData.banned ? (
                <Badge variant="destructive" className="gap-1">
                  <Ban className="h-3 w-3" /> Diblokir
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 text-emerald-500 border-emerald-500/20 bg-emerald-500/10">
                  <CheckCircle2 className="h-3 w-3" /> Aktif
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              Username: <span className="font-mono text-foreground font-medium">{userData.username || userData.displayUsername || "-"}</span> | Email: <span className="text-foreground">{userData.email}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Card 1: Informasi Profil & Role */}
          <Card>
            <CardHeader className="border-b pb-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Profil & Hak Akses</CardTitle>
                  <CardDescription>
                    Perbarui nama lengkap, email, dan peran wewenang pengguna.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nama Lengkap</label>
                    <Input {...registerProfile("name")} />
                    {profileErrors.name && (
                      <p className="text-sm text-destructive">{profileErrors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input type="email" {...registerProfile("email")} />
                    {profileErrors.email && (
                      <p className="text-sm text-destructive">{profileErrors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Peran Pengguna (Role)</label>
                    <Select
                      value={watchProfile("role")}
                      onValueChange={(val) => setProfileValue("role", val as "admin" | "user")}
                      disabled={isSelf}
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
                    {isSelf && (
                      <p className="text-xs text-muted-foreground">
                        Anda tidak dapat mengubah peran akun Anda sendiri.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isSavingProfile} className="gap-2">
                    {isSavingProfile ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {isSavingProfile ? "Menyimpan..." : "Simpan Profil"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Card 2: Ubah Password */}
          <Card>
            <CardHeader className="border-b pb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Ubah Kata Sandi (Password)</CardTitle>
                  <CardDescription>
                    Reset atau tetapkan kata sandi baru untuk akun pengguna ini.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Kata Sandi Baru</label>
                    <Input
                      type="password"
                      placeholder="Minimal 6 karakter"
                      {...registerPassword("newPassword")}
                    />
                    {passwordErrors.newPassword && (
                      <p className="text-sm text-destructive">
                        {passwordErrors.newPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Konfirmasi Kata Sandi Baru</label>
                    <Input
                      type="password"
                      placeholder="Ulangi kata sandi baru"
                      {...registerPassword("confirmPassword")}
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="text-sm text-destructive">
                        {passwordErrors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    variant="secondary"
                    disabled={isChangingPassword}
                    className="gap-2"
                  >
                    {isChangingPassword ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <KeyRound className="h-4 w-4" />
                    )}
                    {isChangingPassword ? "Memperbarui..." : "Update Kata Sandi"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Card 3: Status Pemblokiran Akun (Ban / Unban) */}
          <Card className={userData.banned ? "border-destructive/30" : ""}>
            <CardHeader className="border-b pb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-500" />
                <div>
                  <CardTitle>Status Akses & Pemblokiran</CardTitle>
                  <CardDescription>
                    Blokir sementara akun pengguna agar tidak dapat masuk ke sistem.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {userData.banned ? (
                <div className="space-y-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="flex items-center gap-2 text-destructive font-medium text-sm">
                    <Ban className="h-4 w-4" /> Akun ini saat ini sedang diblokir
                  </div>
                  {userData.banReason && (
                    <p className="text-xs text-muted-foreground">
                      <strong>Alasan pemblokiran:</strong> {userData.banReason}
                    </p>
                  )}
                  <Button
                    onClick={toggleBan}
                    disabled={isUpdatingBan || isSelf}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isUpdatingBan ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Cabut Pemblokiran (Buka Blokir)
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Alasan Pemblokiran (Opsional)</label>
                    <Input
                      placeholder="Contoh: Mutasi staf / pelanggaran keamanan"
                      value={banReasonInput}
                      onChange={(e) => setBanReasonInput(e.target.value)}
                      disabled={isSelf}
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={toggleBan}
                    disabled={isUpdatingBan || isSelf}
                    className="text-amber-500 border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-600"
                  >
                    {isUpdatingBan ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Ban className="mr-2 h-4 w-4" />
                    )}
                    Blokir Akun Pengguna
                  </Button>
                  {isSelf && (
                    <p className="text-xs text-muted-foreground">
                      Anda tidak dapat memblokir akun Anda sendiri.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 4: Zona Bahaya (Hapus Akun) */}
          <Card className="border-destructive/40 bg-destructive/5">
            <CardHeader className="border-b border-destructive/20 pb-4">
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                <div>
                  <CardTitle className="text-destructive">Zona Bahaya</CardTitle>
                  <CardDescription>
                    Tindakan menghapus akun tidak dapat dibatalkan dan akan menghapus seluruh data sesi.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm text-foreground">Hapus Akun Pengguna Ini</p>
                <p className="text-xs text-muted-foreground">
                  Akun akan dihapus secara permanen dari basis data sistem.
                </p>
              </div>
              <Button
                variant="destructive"
                disabled={isSelf}
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Hapus Akun
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog Konfirmasi Hapus */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Konfirmasi Penghapusan Akun
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda benar-benar yakin ingin menghapus akun atas nama <strong>{userData.name}</strong>? Tindakan ini bersifat permanen dan tidak dapat dipulihkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteUser()
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menghapus...
                </>
              ) : (
                "Hapus Permanen"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
