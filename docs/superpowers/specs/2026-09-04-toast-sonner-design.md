# Spesifikasi Desain Fitur Toast (Sonner)

## 1. Konteks & Latar Belakang
Pada aplikasi web Sistem Informasi Kependudukan Desa Kedungsumur (`web/`), seluruh halaman CRUD (Kependudukan, Kartu Keluarga, Pengguna, Dashboard) sudah mengimplementasikan pemanggilan fungsi `toast` dari package `sonner` (misal: `toast.success`, `toast.error`, `toast.info`). Terdapat lebih dari 90 pemanggilan notifikasi di 12 halaman berbeda. Namun, komponen visual `<Toaster />` belum dipasang di root layout (`app/layout.tsx`), sehingga notifikasi tidak muncul di layar pengguna.

## 2. Tujuan Desain
- Mengaktifkan rendering notifikasi visual di seluruh aplikasi web.
- Mendukung tema gelap dan terang secara dinamis (`next-themes`).
- Memastikan styling notifikasi serasi dengan design token Tailwind CSS v4 aplikasi (warna latar, border, popover, dan radius).
- Menjamin kompatibilitas 100% tanpa mengubah pemanggilan `toast` yang sudah tersebar di berbagai page.

## 3. Arsitektur Komponen
1. **`web/components/ui/sonner.tsx`**:
   - Komponen Client Component wrapper untuk `Sonner` (`Toaster as Sonner`).
   - Membaca `theme` dan `resolvedTheme` dari hook `useTheme()` (`next-themes`).
   - Menyediakan class styling default untuk item toast:
     - Background: `bg-background` / `bg-popover`
     - Foreground: `text-foreground`
     - Border: `border-border`
     - Shadow: `shadow-lg`
     - Rich colors dan close button bawaan.
2. **`web/app/layout.tsx`**:
   - Mengimpor `Toaster` dari `@/components/ui/sonner`.
   - Meletakkan `<Toaster position="top-right" richColors closeButton />` di dalam `<ThemeProvider>` sehingga toast memiliki akses penuh ke state tema dan context tree.

## 4. Rencana Pengujian & Verifikasi
- Jalankan `npm --prefix web run typecheck` untuk memastikan tidak ada konflik tipe data TypeScript.
- Jalankan `npm --prefix web run build` untuk memverifikasi bundle Next.js 16 berhasil dikompilasi.
- Uji navigasi dan trigger toast (seperti aksi simpan, hapus, error) untuk melihat tampilan toast di pojok kanan atas.
