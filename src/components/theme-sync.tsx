'use client'

import { useEffect } from 'react'

const SYNC_KEY = 'sailbook-theme-synced'

// Syncs the user's DB-stored theme preference to next-themes once per
// browser session. Uses sessionStorage to prevent re-running on every
// page navigation (which would override the user's in-session toggle).
// On a fresh login (new tab, new device), the DB preference is applied.
//
// Writes directly to localStorage (next-themes storage key) so the
// preference takes effect on the next page navigation. On the very first
// page after login, the ThemeProvider's defaultTheme="system" renders
// briefly before localStorage is populated — acceptable trade-off vs.
// the re-render cascade from calling setTheme() during hydration.
export function ThemeSync({ preference }: { preference: string }) {
  useEffect(() => {
    if (!sessionStorage.getItem(SYNC_KEY)) {
      sessionStorage.setItem(SYNC_KEY, '1')
      localStorage.setItem('theme', preference)
    }
  }, [preference])

  return null
}
