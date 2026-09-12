"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { API_BASE_URL } from "@/lib/config"
import { downloadFileFromApi } from "@/lib/utils"
import type { Penduduk, ImportResult } from "./types"

export function useKependudukan(session: unknown) {
  const router = useRouter()
  const user = (session as any)?.user
  const initialRt = (user?.role !== "admin" && user?.rt) ? user.rt : "ALL"
  const initialRw = (user?.role !== "admin" && user?.rw) ? user.rw : "ALL"

  const [dataPenduduk, setDataPenduduk] = useState<Penduduk[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedRt, setSelectedRt] = useState<string>(initialRt)
  const [selectedRw, setSelectedRw] = useState<string>(initialRw)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalData, setTotalData] = useState(0)
  const limit = 10

  const [deleteData, setDeleteData] = useState<{ id: string; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [isImportOpen, setIsImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchPenduduk = useCallback(
    async (search = "", rt = "ALL", rw = "ALL", page = 1, signal?: AbortSignal) => {
      setIsLoading(true)
      try {
        const url = new URL(`${API_BASE_URL}/api/penduduk`)
        url.searchParams.append("page", page.toString())
        url.searchParams.append("limit", limit.toString())

        if (search) {
          if (/^\d{16}$/.test(search)) {
            url.searchParams.append("nik", search)
          } else {
            url.searchParams.append("search", search)
          }
        }
        if (rt !== "ALL") url.searchParams.append("rt", rt)
        if (rw !== "ALL") url.searchParams.append("rw", rw)

        const res = await fetch(url.toString(), { credentials: "include", signal })
        if (res.ok) {
          const text = await res.text()
          if (text) {
            const json = JSON.parse(text)
            if (json.success) {
              setDataPenduduk(json.data)
              if (json.meta) {
                setTotalPages(json.meta.totalPages)
                setTotalData(json.meta.total)
              }
            }
          }
        } else if (res.status === 401 || res.status === 403) {
          router.push("/login")
        }
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          console.error("Gagal mengambil data penduduk", error)
        }
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false)
        }
      }
    },
    [router, limit]
  )

  useEffect(() => {
    if (!session) return
    const u = (session as any)?.user
    if (u?.role !== "admin") {
      if (u?.rt) setSelectedRt(u.rt)
      if (u?.rw) setSelectedRw(u.rw)
    }

    const controller = new AbortController()
    fetchPenduduk(debouncedSearch, selectedRt, selectedRw, currentPage, controller.signal)

    return () => {
      controller.abort()
    }
  }, [session, debouncedSearch, currentPage, selectedRt, selectedRw, fetchPenduduk])

  const handleExport = async () => {
    const url = new URL(`${API_BASE_URL}/api/penduduk/export`)
    if (selectedRt !== "ALL") url.searchParams.append("rt", selectedRt)
    if (selectedRw !== "ALL") url.searchParams.append("rw", selectedRw)
    if (searchQuery.trim()) url.searchParams.append("search", searchQuery.trim())
    
    toast.info("Menyiapkan berkas...", { description: "Sedang mengekspor data penduduk ke Excel." })
    const res = await downloadFileFromApi(url.toString(), "data_penduduk_kedungsumur.xlsx")
    if (res.success) {
      toast.success("Berhasil", { description: "Data penduduk berhasil diekspor." })
    } else {
      toast.error("Gagal Mengekspor", { description: res.message || "Terjadi kesalahan." })
    }
  }

  const handleDownloadTemplate = async () => {
    toast.info("Menyiapkan template...", { description: "Sedang mengunduh template Excel." })
    const res = await downloadFileFromApi(`${API_BASE_URL}/api/penduduk/template`, "template_penduduk_kedungsumur.xlsx")
    if (res.success) {
      toast.success("Berhasil", { description: "Template Excel berhasil diunduh." })
    } else {
      toast.error("Gagal Mengunduh Template", { description: res.message || "Terjadi kesalahan." })
    }
  }

  const handleImportSubmit = async () => {
    if (!importFile) {
      toast.error("Pilih file Excel terlebih dahulu")
      return
    }
    setIsImporting(true)
    setImportResult(null)
    try {
      const formData = new FormData()
      formData.append("file", importFile)
      const res = await fetch(`${API_BASE_URL}/api/penduduk/import`, {
        method: "POST",
        credentials: "include",
        body: formData,
      })
      const json = await res.json()
      if (res.ok && json.success) {
        toast.success("Impor Berhasil", { description: json.message })
        setImportResult(json.data)
        fetchPenduduk(debouncedSearch, selectedRt, selectedRw, 1)
      } else {
        toast.error("Impor Gagal", { description: json.message || "File tidak dapat diproses" })
        if (json.errors) {
          setImportResult({ totalDiproses: 0, berhasil: 0, dilewati: 0, errors: json.errors })
        }
      }
    } catch {
      toast.error("Kesalahan Jaringan", { description: "Gagal terhubung ke server" })
    } finally {
      setIsImporting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteData) return
    setIsDeleting(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/penduduk/${deleteData.id}`, {
        method: "DELETE",
        credentials: "include",
      })
      const result = await res.json()
      if (res.ok && result.success) {
        toast.success("Berhasil", { description: `Data ${deleteData.name} telah dihapus.` })
        fetchPenduduk(debouncedSearch, selectedRt, selectedRw, currentPage)
      } else {
        toast.error("Gagal menghapus data", { description: result.message || "Terjadi kesalahan sistem." })
      }
    } catch {
      toast.error("Kesalahan jaringan", { description: "Gagal terhubung ke server." })
    } finally {
      setIsDeleting(false)
      setDeleteData(null)
    }
  }

  return {
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
  }
}
