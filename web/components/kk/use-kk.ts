"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { API_BASE_URL } from "@/lib/config"
import { downloadFileFromApi } from "@/lib/utils"
import type { KartuKeluarga } from "./types"

export function useKK(session: unknown) {
  const router = useRouter()
  const user = (session as any)?.user
  const initialRt = (user?.role !== "admin" && user?.rt) ? user.rt : "ALL"
  const initialRw = (user?.role !== "admin" && user?.rw) ? user.rw : "ALL"

  const [dataKK, setDataKK] = useState<KartuKeluarga[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRt, setSelectedRt] = useState<string>(initialRt)
  const [selectedRw, setSelectedRw] = useState<string>(initialRw)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalData, setTotalData] = useState(0)
  const limit = 10
  const [deleteData, setDeleteData] = useState<{ id: string; noKk: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchKK = async (search = "", rt = "ALL", rw = "ALL", page = 1) => {
    setIsLoading(true)
    try {
      const url = new URL(`${API_BASE_URL}/api/kk`)
      url.searchParams.append("page", page.toString())
      url.searchParams.append("limit", limit.toString())

      if (search) {
        if (/^\d{16}$/.test(search)) {
          url.searchParams.append("nokk", search)
        } else {
          url.searchParams.append("search", search)
        }
      }

      if (rt !== "ALL") url.searchParams.append("rt", rt)
      if (rw !== "ALL") url.searchParams.append("rw", rw)

      const res = await fetch(url.toString(), { credentials: "include" })
      if (res.ok) {
        const text = await res.text()
        if (text) {
          const json = JSON.parse(text)
          if (json.success) {
            setDataKK(json.data)
            if (json.meta) {
              setTotalPages(json.meta.totalPages)
              setTotalData(json.meta.total)
            }
          }
        }
      } else if (res.status === 401 || res.status === 403) {
        router.push("/login")
      }
    } catch (error) {
      console.error("Gagal mengambil data Kartu Keluarga", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      const u = (session as any)?.user
      if (u?.role !== "admin") {
        if (u?.rt) setSelectedRt(u.rt)
        if (u?.rw) setSelectedRw(u.rw)
      }
      fetchKK(searchQuery, selectedRt, selectedRw, currentPage)
    }
  }, [session, currentPage, selectedRt, selectedRw])

  useEffect(() => {
    if (!session) return
    const delayDebounceFn = setTimeout(() => {
      setCurrentPage(1)
      fetchKK(searchQuery, selectedRt, selectedRw, 1)
    }, 500)
    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery, session])

  const handleExport = async () => {
    const url = new URL(`${API_BASE_URL}/api/kk/export`)
    if (selectedRt !== "ALL") url.searchParams.append("rt", selectedRt)
    if (selectedRw !== "ALL") url.searchParams.append("rw", selectedRw)

    toast.info("Menyiapkan berkas...", { description: "Sedang mengekspor data Kartu Keluarga ke Excel." })
    const res = await downloadFileFromApi(url.toString(), "data_kartu_keluarga_kedungsumur.xlsx")
    if (res.success) {
      toast.success("Berhasil", { description: "Data Kartu Keluarga berhasil diekspor." })
    } else {
      toast.error("Gagal Mengekspor", { description: res.message || "Terjadi kesalahan." })
    }
  }

  const handleDelete = async () => {
    if (!deleteData) return
    setIsDeleting(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/kk/${deleteData.id}`, {
        method: "DELETE",
        credentials: "include",
      })

      const result = await res.json()
      if (res.ok && result.success) {
        toast.success("Berhasil", {
          description: `Data KK No. ${deleteData.noKk} telah dihapus.`,
        })
        fetchKK(searchQuery, selectedRt, selectedRw, currentPage)
      } else {
        toast.error("Gagal menghapus data", {
          description: result.message || "Terjadi kesalahan sistem.",
        })
      }
    } catch {
      toast.error("Kesalahan jaringan", { description: "Gagal terhubung ke server." })
    } finally {
      setIsDeleting(false)
      setDeleteData(null)
    }
  }

  return {
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
  }
}
