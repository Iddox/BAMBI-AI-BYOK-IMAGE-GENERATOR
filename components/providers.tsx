"use client"

import { ThemeProvider } from "next-themes"
import { ReactNode } from "react"
import { ApiConfigProvider } from "@/contexts/ApiConfigContext"
import { AuthProvider } from "@/contexts/AuthContext"

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem suppressHydrationWarning>
      <AuthProvider>
        <ApiConfigProvider>
          <div suppressHydrationWarning>
            {children}
          </div>
        </ApiConfigProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
