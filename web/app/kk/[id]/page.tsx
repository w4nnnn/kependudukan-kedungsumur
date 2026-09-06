"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { authClient } from "@/lib/auth-client"
import { API_BASE_URL } from "@/lib/config"
import { toast } from "sonner"
import type { KartuKeluargaDetail, AnggotaPenduduk } from "@/components/kk/types"
import { KkDetailHeader } from "@/components/kk/kk-detail-header"
import { KkDetailCard } from "@/components/kk/kk-detail-card"
import { KkAnggotaTable } from "@/components/kk/kk-anggota-table"
import { KkTambahAnggotaCard } from "@/components/kk/kk-tambah-anggota-card"
import { KkRemoveAnggotaDialog } from "@/components/kk/kk-remove-anggota-dialog"

export default function DetailKartuKeluargaPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const routeId = params?.id

  const [data, setData] = useState<KartuKeluargaDetail | null>(null)
  const [isFetching, setIsFetching] = useState(true)
  const [isAddingAnggota, setIsAddingAnggota] = useState(false)
  const [removeCandidate, setRemoveCandidate] = useState<AnggotaPenduduk | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)

  const { useSession } = authClient
  const { data: session, isPending: isSessionPending } = useSession()

  const fetchKKDetail = async () => {
    if (!routeId) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/kk/${routeId}`, {
        credentials: "include",
      })

      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          setData(json.data)
        } else {
          toast.error("Gagal memuat data Kartu Keluarga")
          router.push("/kk")
        }
      } else {
        toast.error("Gagal memuat data Kartu Keluarga")
        router.push("/kk")
      }
    } catch {
      toast.error("Terjadi kesalahan sistem")
      router.push("/kk")
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    fetchKKDetail()
  }, [routeId])

  useEffect(() => {
    if (!isSessionPending && !session) {
      router.push("/login")
    }
  }, [session, isSessionPending, router])

  const handleRemoveAnggota = async () => {
    if (!removeCandidate || !routeId) return

    setIsRemoving(true)
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/kk/${routeId}/anggota/${removeCandidate.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      )

      const json = await res.json()
      if (res.ok && json.success) {
        toast.success("Berhasil", { description: json.message })
        fetchKKDetail()
      } else {
        toast.error("Gagal mengeluarkan anggota", { description: json.message })
      }
    } catch {
      toast.error("Kesalahan jaringan")
    } finally {
      setIsRemoving(false)
      setRemoveCandidate(null)
    }
  }

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
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <KkDetailHeader
          kkId={data.id}
          isAddingAnggota={isAddingAnggota}
          onBack={() => router.push("/kk")}
          onPrint={() => window.print()}
          onEdit={() => router.push(`/kk/edit/${data.id}`)}
          onToggleTambahAnggota={() => setIsAddingAnggota((prev) => !prev)}
        />

        <div className="space-y-6">
          <KkDetailCard data={data} />

          {isAddingAnggota && (
            <KkTambahAnggotaCard
              kkId={data.id}
              nextUrutan={data.anggota.length + 1}
              onSuccess={() => {
                fetchKKDetail()
                setIsAddingAnggota(false)
              }}
              onCancel={() => setIsAddingAnggota(false)}
            />
          )}

          <Card className="border shadow-xs">
            <CardContent className="pt-6">
              <KkAnggotaTable
                anggota={data.anggota}
                onRemove={(item) => setRemoveCandidate(item)}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <KkRemoveAnggotaDialog
        candidate={removeCandidate}
        isRemoving={isRemoving}
        onClose={() => setRemoveCandidate(null)}
        onConfirm={handleRemoveAnggota}
      />
    </div>
  )
}
