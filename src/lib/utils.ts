import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function fmtDateLong(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Relative date label for session displays. Falls back to "Wed, May 6" for
 * anything outside ±1 day so the format is predictable and the day-of-week
 * is always present for orientation.
 */
export function fmtDateRelative(dateStr: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  const diffDays = Math.round((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'

  return target.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h < 12 ? 'am' : 'pm'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')}${ampm}`
}
