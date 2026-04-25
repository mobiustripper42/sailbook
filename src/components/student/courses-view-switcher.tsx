'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'sailbook.courses-view'
const MOBILE_QUERY = '(max-width: 639px)'

type View = 'calendar' | 'list'

export function CoursesViewSwitcher({
  calendar,
  list,
}: {
  calendar: ReactNode
  list: ReactNode
}) {
  // Server renders calendar; client may switch to list after reading
  // localStorage / matchMedia. Brief flicker on first load is acceptable —
  // alternative is server-rendering nothing, which kills SSR perf.
  const [view, setView] = useState<View>('calendar')
  const [isMobile, setIsMobile] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  // Hydration-safe pattern (same as theme-toggle.tsx): read browser state in
  // an effect after mount. The lint rule discourages setState-in-effect in
  // general, but reading localStorage / matchMedia is the standard exception.
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY)
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)

    const saved = window.localStorage.getItem(STORAGE_KEY)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved === 'calendar' || saved === 'list') setView(saved)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true)

    return () => mq.removeEventListener('change', update)
  }, [])

  function pickView(next: View) {
    setView(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // localStorage can throw in privacy modes — preference doesn't persist,
      // but the in-memory toggle still works for the session.
    }
  }

  const effectiveView: View = isMobile ? 'list' : view

  return (
    <>
      {/* Toggle hidden on mobile (forced list). Hidden until hydrated to
          avoid showing a control with the wrong selected state. */}
      {hydrated && !isMobile && (
        <div
          className="mb-4 inline-flex items-center gap-1 rounded-md border bg-card p-0.5"
          data-testid="courses-view-toggle"
          role="group"
          aria-label="Course view"
        >
          <Button
            type="button"
            size="sm"
            variant={view === 'calendar' ? 'secondary' : 'ghost'}
            onClick={() => pickView('calendar')}
            data-testid="view-toggle-calendar"
            aria-pressed={view === 'calendar'}
            className={cn('h-7 px-3', view === 'calendar' && 'shadow-sm')}
          >
            Calendar
          </Button>
          <Button
            type="button"
            size="sm"
            variant={view === 'list' ? 'secondary' : 'ghost'}
            onClick={() => pickView('list')}
            data-testid="view-toggle-list"
            aria-pressed={view === 'list'}
            className={cn('h-7 px-3', view === 'list' && 'shadow-sm')}
          >
            List
          </Button>
        </div>
      )}

      <div data-testid="courses-view-content" data-active-view={effectiveView}>
        {effectiveView === 'calendar' ? calendar : list}
      </div>
    </>
  )
}
