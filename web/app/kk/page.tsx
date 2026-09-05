"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Home } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useKK } from "@/components/kk/use-kk"
import { KkTable } from "@/components/kk/kk-table"
import { KkFilterBar } from "@/components/kk/kk-filter-bar"
import { KkDeleteDialog } from "@/components/kk/kk-delete-dialog"

export default function KartuKeluargaPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const { useSession } = authClient
  const { data: session, isPending: isSessionPending } = useSession()

  const {
    dataKK,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedRt,
    setSelectedRt,
    selectedRw,
    setSelectedRw,
    currentPage,
    setCurrentPage,
    totalPages,
    totalData,
    deleteData,
    setDeleteData,
    isDeleting,
    handleExport,
    handleDelete,
  } = useKK(session)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isSessionPending && !session) {
      router.push("/login")
    }
  }, [mounted, session, isSessionPending, router])

  if (!mounted || isSessionPending) {
    return (
      <div className="flex h-full items-center justify-center p-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="flex w-full flex-col p-4 md:p-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-6 rounded-2xl mt-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Data Kartu Keluarga</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Kelola data keluarga, susunan anggota, dan mutasi KK Desa Kedungsumur.
            </p>
          </div>
        </div>

        <Card className="shadow-sm overflow-hidden">
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between pb-4 border-b">
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" />
              <span>Daftar Kartu Keluarga</span>
            </CardTitle>
            <KkFilterBar
              selectedRt={selectedRt}
              selectedRw={selectedRw}
              searchQuery={searchQuery}
              onRtChange={(rt) => { setSelectedRt(rt); setCurrentPage(1); }}
              onRwChange={(rw) => { setSelectedRw(rw); setCurrentPage(1); }}
              onSearchChange={setSearchQuery}
              onExport={handleExport}
              onAddKK={() => router.push("/kk/tambah")}
            />
          </CardHeader>
          
          <CardContent className="p-0">
            <KkTable
              data={dataKK}
              isLoading={isLoading}
              currentPage={currentPage}
              totalPages={totalPages}
              totalData={totalData}
              onPageChange={setCurrentPage}
              onRowClick={(id) => router.push(`/kk/${id}`)}
              onEdit={(id) => router.push(`/kk/edit/${id}`)}
              onDelete={setDeleteData}
            />
          </CardContent>
        </Card>
      </div>

      <KkDeleteDialog
        data={deleteData}
        isDeleting={isDeleting}
        onClose={() => setDeleteData(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
