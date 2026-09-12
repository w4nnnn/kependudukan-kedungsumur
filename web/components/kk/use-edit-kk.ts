"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, type FieldErrors } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format, parseISO } from "date-fns"
import { toast } from "sonner"
import { API_BASE_URL } from "@/lib/config"
import type { AnggotaPenduduk } from "./types"
import { editKkFormSchema, type EditKkFormValues } from "./kk-form-schema"

export function useEditKk(routeId: string | undefined) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [anggotaList, setAnggotaList] = useState<AnggotaPenduduk[]>([])

  const form = useForm<EditKkFormValues>({
    resolver: zodResolver(editKkFormSchema),
    defaultValues: {
      noKk: "",
      alamat: "",
      rt: "",
      rw: "",
      dusun: "",
      kodePos: "",
      tanggalDikeluarkan: undefined,
      kepalaKeluargaId: "",
    },
  })

  const { reset } = form

  useEffect(() => {
    if (!routeId) return

    const fetchKK = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/kk/${routeId}`, {
          credentials: "include",
        })

        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data) {
            const kk = json.data
            setAnggotaList(kk.anggota || [])
            reset({
              noKk: kk.noKk || "",
              alamat: kk.alamat || "",
              rt: kk.rt || "",
              rw: kk.rw || "",
              dusun: kk.dusun || "",
              kodePos: kk.kodePos || "",
              tanggalDikeluarkan: kk.tanggalDikeluarkan ? parseISO(kk.tanggalDikeluarkan) : undefined,
              kepalaKeluargaId: kk.kepalaKeluargaId || "",
            })
          } else {
            toast.error("Gagal memuat data KK")
            router.push("/kk")
          }
        } else {
          toast.error("Gagal memuat data KK")
          router.push("/kk")
        }
      } catch {
        toast.error("Terjadi kesalahan sistem")
        router.push("/kk")
      } finally {
        setIsFetching(false)
      }
    }

    fetchKK()
  }, [routeId, reset, router])

  const onInvalid = (errors: FieldErrors<EditKkFormValues>) => {
    const errorKeys = Object.keys(errors) as (keyof EditKkFormValues)[]
    if (errorKeys.length > 0) {
      const firstError = errors[errorKeys[0]]
      toast.error("Formulir belum lengkap atau tidak valid", {
        description:
          firstError?.message?.toString() ||
          "Silakan periksa kembali kolom isian yang bertanda merah.",
      })
    }
  }

  const onSubmit = async (data: EditKkFormValues) => {
    setIsLoading(true)
    try {
      const payload = {
        ...data,
        kepalaKeluargaId: data.kepalaKeluargaId || null,
        tanggalDikeluarkan: data.tanggalDikeluarkan
          ? format(data.tanggalDikeluarkan, "yyyy-MM-dd")
          : null,
      }

      const res = await fetch(`${API_BASE_URL}/api/kk/${routeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (res.ok && json.success) {
        toast.success("Berhasil", { description: "Data Kartu Keluarga berhasil diperbarui." })
        router.push(`/kk/${routeId}`)
      } else {
        toast.error("Gagal memperbarui KK", { description: json.message || "Terjadi kesalahan." })
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
    isFetching,
    anggotaList,
    onSubmit,
    onInvalid,
  }
}
