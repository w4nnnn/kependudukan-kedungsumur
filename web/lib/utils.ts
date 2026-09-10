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
