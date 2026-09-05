"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Loader2, ArrowLeft, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"
import type { Penduduk } from "@/components/kependudukan/types"
import {
  IdentitasUtamaCard,
  DataPribadiCard,
  DomisiliPekerjaanCard,
  HubunganKeluargaCard,
} from "@/components/kependudukan/kependudukan-detail-cards"

export default function DetailPendudukPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const routeId = params?.id

  const [data, setData] = useState<Penduduk | null>(null)
  const [isFetching, setIsFetching] = useState(true)

  const { useSession } = authClient
  const { data: session, isPending: isSessionPending } = useSession()

  useEffect(() => {
    if (!routeId) return

    const fetchPenduduk = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/penduduk/${routeId}`, {
          credentials: "include",
        })

        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data) {
            setData(json.data)
          } else {
            toast.error("Gagal memuat data penduduk")
            router.push("/kependudukan")
          }
        } else {
          toast.error("Gagal memuat data penduduk")
          router.push("/kependudukan")
        }
      } catch {
        toast.error("Terjadi kesalahan sistem")
        router.push("/kependudukan")
      } finally {
        setIsFetching(false)
      }
    }

    fetchPenduduk()
  }, [routeId, router])

  useEffect(() => {
    if (!isSessionPending && !session) {
      router.push("/login")
    }
  }, [session, isSessionPending, router])

  if (isSessionPending || isFetching) {
    return (
      <div className="flex h-full min-h-screen items-center justify-center p-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session || !data) return null

  return (
    <div className="flex min-h-screen w-full flex-col p-4 md:p-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push("/kependudukan")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Detail Penduduk</h1>
              <p className="text-muted-foreground text-sm">
                Informasi lengkap data penduduk Desa Kedungsumur.
              </p>
            </div>
          </div>
          <Button onClick={() => router.push(`/kependudukan/edit/${data.id}`)} className="gap-2">
            <Pencil className="h-4 w-4" />
            Edit Data
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <IdentitasUtamaCard data={data} />
          <DataPribadiCard data={data} />
          <DomisiliPekerjaanCard data={data} />
          <HubunganKeluargaCard
            data={data}
            onOpenAnggota={(id) => router.push(`/kependudukan/${id}`)}
            onOpenKK={(kkId) => router.push(`/kk/${kkId}`)}
          />
        </div>
      </div>
    </div>
  )
}
