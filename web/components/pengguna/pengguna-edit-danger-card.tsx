"use client"

import { Trash2, AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import type { UserDetail } from "./types"

interface PenggunaEditDangerCardProps {
  userData: UserDetail
  isSelf: boolean
  isDeleting: boolean
  showDeleteDialog: boolean
  setShowDeleteDialog: (open: boolean) => void
  onDeleteUser: () => void
}

export function PenggunaEditDangerCard({
  userData,
  isSelf,
  isDeleting,
  showDeleteDialog,
  setShowDeleteDialog,
  onDeleteUser,
}: PenggunaEditDangerCardProps) {
  return (
    <>
      <Card className="border-destructive/30">
        <CardHeader className="border-b pb-4">
          <div className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            <div>
              <CardTitle>Zona Berbahaya</CardTitle>
              <CardDescription>
                Hapus akun pengguna ini secara permanen dari basis data sistem.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl border border-destructive/20 bg-destructive/5">
            <div>
              <p className="font-semibold text-sm text-foreground">Hapus Akun Pengguna</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Akun akan dihapus permanen dan tidak dapat dipulihkan kembali.
              </p>
            </div>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting || isSelf}
              onClick={() => setShowDeleteDialog(true)}
              className="gap-2 shrink-0"
            >
              <Trash2 className="h-4 w-4" />
              Hapus Akun
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Konfirmasi Penghapusan Akun
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus akun atas nama <strong>{userData.name}</strong> ({userData.email})? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                onDeleteUser()
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menghapus...
                </>
              ) : (
                "Hapus Akun Permanen"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
