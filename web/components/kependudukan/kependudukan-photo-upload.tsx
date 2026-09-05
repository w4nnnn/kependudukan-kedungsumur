"use client"

import { useRef, ChangeEvent } from "react"
import { Upload, X, Trash2, Image as ImageIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"

interface KependudukanPhotoUploadProps {
  previewUrl: string | null
  currentFotoUrl?: string | null
  onFileSelect: (file: File | null, previewUrl: string | null) => void
  onRemovePreview: () => void
  onDeleteServerPhoto?: () => void
  isDeletingServerPhoto?: boolean
}

export function KependudukanPhotoUpload({
  previewUrl,
  currentFotoUrl,
  onFileSelect,
  onRemovePreview,
  onDeleteServerPhoto,
  isDeletingServerPhoto,
}: KependudukanPhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Format file tidak valid", {
        description: "Hanya file gambar (JPG, PNG, WebP) yang diperbolehkan.",
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file terlalu besar", {
        description: "Maksimal ukuran file foto adalah 5MB.",
      })
      return
    }

    const url = URL.createObjectURL(file)
    onFileSelect(file, url)
  }

  const effectiveFotoUrl = previewUrl || currentFotoUrl

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl border bg-muted/20">
      <div className="relative group">
        <Avatar className="size-24 rounded-2xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-background">
          {effectiveFotoUrl ? (
            <AvatarImage
              src={effectiveFotoUrl}
              alt="Preview Foto"
              className="rounded-2xl object-cover size-full"
            />
          ) : null}
          <AvatarFallback className="rounded-2xl bg-transparent">
            <ImageIcon className="size-8 text-muted-foreground/50" />
          </AvatarFallback>
        </Avatar>
        {previewUrl && (
          <button
            type="button"
            onClick={onRemovePreview}
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-sm hover:bg-destructive/90 transition-colors"
            title="Hapus foto baru"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <div className="flex-1 space-y-1.5 text-center sm:text-left">
        <label className="text-sm font-medium leading-none">Pasfoto Penduduk (Opsional)</label>
        <p className="text-xs text-muted-foreground">Format JPG, PNG, atau WebP. Maksimal 5MB.</p>
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp,image/jpg"
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
          >
            <Upload className="size-4" />
            {effectiveFotoUrl ? "Ganti Foto" : "Pilih Foto"}
          </Button>

          {currentFotoUrl && !previewUrl && onDeleteServerPhoto && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDeletingServerPhoto}
              onClick={onDeleteServerPhoto}
              className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
            >
              {isDeletingServerPhoto ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Hapus Foto Saat Ini
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
