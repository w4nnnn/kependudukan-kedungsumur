# Fitur Manajemen Pengguna Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan modul antarmuka manajemen pengguna (User Management) di frontend Next.js (`web/`) menggunakan Better Auth Admin Client untuk mengelola pengguna (CRUD, role, reset password, ban/unban).

**Architecture:** Menggunakan Next.js App Router dengan Better Auth React client yang terintegrasi dengan plugin `adminClient` dan `usernameClient`. Halaman terbagi menjadi rute layout, daftar pengguna dengan pencarian & paginasi, halaman tambah pengguna, dan halaman edit/kelola terpadu.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Better Auth Client (`better-auth/client/plugins`), React Hook Form, Zod, Sonner (Toasts), Lucide React, Radix UI / Shadcn UI components.

## Global Constraints
- Target workspace: `web/`
- API Base URL: `process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"`
- Role tersedia: `admin` | `user`
- Validasi username minimal 3 karakter, password minimal 6 karakter
- Navigasi menu utama: Sidebar mengganti "Pengaturan" dengan "Pengguna" (`/pengguna`)

---

### Task 1: Konfigurasi Better Auth Admin Client

**Files:**
- Modify: `web/lib/auth-client.ts`

**Interfaces:**
- Consumes: `better-auth/react`, `better-auth/client/plugins` (`adminClient`, `usernameClient`)
- Produces: `authClient` dengan namespace `authClient.admin.*` (`listUsers`, `createUser`, `updateUser`, `setRole`, `setUserPassword`, `banUser`, `unbanUser`, `removeUser`, dll).

- [ ] **Step 1: Modifikasi `web/lib/auth-client.ts`**

```typescript
import { createAuthClient } from "better-auth/react"
import { usernameClient, adminClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
    plugins: [
        usernameClient(),
        adminClient()
    ]
})
```

- [ ] **Step 2: Verifikasi Typecheck**

Run: `npm run typecheck` (di folder `web`)
Expected: PASS tanpa error type.

- [ ] **Step 3: Commit Perubahan**

```bash
git add web/lib/auth-client.ts
git commit -m "feat(web): add adminClient plugin to authClient"
```

---

### Task 2: Perbarui Navigasi Sidebar

**Files:**
- Modify: `web/components/app-sidebar.tsx`

**Interfaces:**
- Consumes: `usePathname` dari `next/navigation`, `Users`, `UserCog` dari `lucide-react`
- Produces: Item navigasi menu "Pengguna" di sidebar yang mengarah ke `/pengguna`.

- [ ] **Step 1: Ubah menu di `web/components/app-sidebar.tsx`**

Ganti menu "Pengaturan" dengan menu "Pengguna" (`/pengguna`), menggunakan ikon `UserCog` dan `isActive={pathname.startsWith("/pengguna")}`.

- [ ] **Step 2: Verifikasi Typecheck**

Run: `npm run typecheck` (di folder `web`)
Expected: PASS

- [ ] **Step 3: Commit Perubahan**

```bash
git add web/components/app-sidebar.tsx
git commit -m "feat(web): update sidebar navigation with user management menu"
```

---

### Task 3: Buat Layout Modul Pengguna

**Files:**
- Create: `web/app/pengguna/layout.tsx`

**Interfaces:**
- Consumes: `SidebarProvider`, `SidebarTrigger`, `SidebarInset` dari `@/components/ui/sidebar`, `AppSidebar` dari `@/components/app-sidebar`
- Produces: Root layout untuk seluruh rute di bawah `/pengguna/*`.

- [ ] **Step 1: Tulis `web/app/pengguna/layout.tsx`**

```tsx
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

export default function PenggunaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/10 bg-background/50 px-4 backdrop-blur-xl">
          <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground hover:bg-white/5" />
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
```

- [ ] **Step 2: Verifikasi Typecheck**

Run: `npm run typecheck` (di folder `web`)
Expected: PASS

- [ ] **Step 3: Commit Perubahan**

```bash
git add web/app/pengguna/layout.tsx
git commit -m "feat(web): add layout for user management module"
```

---

### Task 4: Buat Halaman Daftar Pengguna (`/pengguna`)

**Files:**
- Create: `web/app/pengguna/page.tsx`

**Interfaces:**
- Consumes: `authClient.admin.listUsers`, `authClient.admin.removeUser`, `authClient.useSession`
- Produces: Halaman daftar pengguna dengan pencarian, paginasi, badge status/role, aksi dropdown edit & delete modal konfirmasi.

- [ ] **Step 1: Tulis `web/app/pengguna/page.tsx`**

Implementasikan state session check, fetching data pengguna dengan `authClient.admin.listUsers`, debounced search, pagination controls, tabel daftar pengguna dengan indikator role/status ban, dan dialog konfirmasi hapus (`authClient.admin.removeUser`).

- [ ] **Step 2: Verifikasi Typecheck**

Run: `npm run typecheck` (di folder `web`)
Expected: PASS

- [ ] **Step 3: Commit Perubahan**

```bash
git add web/app/pengguna/page.tsx
git commit -m "feat(web): create user list page with search, pagination and delete"
```

---

### Task 5: Buat Halaman Tambah Pengguna (`/pengguna/tambah`)

**Files:**
- Create: `web/app/pengguna/tambah/page.tsx`

**Interfaces:**
- Consumes: `authClient.admin.createUser`, `useForm`, `zodResolver`
- Produces: Halaman formulir penambahan akun pengguna baru dengan input nama, username, email, password, role.

- [ ] **Step 1: Tulis `web/app/pengguna/tambah/page.tsx`**

Validasi skema Zod (nama min 3, username min 3, email format valid, password min 6, role `admin` | `user`). Panggil `authClient.admin.createUser`, tampilkan toast Sonner, tangani error spesifik (`USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL`), dan redirect ke `/pengguna`.

- [ ] **Step 2: Verifikasi Typecheck**

Run: `npm run typecheck` (di folder `web`)
Expected: PASS

- [ ] **Step 3: Commit Perubahan**

```bash
git add web/app/pengguna/tambah/page.tsx
git commit -m "feat(web): create add user page with zod validation and authClient integration"
```

---

### Task 6: Buat Halaman Edit & Kelola Pengguna (`/pengguna/edit/[id]`)

**Files:**
- Create: `web/app/pengguna/edit/[id]/page.tsx`

**Interfaces:**
- Consumes: `authClient.admin.listUsers` / `authClient.admin.updateUser`, `authClient.admin.setRole`, `authClient.admin.setUserPassword`, `authClient.admin.banUser`, `authClient.admin.unbanUser`, `authClient.admin.removeUser`
- Produces: Halaman manajemen pengguna lengkap (Card Profil & Role, Card Ganti Password, Card Status Banned/Aktif, Card Hapus Akun).

- [ ] **Step 1: Tulis `web/app/pengguna/edit/[id]/page.tsx`**

Implementasikan 4 kartu manajemen:
1. **Profil & Role:** Edit `name`, `email`, `role` (`authClient.admin.updateUser` + `authClient.admin.setRole`).
2. **Ubah Password:** Input password baru min 6 karakter (`authClient.admin.setUserPassword`).
3. **Status Akun:** Ban / Unban dengan input alasan (`authClient.admin.banUser` / `authClient.admin.unbanUser`).
4. **Zona Bahaya:** Hapus akun secara permanen (`authClient.admin.removeUser`) dengan proteksi jika akun milik sendiri yang sedang login.

- [ ] **Step 2: Verifikasi Typecheck & Build**

Run: `npm run typecheck` (di folder `web`)
Expected: PASS

- [ ] **Step 3: Commit Perubahan**

```bash
git add web/app/pengguna/edit/[id]/page.tsx
git commit -m "feat(web): create edit and user management detail page"
```

---

### Task 7: Verifikasi Menyeluruh & Testing Build

**Files:**
- Test/Check: All modified & created files

- [ ] **Step 1: Jalankan Typecheck pada `web/`**

Run: `npm run typecheck` di direktori `web`
Expected: 0 error.

- [ ] **Step 2: Jalankan Next.js Build pada `web/`**

Run: `npm run build` di direktori `web`
Expected: Build sukses menghasilkan static/dynamic routes tanpa error.

- [ ] **Step 3: Commit Final**

```bash
git add .
git commit -m "feat(web): complete user management module implementation"
```
