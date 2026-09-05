"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usePengguna } from "@/components/pengguna/use-pengguna"
import { PenggunaTable } from "@/components/pengguna/pengguna-table"
import { PenggunaFilterBar } from "@/components/pengguna/pengguna-filter-bar"
import { PenggunaDeleteDialog } from "@/components/pengguna/pengguna-delete-dialog"

export default function PenggunaPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const { data: session, isPending: isSessionPending } = authClient.useSession()

  const {
    dataUsers,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedRt,
    setSelectedRt,
    selectedRw,
    setSelectedRw,
    currentPage,
    setCurrentPage,
    totalData,
    totalPages,
    deleteData,
    setDeleteData,
    isDeleting,
    handleDelete,
  } = usePengguna(session)

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
            <h1 className="text-3xl font-bold tracking-tight">Manajemen Pengguna</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Kelola akun administrator dan operator kependudukan desa.
            </p>
          </div>
        </div>

        <Card className="shadow-sm overflow-hidden">
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between pb-4 border-b">
            <CardTitle className="flex items-center gap-2">
              <span>Daftar Pengguna Sistem</span>
            </CardTitle>
            <PenggunaFilterBar
              selectedRt={selectedRt}
              selectedRw={selectedRw}
              searchQuery={searchQuery}
              onRtChange={(rt) => { setSelectedRt(rt); setCurrentPage(1); }}
              onRwChange={(rw) => { setSelectedRw(rw); setCurrentPage(1); }}
              onSearchChange={setSearchQuery}
              onAddUser={() => router.push("/pengguna/tambah")}
            />
          </CardHeader>
          
          <CardContent className="p-0">
            <PenggunaTable
              data={dataUsers}
              isLoading={isLoading}
              currentPage={currentPage}
              totalPages={totalPages}
              totalData={totalData}
              onPageChange={setCurrentPage}
              onEdit={(id) => router.push(`/pengguna/edit/${id}`)}
              onDelete={setDeleteData}
            />
          </CardContent>
        </Card>
      </div>

      <PenggunaDeleteDialog
        data={deleteData}
        isDeleting={isDeleting}
        onClose={() => setDeleteData(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
