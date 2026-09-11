import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format as dateFnsFormat } from "date-fns"
import { id } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateId(
  date: Date | number | string | null | undefined,
  formatStr: string = "PPP"
) {
  if (!date) return "-"
  const d = typeof date === "string" ? new Date(date) : date
  if (d instanceof Date && isNaN(d.getTime())) return "-"
  return dateFnsFormat(d, formatStr, { locale: id })
}

export async function downloadFileFromApi(
  endpoint: string,
  fallbackFilename: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(endpoint, {
      credentials: "include",
    })

    if (!res.ok) {
      let errorMessage = "Gagal mengunduh berkas."
      try {
        const json = await res.json()
        errorMessage = json.message || json.error || errorMessage
      } catch {}
      return { success: false, message: errorMessage }
    }

    const blob = await res.blob()
    const contentDisposition = res.headers.get("content-disposition")
    let filename = fallbackFilename
    if (contentDisposition) {
      const match = contentDisposition.match(/filename=["']?([^"';]+)["']?/i)
      if (match && match[1]) {
        filename = match[1]
      }
    }

    const blobUrl = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = blobUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(blobUrl)

    return { success: true }
  } catch (error: unknown) {
    const err = error as Error
    return { success: false, message: err?.message || "Kesalahan jaringan saat mengunduh berkas." }
  }
}
