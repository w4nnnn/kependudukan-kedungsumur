"use client"

import { Loader2 } from "lucide-react"
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
import type { AnggotaPenduduk } from "./types"

interface KkRemoveAnggotaDialogProps {
  candidate: AnggotaPenduduk | null
  isRemoving: boolean
  onClose: () => void
  onConfirm: () => void
}

export function KkRemoveAnggotaDialog({
  candidate,
  isRemoving,
  onClose,
  onConfirm,
}: KkRemoveAnggotaDialogProps) {
  return (
    <AlertDialog open={!!candidate} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Keluarkan Anggota Keluarga?</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin mengeluarkan <strong>{candidate?.namaLengkap}</strong> dari Kartu Keluarga ini? Data kependudukan individu tetap tersimpan di sistem.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRemoving}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={isRemoving}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isRemoving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Keluarkan
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
