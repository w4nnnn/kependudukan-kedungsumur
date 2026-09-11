"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, type FieldErrors } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format, parseISO } from "date-fns"
import { toast } from "sonner"
import { API_BASE_URL } from "@/lib/config"
import {
  editPendudukFormSchema,
  type EditPendudukFormValues,
} from "./kependudukan-form-schema"

export function useEditPenduduk(id: string | undefined) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [currentFotoUrl, setCurrentFotoUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false)

  const form = useForm<EditPendudukFormValues>({
    resolver: zodResolver(editPendudukFormSchema),
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
    },
  })

  const { reset } = form

  useEffect(() => {
    if (!id) return

    const fetchPenduduk = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/penduduk/${id}`, {
          credentials: "include",
        })

        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data) {
            const data = json.data
            if (data.tanggalLahir) {
              data.tanggalLahir = typeof data.tanggalLahir === "string" ? parseISO(data.tanggalLahir) : new Date(data.tanggalLahir)
            }
            const safeData = {
              ...data,
              pekerjaan: data.pekerjaan || "",
            }
            if (data.fotoUrl) {
              setCurrentFotoUrl(data.fotoUrl)
            }
            reset(safeData)
          } else {
            toast.error("Gagal memuat data penduduk")
            router.push("/kependudukan")
          }
        } else {
          toast.error("Gagal memuat data penduduk")
          router.push("/kependudukan")
        }
      } catch {
        toast.error("Terjadi kesalahan sistem")
        router.push("/kependudukan")
      } finally {
        setIsFetching(false)
      }
    }

    fetchPenduduk()
  }, [id, reset, router])

  const handleDeleteCurrentPhoto = async () => {
    if (!id || !currentFotoUrl) return
    setIsDeletingPhoto(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/penduduk/${id}/foto`, {
        method: "DELETE",
        credentials: "include",
      })
      const result = await res.json()
      if (res.ok && result.success) {
        setCurrentFotoUrl(null)
        setSelectedFile(null)
        setPreviewUrl(null)
        toast.success("Berhasil", { description: "Foto penduduk berhasil dihapus." })
      } else {
        toast.error("Gagal Menghapus Foto", {
          description: result.message || "Terjadi kesalahan pada server.",
        })
      }
    } catch {
      toast.error("Error Sistem", { description: "Gagal menghubungi server." })
    } finally {
      setIsDeletingPhoto(false)
    }
  }

  const onInvalid = (errors: FieldErrors<EditPendudukFormValues>) => {
    const errorKeys = Object.keys(errors) as (keyof EditPendudukFormValues)[]
    if (errorKeys.length > 0) {
      const firstError = errors[errorKeys[0]]
      toast.error("Formulir belum lengkap atau tidak valid", {
        description:
          firstError?.message?.toString() ||
          "Silakan periksa kembali kolom isian yang bertanda merah.",
      })
    }
  }

  const onSubmit = async (data: EditPendudukFormValues) => {
    setIsLoading(true)
    try {
      const url = `${API_BASE_URL}/api/penduduk/${id}`
      const formattedData = {
        ...data,
        tanggalLahir: format(data.tanggalLahir, "yyyy-MM-dd"),
      }

      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formattedData),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        if (selectedFile && id) {
          try {
            const formData = new FormData()
            formData.append("file", selectedFile)
            await fetch(`${API_BASE_URL}/api/penduduk/${id}/foto`, {
              method: "POST",
              credentials: "include",
              body: formData,
            })
          } catch (uploadError) {
            console.error("Gagal mengunggah foto penduduk:", uploadError)
          }
        }

        toast.success("Berhasil", { description: "Data penduduk berhasil diperbarui." })
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
    isFetching,
    currentFotoUrl,
    previewUrl,
    setPreviewUrl,
    setSelectedFile,
    isDeletingPhoto,
    handleDeleteCurrentPhoto,
    onSubmit,
    onInvalid,
  }
}
