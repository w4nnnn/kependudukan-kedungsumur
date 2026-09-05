"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { useDashboardStats } from "@/components/dashboard/use-dashboard-stats"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardSummaryCards } from "@/components/dashboard/dashboard-summary-cards"
import { DashboardCharts } from "@/components/dashboard/dashboard-charts"
import { DashboardDemographicsCards } from "@/components/dashboard/dashboard-demographics-cards"

export default function DashboardPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const { data: session, isPending: isSessionPending } = authClient.useSession()

  const {
    data,
    isLoading,
    selectedRt,
    setSelectedRt,
    selectedRw,
    setSelectedRw,
    fetchStats,
    handleExportPDF,
  } = useDashboardStats(session)

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
      <div className="flex h-full min-h-screen items-center justify-center p-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="flex w-full flex-col p-4 md:p-8 space-y-6">
      <DashboardHeader
        selectedRt={selectedRt}
        selectedRw={selectedRw}
        onRtChange={(rt) => setSelectedRt(rt)}
        onRwChange={(rw) => setSelectedRw(rw)}
        onExportPDF={handleExportPDF}
        onRefresh={() => fetchStats(selectedRt, selectedRw)}
        isLoading={isLoading}
      />

      {isLoading && !data ? (
        <div className="flex justify-center p-16">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : data ? (
        <>
          <DashboardSummaryCards summary={data.summary} />
          <DashboardCharts
            kelompokUsia={data.kelompokUsia}
            distribusiRt={data.distribusiRt}
          />
          <DashboardDemographicsCards
            statusPerkawinan={data.statusPerkawinan}
            agama={data.agama}
            pekerjaan={data.pekerjaan}
            totalPenduduk={data.summary.totalPenduduk}
          />
        </>
      ) : null}
    </div>
  )
}
