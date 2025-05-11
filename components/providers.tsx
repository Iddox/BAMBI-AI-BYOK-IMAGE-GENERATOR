"use client"

import { ThemeProvider } from "next-themes"
import { ReactNode } from "react"
import { ApiConfigProvider } from "@/contexts/ApiConfigContext"

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <ApiConfigProvider>
        {children}
      </ApiConfigProvider>
    </ThemeProvider>
  )
}
