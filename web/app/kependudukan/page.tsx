"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { KependudukanTable } from "@/components/kependudukan/kependudukan-table"
import { KependudukanFilterBar } from "@/components/kependudukan/kependudukan-filter-bar"
import { KependudukanImportDialog } from "@/components/kependudukan/kependudukan-import-dialog"
import { KependudukanDeleteDialog } from "@/components/kependudukan/kependudukan-delete-dialog"
import { useKependudukan } from "@/components/kependudukan/use-kependudukan"

export default function KependudukanPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const { useSession } = authClient
  const { data: session, isPending: isSessionPending } = useSession()

  const {
    dataPenduduk,
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
    isImportOpen,
    setIsImportOpen,
    importFile,
    setImportFile,
    isImporting,
    importResult,
    handleExport,
    handleDownloadTemplate,
    handleImportSubmit,
    handleDelete,
  } = useKependudukan(session)

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
            <h1 className="text-3xl font-bold tracking-tight">Data Kependudukan</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Kelola data penduduk Desa Kedungsumur. Selamat datang, {session.user.name}.
            </p>
          </div>
        </div>

        <Card className="shadow-sm overflow-hidden">
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between pb-4 border-b">
            <CardTitle className="flex items-center gap-2">
              <span>Daftar Penduduk</span>
            </CardTitle>
            <KependudukanFilterBar
              selectedRt={selectedRt}
              selectedRw={selectedRw}
              searchQuery={searchQuery}
              onRtChange={(rt) => { setSelectedRt(rt); setCurrentPage(1); }}
              onRwChange={(rw) => { setSelectedRw(rw); setCurrentPage(1); }}
              onSearchChange={setSearchQuery}
              onExport={handleExport}
              onOpenImport={() => {
                setIsImportOpen(true)
                setImportFile(null)
              }}
              onAddPenduduk={() => router.push("/kependudukan/tambah")}
            />
          </CardHeader>
          
          <CardContent className="p-0">
            <KependudukanTable
              data={dataPenduduk}
              isLoading={isLoading}
              currentPage={currentPage}
              totalPages={totalPages}
              totalData={totalData}
              onPageChange={setCurrentPage}
              onRowClick={(id) => router.push(`/kependudukan/${id}`)}
              onEdit={(id) => router.push(`/kependudukan/edit/${id}`)}
              onDelete={setDeleteData}
            />
          </CardContent>
        </Card>
      </div>

      <KependudukanImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        importFile={importFile}
        setImportFile={setImportFile}
        isImporting={isImporting}
        importResult={importResult}
        onDownloadTemplate={handleDownloadTemplate}
        onSubmit={handleImportSubmit}
      />

      <KependudukanDeleteDialog
        data={deleteData}
        isDeleting={isDeleting}
        onClose={() => setDeleteData(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
