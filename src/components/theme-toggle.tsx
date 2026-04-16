'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { HugeiconsIcon } from '@hugeicons/react'
import { Sun01Icon, Moon01Icon } from '@hugeicons/core-free-icons'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])

  // Avoid hydration mismatch — render nothing until mounted
  if (!mounted) return <div className="w-6 h-6" />

  // resolvedTheme can be undefined briefly after mount (before next-themes
  // reads localStorage). Default to 'dark' so the button shows the correct
  // label immediately instead of flickering to Moon then Sun.
  const isDark = (resolvedTheme ?? 'dark') !== 'light'

  function toggle() {
    setTheme(isDark ? 'light' : 'dark')
  }

  return (
    <button
      onClick={toggle}
      className="p-1 text-muted-foreground hover:text-foreground transition-colors"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <HugeiconsIcon icon={isDark ? Sun01Icon : Moon01Icon} size={16} />
    </button>
  )
}
