import type { Metadata, Viewport } from "next"
import { Fira_Code, Fira_Sans } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"

const fontSans = Fira_Sans({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Fira_Code({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: {
    default: "Sistem Informasi Kependudukan Desa Kedungsumur",
    template: "%s | SID Desa Kedungsumur",
  },
  description:
    "Aplikasi pengelolaan administrasi dan data kependudukan Pemerintah Desa Kedungsumur.",
  applicationName: "SIK Kedungsumur",
  authors: [{ name: "Pemerintah Desa Kedungsumur" }],
  keywords: [
    "Kependudukan",
    "Desa Kedungsumur",
    "Sistem Informasi Desa",
    "Administrasi Desa",
  ],
  icons: {
    icon: "/favicon.ico",
  },
  robots: {
    index: false,
    follow: false,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased bg-background text-foreground`}
    >
      <body>
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  )
}
