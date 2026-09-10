"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import type { UserDetail } from "./types"
import {
  profileSchema,
  passwordSchema,
  type ProfileFormValues,
  type PasswordFormValues,
} from "./pengguna-form-schema"

export function useEditPengguna(userId: string | undefined, sessionUserId?: string) {
  const router = useRouter()
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [userData, setUserData] = useState<UserDetail | null>(null)

  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isUpdatingBan, setIsUpdatingBan] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [banReasonInput, setBanReasonInput] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "user",
      rt: "",
      rw: "",
    },
  })

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  })

  const loadUser = async () => {
    if (!userId) return
    setIsLoadingUser(true)
    try {
      let found: UserDetail | null = null

      try {
        const userRes = await (authClient.admin as any).getUser({
          query: {
            id: userId,
          },
        })
        if (userRes?.data) {
          found = (userRes.data.user || userRes.data) as UserDetail
        }
      } catch {
        found = null
      }

      if (!found || !found.id) {
        const res = await authClient.admin.listUsers({
          query: {
            limit: 100,
          },
        })

        if (res?.data?.users) {
          found = (res.data.users as UserDetail[]).find((u) => u.id === userId) || null
        }
      }

      if (found && found.id) {
        setUserData(found)
        profileForm.reset({
          name: found.name,
          email: found.email,
          role: (found.role as "admin" | "user") || "user",
          rt: found.rt || "",
          rw: found.rw || "",
        })
        setBanReasonInput(found.banReason || "")
      } else {
        toast.error("Pengguna tidak ditemukan")
        router.push("/pengguna")
      }
    } catch (error) {
      console.error(error)
      toast.error("Kesalahan jaringan", { description: "Gagal terhubung ke server." })
      router.push("/pengguna")
    } finally {
      setIsLoadingUser(false)
    }
  }

  useEffect(() => {
    loadUser()
  }, [userId])

  const onProfileSubmit = async (values: ProfileFormValues) => {
    if (!userId) return
    setIsSavingProfile(true)

    try {
      const updateRes = await authClient.admin.updateUser({
        userId,
        data: {
          name: values.name,
          email: values.email.toLowerCase(),
          role: values.role,
          rt: values.rt || null,
          rw: values.rw || null,
        },
      })

      if (updateRes.error) {
        toast.error("Gagal memperbarui profil", {
          description: updateRes.error.message || "Terjadi kesalahan.",
        })
        return
      }

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
      toast.error("Kesalahan Jaringan", { description: "Gagal terhubung ke server." })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const onPasswordSubmit = async (values: PasswordFormValues) => {
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
        passwordForm.reset()
      }
    } catch (error) {
      console.error(error)
      toast.error("Kesalahan Jaringan", { description: "Gagal terhubung ke server." })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const toggleBan = async () => {
    if (!userId || !userData) return

    if (userData.id === sessionUserId) {
      toast.error("Operasi ditolak", {
        description: "Anda tidak dapat memblokir akun Anda sendiri.",
      })
      return
    }

    setIsUpdatingBan(true)

    try {
      if (userData.banned) {
        const res = await authClient.admin.unbanUser({ userId })
        if (res.error) {
          toast.error("Gagal membuka blokir", { description: res.error.message })
        } else {
          toast.success("Berhasil", { description: "Status blokir pengguna telah dicabut." })
          loadUser()
        }
      } else {
        const res = await authClient.admin.banUser({
          userId,
          banReason: banReasonInput.trim() || "Diblokir oleh administrator",
        })
        if (res.error) {
          toast.error("Gagal memblokir pengguna", { description: res.error.message })
        } else {
          toast.success("Berhasil", { description: "Akun pengguna telah diblokir." })
          loadUser()
        }
      }
    } catch (error) {
      console.error(error)
      toast.error("Kesalahan Jaringan", { description: "Gagal terhubung ke server." })
    } finally {
      setIsUpdatingBan(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!userId || !userData) return

    if (userData.id === sessionUserId) {
      toast.error("Operasi ditolak", {
        description: "Anda tidak dapat menghapus akun Anda sendiri.",
      })
      setShowDeleteDialog(false)
      return
    }

    setIsDeleting(true)

    try {
      const res = await authClient.admin.removeUser({ userId })
      if (res.error) {
        toast.error("Gagal menghapus pengguna", { description: res.error.message })
      } else {
        toast.success("Berhasil", {
          description: `Akun ${userData.name} telah dihapus permanen.`,
        })
        router.push("/pengguna")
      }
    } catch (error) {
      console.error(error)
      toast.error("Kesalahan Jaringan", { description: "Gagal terhubung ke server." })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return {
    userData,
    isLoadingUser,
    isSavingProfile,
    isChangingPassword,
    isUpdatingBan,
    isDeleting,
    banReasonInput,
    setBanReasonInput,
    showDeleteDialog,
    setShowDeleteDialog,
    profileForm,
    passwordForm,
    onProfileSubmit,
    onPasswordSubmit,
    toggleBan,
    handleDeleteUser,
  }
}
