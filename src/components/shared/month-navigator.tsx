'use client'

import { Button } from '@/components/ui/button'

// Month pager. Controls sit to the LEFT of the label (fixed cluster) so the
// month name can grow/shrink to the right without the buttons jumping.
export function MonthNavigator({
  label,
  onPrev,
  onNext,
  onToday,
}: {
  label: string
  onPrev: () => void
  onNext: () => void
  onToday: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <Button type="button" variant="outline" size="sm" onClick={onPrev} aria-label="Previous month" data-testid="calendar-prev">
          ‹
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onToday}>
          Today
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onNext} aria-label="Next month" data-testid="calendar-next">
          ›
        </Button>
      </div>
      <h2 className="text-base font-semibold" data-testid="calendar-month-label">
        {label}
      </h2>
    </div>
  )
}
