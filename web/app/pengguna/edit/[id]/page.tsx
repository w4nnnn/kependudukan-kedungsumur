"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Loader2, ArrowLeft, Ban, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { authClient } from "@/lib/auth-client"
import { useEditPengguna } from "@/components/pengguna/use-edit-pengguna"
import { PenggunaEditProfileCard } from "@/components/pengguna/pengguna-edit-profile-card"
import { PenggunaEditPasswordCard } from "@/components/pengguna/pengguna-edit-password-card"
import { PenggunaEditBanCard } from "@/components/pengguna/pengguna-edit-ban-card"
import { PenggunaEditDangerCard } from "@/components/pengguna/pengguna-edit-danger-card"

export default function EditPenggunaPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const userId = params?.id

  const { data: session, isPending: isSessionPending } = authClient.useSession()

  const {
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
  } = useEditPengguna(userId, session?.user?.id)

  useEffect(() => {
    if (!isSessionPending) {
      if (!session) {
        router.push("/login")
      } else if ((session.user as any).role !== "admin") {
        router.push("/dashboard")
      }
    }
  }, [session, isSessionPending, router])

  if (isSessionPending || isLoadingUser) {
    return (
      <div className="flex h-full min-h-screen items-center justify-center p-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session || (session.user as any).role !== "admin" || !userData) return null

  const isSelf = userData.id === session.user.id

  return (
    <div className="flex min-h-screen w-full flex-col p-4 md:p-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/pengguna")}>
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
          <PenggunaEditProfileCard
            form={profileForm}
            isSaving={isSavingProfile}
            isSelf={isSelf}
            onSubmit={onProfileSubmit}
          />

          <PenggunaEditPasswordCard
            form={passwordForm}
            isChanging={isChangingPassword}
            onSubmit={onPasswordSubmit}
          />

          <PenggunaEditBanCard
            userData={userData}
            isSelf={isSelf}
            isUpdatingBan={isUpdatingBan}
            banReasonInput={banReasonInput}
            setBanReasonInput={setBanReasonInput}
            onToggleBan={toggleBan}
          />

          <PenggunaEditDangerCard
            userData={userData}
            isSelf={isSelf}
            isDeleting={isDeleting}
            showDeleteDialog={showDeleteDialog}
            setShowDeleteDialog={setShowDeleteDialog}
            onDeleteUser={handleDeleteUser}
          />
        </div>
      </div>
    </div>
  )
}
