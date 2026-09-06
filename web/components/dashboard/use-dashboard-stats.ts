"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { API_BASE_URL } from "@/lib/config"
import type { StatsData } from "./types"

export function useDashboardStats(session: unknown) {
  const router = useRouter()
  const [data, setData] = useState<StatsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRt, setSelectedRt] = useState<string>("ALL")
  const [selectedRw, setSelectedRw] = useState<string>("ALL")

  const fetchStats = async (rt = "ALL", rw = "ALL") => {
    setIsLoading(true)
    try {
      const url = new URL(`${API_BASE_URL}/api/stats`)
      if (rt !== "ALL") url.searchParams.append("rt", rt)
      if (rw !== "ALL") url.searchParams.append("rw", rw)

      const res = await fetch(url.toString(), { credentials: "include" })
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          setData(json.data)
        }
      } else if (res.status === 401 || res.status === 403) {
        router.push("/login")
      }
    } catch (error) {
      console.error("Gagal memuat statistik", error)
      toast.error("Gagal memuat data statistik")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchStats(selectedRt, selectedRw)
    }
  }, [session, selectedRt, selectedRw])

  const handleExportPDF = () => {
    const url = new URL(`${API_BASE_URL}/api/stats/pdf`)
    if (selectedRt !== "ALL") url.searchParams.append("rt", selectedRt)
    if (selectedRw !== "ALL") url.searchParams.append("rw", selectedRw)
    window.open(url.toString(), "_blank")
  }

  return {
    data,
    isLoading,
    selectedRt,
    setSelectedRt,
    selectedRw,
    setSelectedRw,
    fetchStats,
    handleExportPDF,
  }
}
