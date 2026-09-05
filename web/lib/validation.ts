import type * as React from "react"

export const REGEX_NIK = /^\d{16}$/
export const REGEX_NO_KK = /^\d{16}$/
export const REGEX_RT_RW = /^\d{3}$/
export const REGEX_KODE_POS = /^\d{5}$/
export const REGEX_NAMA = /^[a-zA-Z\s'.]+$/
export const REGEX_TEMPAT_LAHIR = /^[a-zA-Z\s]+$/
export const REGEX_ALAMAT = /^[a-zA-Z0-9\s.,/'-]+$/
export const REGEX_PEKERJAAN = /^[a-zA-Z0-9\s/.-]+$/
export const REGEX_DUSUN = /^[a-zA-Z0-9\s.-]+$/

export function blockNonNumericKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
  if (
    ["Backspace", "Tab", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter"].includes(e.key) ||
    e.ctrlKey ||
    e.metaKey
  ) {
    return
  }
  if (!/^\d$/.test(e.key)) {
    e.preventDefault()
  }
}
