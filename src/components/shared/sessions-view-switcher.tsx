'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'sailbook.sessions-view'

type View = 'calendar' | 'list'

export function SessionsViewSwitcher({
  calendar,
  list,
  endSlot,
  calendarLabel = 'Calendar',
  listLabel = 'List',
}: {
  calendar: ReactNode
  list: ReactNode
  endSlot?: ReactNode
  // Labels are configurable (schedule uses "Month"/"List"); the internal view
  // keys + test-ids stay 'calendar'/'list' so specs and the stored pref hold.
  calendarLabel?: string
  listLabel?: string
}) {
  const [view, setView] = useState<View>('calendar')
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved === 'calendar' || saved === 'list') setView(saved)
    setHydrated(true)
  }, [])

  function pickView(next: View) {
    setView(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // localStorage unavailable in some privacy modes
    }
  }

  return (
    <>
      {hydrated && (
        // Toggle + month navigator cluster on the left (findable), not drifting right.
        <div className={cn('mb-4', endSlot && 'flex flex-wrap items-center gap-x-5 gap-y-3')}>
          <div
            className="inline-flex items-center gap-1 rounded-md border bg-card p-0.5"
            data-testid="sessions-view-toggle"
            role="group"
            aria-label="Session view"
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
              {calendarLabel}
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
              {listLabel}
            </Button>
          </div>
          {endSlot}
        </div>
      )}

      <div data-testid="sessions-view-content" data-active-view={view}>
        {view === 'calendar' ? calendar : list}
      </div>
    </>
  )
}
