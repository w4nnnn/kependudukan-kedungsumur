# Spesifikasi Desain: Validasi Ketat Karakter & Simbol pada Form Kependudukan dan KK

## 1. Konteks & Latar Belakang
Pada aplikasi web Sistem Informasi Kependudukan Desa Kedungsumur, form input data penduduk (`/kependudukan/tambah`, `/kependudukan/edit/[id]`) dan kartu keluarga (`/kk/tambah`, `/kk/edit/[id]`) sebelumnya hanya memvalidasi panjang karakter atau tipe string umum tanpa batasan karakter khusus. Akibatnya, input dapat diisi dengan simbol tidak semestinya seperti tanda plus `+`, minus `-`, simbol matematika, atau karakter liar lainnya pada field NIK, Nomor KK, RT, RW, nama lengkap, dan tempat lahir.

## 2. Tujuan Desain
- Menerapkan validasi regex ketat menggunakan Zod pada seluruh form kependudukan dan Kartu Keluarga di frontend.
- Mencegah simbol-simbol terlarang:
  1. **Field Angka Murni (NIK, Nomor KK, RT, RW, Kode Pos)**: Hanya boleh angka `0-9`. Karakter simbol seperti `+`, `-`, `.`, `,`, `e` dilarang.
  2. **Field Nama Lengkap & Nama Orang Tua**: Hanya boleh huruf alfabet, spasi, tanda petik satu (`'`), dan titik (`.`) untuk singkatan atau gelar.
  3. **Field Tempat Lahir**: Hanya boleh huruf alfabet dan spasi.
  4. **Field Alamat**: Hanya boleh kombinasi huruf, angka, spasi, serta tanda baca alamat yang sah (`.`, `,`, `/`, `-`).
  5. **Field Pekerjaan & Dusun**: Hanya boleh kombinasi huruf, angka, spasi, garis miring, titik, dan strip.
- Menyediakan helper sanitizer `onKeyDown` / filter input untuk mencegah pengetikan simbol secara langsung pada field numerik (NIK, KK, RT, RW, Kode Pos).

## 3. Rincian Teknis & Arsitektur

### 3.1 Modul Validasi Terpusat (`web/lib/validation.ts`)
Buat file helper validasi terpusat agar aturan regex konsisten di seluruh aplikasi:
```ts
// Regex definisi
export const REGEX_DIGITS = /^\d+$/
export const REGEX_NIK = /^\d{16}$/
export const REGEX_NO_KK = /^\d{16}$/
export const REGEX_RT_RW = /^\d{3}$/
export const REGEX_KODE_POS = /^\d{5}$/
export const REGEX_NAMA = /^[a-zA-Z\s'.]+$/
export const REGEX_TEMPAT_LAHIR = /^[a-zA-Z\s]+$/
export const REGEX_ALAMAT = /^[a-zA-Z0-9\s.,/'-]+$/
export const REGEX_PEKERJAAN = /^[a-zA-Z0-9\s/.-]+$/

// Helper event handler untuk input angka murni
export function blockNonNumericKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
  // Izinkan tombol navigasi dan kontrol (Backspace, Tab, Delete, Arrow, Ctrl/Cmd + C/V/A)
  if (
    ["Backspace", "Tab", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter"].includes(e.key) ||
    e.ctrlKey ||
    e.metaKey
  ) {
    return
  }
  // Blokir karakter non-angka (termasuk +, -, ., e)
  if (!/^\d$/.test(e.key)) {
    e.preventDefault()
  }
}
```

### 3.2 Pembaruan Zod Schema pada Halaman Form
1. **`web/app/kependudukan/tambah/page.tsx` & `web/app/kependudukan/edit/[id]/page.tsx`**:
   - `nik`: `z.string().regex(/^\d{16}$/, "NIK harus tepat 16 digit angka tanpa simbol")`
   - `noKk`: `z.string().regex(/^\d{16}$/, "Nomor KK harus tepat 16 digit angka tanpa simbol")`
   - `namaLengkap`: `z.string().min(3).regex(/^[a-zA-Z\s'.]+$/, "Nama hanya boleh berisi huruf, spasi, titik, atau tanda petik")`
   - `tempatLahir`: `z.string().min(3).regex(/^[a-zA-Z\s]+$/, "Tempat lahir hanya boleh berisi huruf dan spasi")`
   - `rt`: `z.string().regex(/^\d{3}$/, "RT harus berupa 3 digit angka (contoh: 001)")`
   - `rw`: `z.string().regex(/^\d{3}$/, "RW harus berupa 3 digit angka (contoh: 002)")`
   - `alamat`: `z.string().min(5).regex(/^[a-zA-Z0-9\s.,/'-]+$/, "Alamat mengandung simbol yang tidak diperbolehkan")`
   - `pekerjaan`: `z.string().min(2).regex(/^[a-zA-Z0-9\s/.-]+$/, "Pekerjaan hanya boleh berisi huruf, angka, spasi, atau strip")`
   - Field KK baru (`kkRt`, `kkRw`, `kkKodePos`, `kkAlamat`, `kkDusun`): validasi serupa.

2. **`web/app/kk/tambah/page.tsx` & `web/app/kk/edit/[id]/page.tsx`**:
   - Terapkan schema yang sama pada field `noKk`, `rt`, `rw`, `kodePos`, `alamat`, `dusun`, serta data kepala baru (`nikBaru`, `namaBaru`, `tempatLahirBaru`).

### 3.3 Penambahan Event Filter Input
- Pada elemen `<Input />` untuk NIK, No KK, RT, RW, dan Kode Pos, pasang `onKeyDown={blockNonNumericKeyDown}` agar pengetikan tombol `+`, `-`, atau karakter non-angka dicegah seketika.

## 4. Rencana Pengujian & Verifikasi
1. **Testing Unit Validasi**: Uji form dengan mencoba mengetik dan mengirim string simbol:
   - Coba ketik `+1234567890123456` pada NIK -> tombol `+` terblokir dan/atau ditolak Zod.
   - Coba masukkan nama dengan simbol `Budi + Santoso` -> ditolak dengan pesan error yang jelas.
   - Coba masukkan RT `0-1` -> ditolak Zod.
2. **Kompilasi & Build**: Jalankan `npm --prefix web run typecheck` dan `npm --prefix web run build`.
3. **Automated API Test Backend**: Jalankan `npm --prefix server run test:api` untuk memastikan backend tidak terganggu.
