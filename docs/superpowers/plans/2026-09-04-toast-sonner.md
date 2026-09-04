# Sonner Toast Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan komponen visual Toaster (Sonner) ke aplikasi web Next.js agar semua notifikasi toast yang sudah ada di halaman dapat ditampilkan kepada pengguna.

**Architecture:** Membuat wrapper `components/ui/sonner.tsx` yang mengintegrasikan `sonner` dengan `next-themes` dan styling Tailwind CSS v4, kemudian memasangnya ke dalam root layout `app/layout.tsx`.

**Tech Stack:** Next.js 16, React 19, Sonner 2, next-themes, Tailwind CSS v4, Lucide Icons.

## Global Constraints
- Menggunakan library `sonner` yang sudah terinstall di `package.json`.
- Tidak mengubah pemanggilan `toast` yang sudah ada di halaman-halaman aplikasi.
- Mendukung Dark Mode & Light Mode secara otomatis via `next-themes`.

---

### Task 1: Buat Komponen Wrapper Sonner Toaster

**Files:**
- Create: `web/components/ui/sonner.tsx`

**Interfaces:**
- Produces: `Toaster` component with Sonner props support

- [ ] **Step 1: Implementasi komponen Toaster**

Buat file `web/components/ui/sonner.tsx`:
```tsx
"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
```

- [ ] **Step 2: Verifikasi tipe data komponen**

Run: `npm --prefix web run typecheck`
Expected: PASS tanpa error TypeScript.

---

### Task 2: Pasang Toaster ke Root Layout

**Files:**
- Modify: `web/app/layout.tsx`

- [ ] **Step 1: Import dan pasang Toaster**

Tambahkan `<Toaster position="top-right" richColors closeButton />` di dalam `ThemeProvider` pada `web/app/layout.tsx`.

- [ ] **Step 2: Verifikasi build dan typecheck**

Run: `npm --prefix web run typecheck && npm --prefix web run build`
Expected: Build Next.js sukses tanpa error.

- [ ] **Step 3: Commit perubahan**

```bash
git add web/components/ui/sonner.tsx web/app/layout.tsx
git commit -m "feat(web): add and mount sonner toaster component"
```
