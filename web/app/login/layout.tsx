import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Login",
  description: "Masuk ke Sistem Informasi Kependudukan Desa Kedungsumur",
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
