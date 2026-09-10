"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ArrowLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authClient } from "@/lib/auth-client"
import { useTambahKk } from "@/components/kk/use-tambah-kk"
import { KkFormFields } from "@/components/kk/kk-form-fields"
import { KkKepalaSelector } from "@/components/kk/kk-kepala-selector"

export default function TambahKartuKeluargaPage() {
  const router = useRouter()
  const { useSession } = authClient
  const { data: session, isPending: isSessionPending } = useSession()

  const {
    form,
    isLoading,
    candidateList,
    candidateSearch,
    setCandidateSearch,
    onSubmit,
    onInvalid,
  } = useTambahKk()

  const { handleSubmit } = form

  useEffect(() => {
    if (!isSessionPending && !session) {
      router.push("/login")
    }
  }, [session, isSessionPending, router])

  return (
    <div className="flex min-h-screen w-full flex-col p-4 md:p-8">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/kk")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tambah Kartu Keluarga</h1>
            <p className="text-muted-foreground text-sm">
              Daftarkan lembar Kartu Keluarga baru beserta susunan Kepala Keluarga.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Formulir Kartu Keluarga</CardTitle>
            <CardDescription>Semua kolom bertanda bintang wajib diisi dengan benar.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
              <KkFormFields form={form} />

              <KkKepalaSelector
                form={form}
                candidateList={candidateList}
                candidateSearch={candidateSearch}
                setCandidateSearch={setCandidateSearch}
              />

              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/kk")}
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
                      Simpan Kartu Keluarga
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
