"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ArrowLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authClient } from "@/lib/auth-client"
import { useTambahPenduduk } from "@/components/kependudukan/use-tambah-penduduk"
import { KependudukanPhotoUpload } from "@/components/kependudukan/kependudukan-photo-upload"
import { KependudukanKkSelector } from "@/components/kependudukan/kependudukan-kk-selector"
import { KependudukanBiodataFields } from "@/components/kependudukan/kependudukan-biodata-fields"

export default function TambahPendudukPage() {
  const router = useRouter()
  const { useSession } = authClient
  const { data: session, isPending: isSessionPending } = useSession()

  const {
    form,
    isLoading,
    previewUrl,
    setPreviewUrl,
    setSelectedFile,
    modeKk,
    setModeKk,
    kkSearch,
    setKkSearch,
    kkList,
    selectedKkId,
    selectedKkData,
    isLoadingKk,
    handleSelectKk,
    onSubmit,
  } = useTambahPenduduk()

  const { handleSubmit } = form

  useEffect(() => {
    if (!isSessionPending && !session) {
      router.push("/login")
    }
  }, [session, isSessionPending, router])

  return (
    <div className="flex min-h-screen w-full flex-col p-4 md:p-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/kependudukan")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tambah Penduduk</h1>
            <p className="text-muted-foreground text-sm">
              Masukkan data penduduk baru sesuai dokumen resmi.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Formulir Kependudukan</CardTitle>
            <CardDescription>Semua kolom wajib diisi dengan benar.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <KependudukanPhotoUpload
                previewUrl={previewUrl}
                onFileSelect={(file, url) => {
                  setSelectedFile(file)
                  setPreviewUrl(url)
                }}
                onRemovePreview={() => {
                  setSelectedFile(null)
                  setPreviewUrl(null)
                }}
              />

              <KependudukanKkSelector
                form={form}
                modeKk={modeKk}
                setModeKk={setModeKk}
                kkSearch={kkSearch}
                setKkSearch={setKkSearch}
                kkList={kkList}
                selectedKkId={selectedKkId}
                selectedKkData={selectedKkData}
                isLoadingKk={isLoadingKk}
                onSelectKk={handleSelectKk}
              />

              <KependudukanBiodataFields form={form} />

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
                      Simpan Data Penduduk
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
