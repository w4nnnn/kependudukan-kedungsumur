import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format as dateFnsFormat } from "date-fns"
import { id } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateId(date: Date | number | string, formatStr: string = "PPP") {
  const d = typeof date === "string" ? new Date(date) : date
  return dateFnsFormat(d, formatStr, { locale: id })
}
