import { Fira_Code, Fira_Sans } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"

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
        </ThemeProvider>
      </body>
    </html>
  )
}
