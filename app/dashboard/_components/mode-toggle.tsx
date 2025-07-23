"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function ModeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  // Ensure component is mounted before rendering to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9 p-0" disabled>
        <Sun className="h-4 w-4" />
      </Button>
    )
  }

  const toggleTheme = () => {
    console.log('Current theme:', theme) // Debug log
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    console.log('Setting theme to:', newTheme) // Debug log
    setTheme(newTheme)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 p-0"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-3 w-4" />
      )}
      <span className="sr-only">
        {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      </span>
    </Button>
  )
}