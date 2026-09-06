"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { toast } from "sonner"
import { API_BASE_URL } from "@/lib/config"
import type { CandidatePenduduk } from "./types"
import { tambahKkFormSchema, type TambahKkFormValues } from "./kk-form-schema"

export function useTambahKk() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [candidateList, setCandidateList] = useState<CandidatePenduduk[]>([])
  const [candidateSearch, setCandidateSearch] = useState("")

  const form = useForm<TambahKkFormValues>({
    resolver: zodResolver(tambahKkFormSchema),
    defaultValues: {
      noKk: "",
      alamat: "",
      rt: "",
      rw: "",
      dusun: "Dusun Krajan",
      kodePos: "65171",
      tanggalDikeluarkan: undefined,
      modeKepala: "create",
      selectedPendudukId: "",
      nikBaru: "",
      namaBaru: "",
      tempatLahirBaru: "",
      tanggalLahirBaru: undefined,
      jenisKelaminBaru: "Laki-laki",
      agamaBaru: "Islam",
      statusPerkawinanBaru: "Kawin",
      pekerjaanBaru: "",
    },
  })

  const modeKepala = form.watch("modeKepala")

  useEffect(() => {
    if (modeKepala === "select") {
      const searchPenduduk = async () => {
        try {
          const url = new URL(`${API_BASE_URL}/api/penduduk`)
          url.searchParams.append("limit", "10")
          if (candidateSearch) {
            if (/^\d{16}$/.test(candidateSearch)) {
              url.searchParams.append("nik", candidateSearch)
            } else {
              url.searchParams.append("search", candidateSearch)
            }
          }
          const res = await fetch(url.toString(), { credentials: "include" })
          if (res.ok) {
            const json = await res.json()
            if (json.success && json.data) {
              setCandidateList(json.data)
            }
          }
        } catch {
          console.error("Gagal memuat kandidat penduduk")
        }
      }

      const timer = setTimeout(searchPenduduk, 400)
      return () => clearTimeout(timer)
    }
  }, [candidateSearch, modeKepala])

  const onSubmit = async (data: TambahKkFormValues) => {
    setIsLoading(true)
    try {
      const payload: Record<string, unknown> = {
        noKk: data.noKk,
        alamat: data.alamat,
        rt: data.rt,
        rw: data.rw,
        dusun: data.dusun,
        kodePos: data.kodePos,
        tanggalDikeluarkan: data.tanggalDikeluarkan
          ? format(data.tanggalDikeluarkan, "yyyy-MM-dd")
          : undefined,
      }

      if (data.modeKepala === "select") {
        if (!data.selectedPendudukId) {
          toast.error("Pilih penduduk sebagai Kepala Keluarga terlebih dahulu.")
          setIsLoading(false)
          return
        }
        payload.kepalaKeluargaId = data.selectedPendudukId
      } else if (data.modeKepala === "create") {
        if (!data.nikBaru || data.nikBaru.length !== 16) {
          toast.error("NIK Kepala Keluarga harus 16 digit.")
          setIsLoading(false)
          return
        }
        if (!data.namaBaru || data.namaBaru.length < 3) {
          toast.error("Nama Kepala Keluarga minimal 3 karakter.")
          setIsLoading(false)
          return
        }
        if (!data.tempatLahirBaru || data.tempatLahirBaru.length < 3) {
          toast.error("Tempat lahir Kepala Keluarga minimal 3 karakter.")
          setIsLoading(false)
          return
        }
        if (!data.tanggalLahirBaru) {
          toast.error("Pilih tanggal lahir Kepala Keluarga.")
          setIsLoading(false)
          return
        }

        payload.createKepalaKeluarga = {
          nik: data.nikBaru,
          namaLengkap: data.namaBaru,
          tempatLahir: data.tempatLahirBaru,
          tanggalLahir: format(data.tanggalLahirBaru, "yyyy-MM-dd"),
          jenisKelamin: data.jenisKelaminBaru,
          agama: data.agamaBaru,
          statusPerkawinan: data.statusPerkawinanBaru,
          pekerjaan: data.pekerjaanBaru,
        }
      }

      const res = await fetch(`${API_BASE_URL}/api/kk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (res.ok && json.success) {
        toast.success("Berhasil", { description: "Kartu Keluarga baru berhasil didaftarkan." })
        router.push(`/kk/${json.data.id}`)
      } else {
        toast.error("Gagal menambahkan KK", { description: json.message || "Terjadi kesalahan." })
      }
    } catch {
      toast.error("Kesalahan jaringan", { description: "Gagal terhubung ke server." })
    } finally {
      setIsLoading(false)
    }
  }

  return {
    form,
    isLoading,
    candidateList,
    candidateSearch,
    setCandidateSearch,
    modeKepala,
    onSubmit,
  }
}
