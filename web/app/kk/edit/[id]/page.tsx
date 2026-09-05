"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Loader2, ArrowLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authClient } from "@/lib/auth-client"
import { useEditKk } from "@/components/kk/use-edit-kk"
import { KkFormFields } from "@/components/kk/kk-form-fields"

export default function EditKartuKeluargaPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const routeId = params?.id

  const { useSession } = authClient
  const { data: session, isPending: isSessionPending } = useSession()

  const { form, isLoading, isFetching, onSubmit } = useEditKk(routeId)
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
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push(`/kk/${routeId}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Kartu Keluarga</h1>
            <p className="text-muted-foreground text-sm">
              Perbarui identitas dan domisili lembar Kartu Keluarga.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Data Kartu Keluarga</CardTitle>
            <CardDescription>
              Kolom dengan tanda bintang wajib diisi sesuai dokumen fisik KK.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <KkFormFields form={form} />

              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/kk/${routeId}`)}
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
