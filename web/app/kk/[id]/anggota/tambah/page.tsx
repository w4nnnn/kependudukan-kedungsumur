"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Loader2, ArrowLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authClient } from "@/lib/auth-client"
import { useTambahAnggotaKk } from "@/components/kk/use-tambah-anggota-kk"
import { KkInfoBanner } from "@/components/kk/kk-info-banner"
import { KkAnggotaFormFields } from "@/components/kk/kk-anggota-form-fields"

export default function TambahAnggotaKKPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const kkId = params?.id

  const { useSession } = authClient
  const { data: session, isPending: isSessionPending } = useSession()

  const {
    form,
    isLoading,
    isFetchingKK,
    kkInfo,
    mode,
    setMode,
    candidateList,
    candidateSearch,
    setCandidateSearch,
    selectedCandidate,
    previewUrl,
    setPreviewUrl,
    setSelectedFile,
    handleSelectCandidate,
    onSubmit,
  } = useTambahAnggotaKk(kkId)

  const { handleSubmit } = form

  useEffect(() => {
    if (!isSessionPending && !session) {
      router.push("/login")
    }
  }, [session, isSessionPending, router])

  if (isFetchingKK) {
    return (
      <div className="flex h-full min-h-screen items-center justify-center p-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col p-4 md:p-8">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push(`/kk/${kkId}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tambah Anggota Keluarga</h1>
            <p className="text-muted-foreground text-sm">
              Tautkan penduduk yang sudah terdaftar atau buat data penduduk baru ke dalam KK ini.
            </p>
          </div>
        </div>

        {kkInfo && <KkInfoBanner kkInfo={kkInfo} />}

        <Card>
          <CardHeader>
            <CardTitle>Formulir Anggota Keluarga</CardTitle>
            <CardDescription>Pilih data penduduk yang akan didaftarkan ke Kartu Keluarga.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <KkAnggotaFormFields
                form={form}
                mode={mode}
                setMode={setMode}
                candidateList={candidateList}
                candidateSearch={candidateSearch}
                setCandidateSearch={setCandidateSearch}
                selectedCandidate={selectedCandidate}
                onSelectCandidate={handleSelectCandidate}
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

              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/kk/${kkId}`)}
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
                      Simpan Anggota KK
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
