"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, type FieldErrors } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { toast } from "sonner"
import { API_BASE_URL } from "@/lib/config"
import type { CandidateKK } from "./types"
import {
  tambahPendudukFormSchema,
  type TambahPendudukFormValues,
} from "./kependudukan-form-schema"

export function useTambahPenduduk() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const [modeKk, setModeKk] = useState<"select" | "create">("select")
  const [kkSearch, setKkSearch] = useState("")
  const [kkList, setKkList] = useState<CandidateKK[]>([])
  const [selectedKkId, setSelectedKkId] = useState<string>("")
  const [selectedKkData, setSelectedKkData] = useState<CandidateKK | null>(null)
  const [isLoadingKk, setIsLoadingKk] = useState(false)

  const form = useForm<TambahPendudukFormValues>({
    resolver: zodResolver(tambahPendudukFormSchema),
    defaultValues: {
      nik: "",
      noKk: "",
      namaLengkap: "",
      tempatLahir: "",
      jenisKelamin: undefined,
      alamat: "",
      rt: "",
      rw: "",
      agama: undefined,
      statusPerkawinan: undefined,
      shdk: "KEPALA KELUARGA",
      pekerjaan: "",
      kkAlamat: "",
      kkRt: "",
      kkRw: "",
      kkDusun: "",
      kkKodePos: "",
    },
  })

  const { setValue } = form

  useEffect(() => {
    if (modeKk !== "select") return

    const fetchKkOptions = async () => {
      setIsLoadingKk(true)
      try {
        const url = new URL(`${API_BASE_URL}/api/kk`)
        url.searchParams.append("limit", "10")
        if (kkSearch) {
          if (/^\d{16}$/.test(kkSearch)) {
            url.searchParams.append("nokk", kkSearch)
          } else {
            url.searchParams.append("search", kkSearch)
          }
        }
        const res = await fetch(url.toString(), { credentials: "include" })
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data) {
            setKkList(json.data)
          }
        }
      } catch (err) {
        console.error("Gagal memuat opsi KK", err)
      } finally {
        setIsLoadingKk(false)
      }
    }

    const timer = setTimeout(fetchKkOptions, 400)
    return () => clearTimeout(timer)
  }, [kkSearch, modeKk])

  const handleSelectKk = (kkId: string) => {
    setSelectedKkId(kkId)
    const found = kkList.find((k) => k.id === kkId)
    if (found) {
      setSelectedKkData(found)
      setValue("noKk", found.noKk, { shouldValidate: true })
      setValue("alamat", found.alamat, { shouldValidate: true })
      setValue("rt", found.rt, { shouldValidate: true })
      setValue("rw", found.rw, { shouldValidate: true })
    }
  }

  const onInvalid = (errors: FieldErrors<TambahPendudukFormValues>) => {
    const errorKeys = Object.keys(errors) as (keyof TambahPendudukFormValues)[]
    if (errorKeys.length > 0) {
      const firstError = errors[errorKeys[0]]
      toast.error("Formulir belum lengkap atau tidak valid", {
        description:
          firstError?.message?.toString() ||
          "Silakan periksa kembali kolom isian yang bertanda merah.",
      })
    }
  }

  const onSubmit = async (data: TambahPendudukFormValues) => {
    setIsLoading(true)
    try {
      const url = `${API_BASE_URL}/api/penduduk`

      const {
        kkAlamat,
        kkRt,
        kkRw,
        kkDusun,
        kkKodePos,
        kkTanggalDikeluarkan,
        ...pendudukPayload
      } = data

      const effectiveAlamat = (kkAlamat?.trim() || data.alamat?.trim()) ?? ""
      const effectiveRt = (kkRt?.trim() || data.rt?.trim()) ?? ""
      const effectiveRw = (kkRw?.trim() || data.rw?.trim()) ?? ""

      const payload: Record<string, unknown> = {
        ...pendudukPayload,
        alamat: effectiveAlamat,
        rt: effectiveRt,
        rw: effectiveRw,
        tanggalLahir: format(data.tanggalLahir, "yyyy-MM-dd"),
      }

      if (modeKk === "select") {
        if (!selectedKkId) {
          toast.error("Pilih Kartu Keluarga terdaftar terlebih dahulu.")
          setIsLoading(false)
          return
        }
        payload.kartuKeluargaId = selectedKkId
      } else if (modeKk === "create") {
        if (!data.noKk || data.noKk.length !== 16) {
          toast.error("Nomor KK harus 16 digit.")
          setIsLoading(false)
          return
        }
        if (!effectiveAlamat || effectiveAlamat.length < 5) {
          toast.error("Alamat domisili KK minimal 5 karakter.")
          setIsLoading(false)
          return
        }
        if (!effectiveRt || effectiveRt.length !== 3 || !effectiveRw || effectiveRw.length !== 3) {
          toast.error("RT dan RW Kartu Keluarga harus 3 digit (contoh: 001).")
          setIsLoading(false)
          return
        }

        payload.createKk = {
          noKk: data.noKk,
          alamat: effectiveAlamat,
          rt: effectiveRt,
          rw: effectiveRw,
          dusun: kkDusun || undefined,
          kodePos: kkKodePos || undefined,
          tanggalDikeluarkan: kkTanggalDikeluarkan
            ? format(kkTanggalDikeluarkan, "yyyy-MM-dd")
            : undefined,
        }
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        const newId = result.data?.id
        if (selectedFile && newId) {
          try {
            const formData = new FormData()
            formData.append("file", selectedFile)
            await fetch(`${API_BASE_URL}/api/penduduk/${newId}/foto`, {
              method: "POST",
              credentials: "include",
              body: formData,
            })
          } catch (uploadError) {
            console.error("Gagal mengunggah foto penduduk:", uploadError)
          }
        }

        toast.success("Berhasil", { description: "Data penduduk berhasil ditambahkan." })
        router.push("/kependudukan")
      } else {
        toast.error("Gagal Menyimpan", {
          description: result.message || "Terjadi kesalahan pada server.",
        })
      }
    } catch (error) {
      toast.error("Error Sistem", { description: "Gagal menghubungi server." })
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    form,
    isLoading,
    previewUrl,
    setPreviewUrl,
    setSelectedFile,
    modeKk,
    setModeKk,
    kkSearch,
    setKkSearch,
    kkList,
    selectedKkId,
    selectedKkData,
    isLoadingKk,
    handleSelectKk,
    onSubmit,
    onInvalid,
  }
}
