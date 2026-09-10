"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import type { AppUser } from "./types"

export function usePengguna(session: unknown) {
  const [dataUsers, setDataUsers] = useState<AppUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRt, setSelectedRt] = useState<string>("ALL")
  const [selectedRw, setSelectedRw] = useState<string>("ALL")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalData, setTotalData] = useState(0)
  const limit = 10
  const [deleteData, setDeleteData] = useState<{ id: string; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const totalPages = Math.max(1, Math.ceil(totalData / limit))

  const fetchUsers = async (search = "", page = 1) => {
    setIsLoading(true)
    try {
      const isFilteredByRtRw = selectedRt !== "ALL" || selectedRw !== "ALL"

      const res = await authClient.admin.listUsers({
        query: {
          limit: isFilteredByRtRw ? 500 : limit,
          offset: isFilteredByRtRw ? 0 : (page - 1) * limit,
          ...(search.trim()
            ? {
                searchValue: search.trim(),
                searchField: search.includes("@") ? ("email" as const) : ("name" as const),
              }
            : {}),
        },
      })

      if (res.data) {
        let users = (res.data.users as AppUser[]) || []

        if (selectedRt !== "ALL") {
          users = users.filter((u) => u.rt === selectedRt)
        }
        if (selectedRw !== "ALL") {
          users = users.filter((u) => u.rw === selectedRw)
        }

        if (isFilteredByRtRw) {
          setTotalData(users.length)
          const startIndex = (page - 1) * limit
          setDataUsers(users.slice(startIndex, startIndex + limit))
        } else {
          setTotalData((res.data as any).total ?? users.length)
          setDataUsers(users)
        }
      } else if (res.error) {
        toast.error("Gagal memuat data pengguna", {
          description: res.error.message || "Pastikan Anda memiliki hak akses admin.",
        })
      }
    } catch (error) {
      console.error("Gagal mengambil data pengguna", error)
      toast.error("Terjadi kesalahan jaringan", {
        description: "Gagal terhubung ke server.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchUsers(searchQuery, currentPage)
    }
  }, [session, currentPage, selectedRt, selectedRw])

  useEffect(() => {
    if (!session) return
    const delayDebounceFn = setTimeout(() => {
      setCurrentPage(1)
      fetchUsers(searchQuery, 1)
    }, 500)
    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery, session])

  const handleDelete = async () => {
    if (!deleteData) return

    setIsDeleting(true)
    try {
      const res = await authClient.admin.removeUser({
        userId: deleteData.id,
      })

      if (res.data) {
        toast.success("Berhasil", {
          description: `Pengguna ${deleteData.name} telah dihapus dari sistem.`,
        })
        fetchUsers(searchQuery, currentPage)
      } else if (res.error) {
        toast.error("Gagal menghapus pengguna", {
          description: res.error.message || "Terjadi kesalahan.",
        })
      }
    } catch {
      toast.error("Kesalahan Jaringan", { description: "Gagal terhubung ke server." })
    } finally {
      setIsDeleting(false)
      setDeleteData(null)
    }
  }

  return {
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
  }
}
