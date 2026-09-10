"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Loader2, ArrowLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authClient } from "@/lib/auth-client"
import { useEditPenduduk } from "@/components/kependudukan/use-edit-penduduk"
import { KependudukanPhotoUpload } from "@/components/kependudukan/kependudukan-photo-upload"
import { KependudukanBiodataFields } from "@/components/kependudukan/kependudukan-biodata-fields"

export default function EditPendudukPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id

  const { useSession } = authClient
  const { data: session, isPending: isSessionPending } = useSession()

  const {
    form,
    isLoading,
    isFetching,
    currentFotoUrl,
    previewUrl,
    setPreviewUrl,
    setSelectedFile,
    isDeletingPhoto,
    handleDeleteCurrentPhoto,
    onSubmit,
    onInvalid,
  } = useEditPenduduk(id)

  const { handleSubmit } = form

  useEffect(() => {
    if (!isSessionPending && !session) {
      router.push("/login")
    }
  }, [session, isSessionPending, router])

  if (isFetching) {
    return (
      <div className="flex h-full min-h-screen items-center justify-center p-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col p-4 md:p-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/kependudukan")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Data Penduduk</h1>
            <p className="text-muted-foreground text-sm">
              Perbarui data penduduk sesuai dokumen resmi terkini.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Formulir Kependudukan</CardTitle>
            <CardDescription>Semua kolom bertanda bintang wajib diisi dengan benar.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
              <KependudukanPhotoUpload
                previewUrl={previewUrl}
                currentFotoUrl={currentFotoUrl}
                onFileSelect={(file, url) => {
                  setSelectedFile(file)
                  setPreviewUrl(url)
                }}
                onRemovePreview={() => {
                  setSelectedFile(null)
                  setPreviewUrl(null)
                }}
                onDeleteServerPhoto={handleDeleteCurrentPhoto}
                isDeletingServerPhoto={isDeletingPhoto}
              />

              <KependudukanBiodataFields form={form} showNoKkField />

              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/kependudukan")}
                  disabled={isLoading}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading} className="gap-2">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Simpan Perubahan
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
