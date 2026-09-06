/**
 * Konfigurasi Global Frontend
 * Menyediakan konfigurasi URL API Backend terpusat.
 */

export const API_BASE_URL: string =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
