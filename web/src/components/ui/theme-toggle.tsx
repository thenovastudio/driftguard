"use client"

import { useState, useEffect } from "react"
import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Read the actual DOM state (set by layout script)
    const hasDark = document.documentElement.classList.contains("dark")
    setIsDark(hasDark)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const root = document.documentElement
    if (isDark) {
      root.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      root.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }, [isDark, mounted])

  if (!mounted) {
    return <div className={cn("w-16 h-8 rounded-full bg-muted", className)} />
  }

  return (
    <div
      className={cn(
        "flex w-16 h-8 p-1 rounded-full cursor-pointer transition-all duration-300",
        "bg-muted border border-border",
        className
      )}
      onClick={() => setIsDark(!isDark)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          setIsDark(!isDark)
        }
      }}
    >
      <div className="flex justify-between items-center w-full">
        <div
          className={cn(
            "flex justify-center items-center w-6 h-6 rounded-full transition-all duration-300",
            isDark
              ? "translate-x-0 bg-primary"
              : "translate-x-8 bg-accent"
          )}
        >
          {isDark ? (
            <Moon className="w-4 h-4 text-primary-foreground" strokeWidth={1.5} />
          ) : (
            <Sun className="w-4 h-4 text-accent-foreground" strokeWidth={1.5} />
          )}
        </div>
        <div
          className={cn(
            "flex justify-center items-center w-6 h-6 rounded-full transition-all duration-300",
            isDark
              ? "bg-transparent"
              : "-translate-x-8"
          )}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          ) : (
            <Moon className="w-4 h-4 text-foreground" strokeWidth={1.5} />
          )}
        </div>
      </div>
    </div>
  )
}
