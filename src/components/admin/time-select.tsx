'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = [0, 15, 30, 45]

function formatHour(h: number): string {
  if (h === 0) return '12 AM'
  if (h < 12) return `${h} AM`
  if (h === 12) return '12 PM'
  return `${h - 12} PM`
}

function snapMinute(m: number): number {
  return MINUTES.reduce((prev, curr) =>
    Math.abs(curr - m) < Math.abs(prev - m) ? curr : prev
  )
}

type Props = {
  name: string
  value: string // "HH:MM"
  onChange: (value: string) => void
}

export default function TimeSelect({ name, value, onChange }: Props) {
  const parts = value.includes(':') ? value.split(':') : ['8', '0']
  const hour = parseInt(parts[0] ?? '8', 10)
  const minute = snapMinute(parseInt(parts[1] ?? '0', 10))
  const safeValue = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

  function setHour(v: string) {
    const h = parseInt(v, 10)
    onChange(`${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)
  }

  function setMinute(v: string) {
    const m = parseInt(v, 10)
    onChange(`${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }

  return (
    <div className="flex gap-1 items-center min-w-0">
      <input type="hidden" name={name} value={safeValue} />
      <Select value={String(hour)} onValueChange={setHour}>
        <SelectTrigger className="flex-1 min-w-0" aria-label="Hour">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {HOURS.map((h) => (
            <SelectItem key={h} value={String(h)}>
              {formatHour(h)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={String(minute)} onValueChange={setMinute}>
        <SelectTrigger className="w-[72px] shrink-0" aria-label="Minute">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MINUTES.map((m) => (
            <SelectItem key={m} value={String(m)}>
              {String(m).padStart(2, '0')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
