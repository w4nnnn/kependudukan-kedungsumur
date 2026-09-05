"use client"

import { AlertTriangle, Loader2 } from "lucide-react"
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

interface KependudukanDeleteDialogProps {
  data: { id: string; name: string } | null
  isDeleting: boolean
  onClose: () => void
  onConfirm: () => void
}

export function KependudukanDeleteDialog({
  data,
  isDeleting,
  onClose,
  onConfirm,
}: KependudukanDeleteDialogProps) {
  return (
    <AlertDialog open={!!data} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" /> Konfirmasi Penghapusan
          </AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus data kependudukan atas nama <strong>{data?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
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
  )
}
