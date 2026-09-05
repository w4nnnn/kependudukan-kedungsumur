"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { toast } from "sonner"
import type { CandidatePenduduk } from "./types"
import {
  tambahAnggotaKkFormSchema,
  type TambahAnggotaKkFormValues,
} from "./kk-form-schema"

interface KKInfo {
  id: string
  noKk: string
  alamat: string
  rt: string
  rw: string
  dusun?: string | null
  jumlahAnggota: number
  kepalaKeluargaNama?: string | null
}

export function useTambahAnggotaKk(
  kkId: string | undefined,
  initialUrutan?: number,
  onSuccess?: () => void
) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingKK, setIsFetchingKK] = useState(false)
  const [kkInfo, setKkInfo] = useState<KKInfo | null>(null)

  const [mode, setMode] = useState<"select" | "create">("select")
  const [candidateList, setCandidateList] = useState<CandidatePenduduk[]>([])
  const [candidateSearch, setCandidateSearch] = useState("")
  const [selectedCandidate, setSelectedCandidate] = useState<CandidatePenduduk | null>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const form = useForm<TambahAnggotaKkFormValues>({
    resolver: zodResolver(tambahAnggotaKkFormSchema),
    defaultValues: {
      mode: "select",
      selectedPendudukId: "",
      shdk: "ANAK",
      urutanKk: initialUrutan ? String(initialUrutan) : "1",
      nik: "",
      namaLengkap: "",
      tempatLahir: "Kedungsumur",
      tanggalLahir: undefined,
      jenisKelamin: "Laki-laki",
      agama: "Islam",
      statusPerkawinan: "Belum Kawin",
      pekerjaan: "",
    },
  })

  const { setValue, reset } = form

  const resetForm = () => {
    reset({
      mode: "select",
      selectedPendudukId: "",
      shdk: "ANAK",
      urutanKk: initialUrutan ? String(initialUrutan) : "1",
      nik: "",
      namaLengkap: "",
      tempatLahir: "Kedungsumur",
      tanggalLahir: undefined,
      jenisKelamin: "Laki-laki",
      agama: "Islam",
      statusPerkawinan: "Belum Kawin",
      pekerjaan: "",
    })
    setMode("select")
    setCandidateSearch("")
    setSelectedCandidate(null)
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  useEffect(() => {
    if (initialUrutan) {
      setValue("urutanKk", String(initialUrutan))
    }
  }, [initialUrutan, setValue])

  useEffect(() => {
    if (mode !== "select") return

    const searchPenduduk = async () => {
      try {
        const url = new URL(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/penduduk`)
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
          if (json.success) {
            setCandidateList(json.data)
          }
        }
      } catch {
        console.error("Gagal mencari penduduk")
      }
    }

    const timer = setTimeout(searchPenduduk, 300)
    return () => clearTimeout(timer)
  }, [mode, candidateSearch])

  const handleSelectCandidate = (candId: string | null) => {
    if (!candId) return
    setValue("selectedPendudukId", candId)
    const found = candidateList.find((c) => c.id === candId)
    if (found) {
      setSelectedCandidate(found)
    }
  }

  const onSubmit = async (data: TambahAnggotaKkFormValues) => {
    if (!kkId) return
    setIsLoading(true)

    try {
      let payload: Record<string, unknown>

      if (mode === "select") {
        if (!data.selectedPendudukId) {
          toast.error("Pilih data penduduk terlebih dahulu.")
          setIsLoading(false)
          return
        }
        payload = {
          mode: "select",
          pendudukId: data.selectedPendudukId,
          shdk: data.shdk,
          urutanKk: data.urutanKk || undefined,
        }
      } else {
        if (!data.nik || data.nik.length !== 16) {
          toast.error("NIK harus 16 digit.")
          setIsLoading(false)
          return
        }
        if (!data.namaLengkap || data.namaLengkap.length < 3) {
          toast.error("Nama Lengkap minimal 3 karakter.")
          setIsLoading(false)
          return
        }
        if (!data.tanggalLahir) {
          toast.error("Tanggal Lahir wajib diisi.")
          setIsLoading(false)
          return
        }

        payload = {
          mode: "create",
          shdk: data.shdk,
          urutanKk: data.urutanKk || undefined,
          penduduk: {
            nik: data.nik,
            namaLengkap: data.namaLengkap,
            tempatLahir: data.tempatLahir,
            tanggalLahir: format(data.tanggalLahir, "yyyy-MM-dd"),
            jenisKelamin: data.jenisKelamin,
            agama: data.agama,
            statusPerkawinan: data.statusPerkawinan,
            pekerjaan: data.pekerjaan,
          },
        }
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/kk/${kkId}/anggota`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (res.ok && json.success) {
        const createdPendudukId = json.data?.id
        if (mode === "create" && selectedFile && createdPendudukId) {
          try {
            const formData = new FormData()
            formData.append("file", selectedFile)
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/penduduk/${createdPendudukId}/foto`, {
              method: "POST",
              credentials: "include",
              body: formData,
            })
          } catch {
            console.error("Gagal mengunggah foto")
          }
        }

        toast.success("Berhasil", { description: "Anggota keluarga baru berhasil ditambahkan." })
        resetForm()

        if (onSuccess) {
          onSuccess()
        } else {
          router.push(`/kk/${kkId}`)
        }
      } else {
        toast.error("Gagal menambahkan anggota", { description: json.message || "Terjadi kesalahan sistem." })
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
    isFetchingKK,
    kkInfo,
    mode,
    setMode,
    candidateList,
    candidateSearch,
    setCandidateSearch,
    selectedCandidate,
    previewUrl,
    setPreviewUrl,
    setSelectedFile,
    handleSelectCandidate,
    onSubmit,
    resetForm,
  }
}
