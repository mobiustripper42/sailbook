import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type {
  NeedsYouItem,
  DashSession,
  FillingCourse,
  JustEnrolledItem,
} from '@/lib/dashboard'

// ─── shared bits ─────────────────────────────────────────────────────────────

function Eyebrow({ label, badge }: { label: string; badge?: string }) {
  return (
    <div className="mb-2 flex items-baseline gap-2">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</h2>
      {badge && <span className="text-xs font-medium text-muted-foreground tabular-nums">{badge}</span>}
    </div>
  )
}

// short course-type code, mono per BRAND (codes are always mono).
function TypeChip({ code }: { code: string | null }) {
  if (!code) return null
  return (
    <span className="ml-1.5 rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground align-middle">
      {code}
    </span>
  )
}

function FillBar({ enrolled, capacity, tone = 'brand' }: { enrolled: number; capacity: number; tone?: 'brand' | 'warn' | 'ok' }) {
  const pct = capacity > 0 ? Math.min(100, Math.round((enrolled / capacity) * 100)) : 0
  const bg = tone === 'warn' ? 'bg-warning' : tone === 'ok' ? 'bg-primary' : 'bg-brand'
  return (
    <span className="inline-block h-1.5 w-16 overflow-hidden rounded-full bg-muted align-middle">
      <span className={cn('block h-full rounded-full', bg)} style={{ width: `${pct}%` }} />
    </span>
  )
}

// 9:00a / 12:30p — compact clock used across the session lists.
function clock(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'p' : 'a'
  const hour = h % 12 || 12
  return m === 0 ? `${hour}${ampm}` : `${hour}:${String(m).padStart(2, '0')}${ampm}`
}

function dayHeader(dateStr: string, now: Date): string {
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  const diff = Math.round((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
  if (diff === 1) return 'Tomorrow'
  return target.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

function Unassigned() {
  return <span className="text-warning">⚑ Unassigned</span>
}

// ─── Needs you ───────────────────────────────────────────────────────────────

const TONE: Record<NeedsYouItem['tone'], string> = {
  warn: 'border-warning/40 bg-warning/10',
  bad: 'border-destructive/40 bg-destructive/10',
  info: 'border-border bg-muted/40',
}
const TONE_TEXT: Record<NeedsYouItem['tone'], string> = {
  warn: 'text-warning',
  bad: 'text-destructive',
  info: 'text-foreground',
}

export function NeedsYou({ items }: { items: NeedsYouItem[] }) {
  return (
    <section>
      <Eyebrow label="Needs you" badge={items.length > 0 ? String(items.length) : undefined} />
      {items.length === 0 ? (
        <Card size="sm" className="border-dashed bg-transparent">
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <span aria-hidden="true">✓</span> You&apos;re all caught up.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'flex gap-3 rounded-sm border p-3 ring-1 ring-transparent transition-colors hover:ring-foreground/10',
                TONE[item.tone],
              )}
            >
              <div className={cn('text-2xl font-semibold tabular-nums leading-none', TONE_TEXT[item.tone])}>
                {item.count}
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className={cn('text-sm font-semibold leading-tight', TONE_TEXT[item.tone])}>{item.title}</p>
                <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
                <p className={cn('text-xs font-medium', TONE_TEXT[item.tone])}>{item.cta} →</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

// ─── Today on the water ──────────────────────────────────────────────────────

export function TodayOnTheWater({ sessions }: { sessions: DashSession[] }) {
  return (
    <section>
      <Eyebrow label="Today on the water" badge={`${sessions.length} ${sessions.length === 1 ? 'session' : 'sessions'}`} />
      <Card>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing on the water today.</p>
          ) : (
            <ul className="divide-y">
              {sessions.map((s) => (
                <li key={s.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="w-16 shrink-0 text-sm tabular-nums">
                    <div className="font-medium">{clock(s.startTime)}</div>
                    <div className="text-xs text-muted-foreground">–{clock(s.endTime)}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {s.courseId ? (
                        <Link href={`/admin/courses/${s.courseId}?from=dashboard`} className="hover:underline">
                          {s.courseName}
                        </Link>
                      ) : (
                        s.courseName
                      )}
                      <TypeChip code={s.shortCode} />
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {s.instructorName ?? <Unassigned />}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="flex items-center gap-1.5 text-xs tabular-nums text-muted-foreground">
                      {s.enrolled}/{s.capacity}
                      <FillBar enrolled={s.enrolled} capacity={s.capacity} />
                    </div>
                    {s.courseId && (
                      <Link
                        href={`/admin/courses/${s.courseId}/sessions/${s.id}/attendance`}
                        className="text-xs text-brand hover:underline"
                      >
                        Take attendance
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

// ─── Rest of the week ────────────────────────────────────────────────────────

export function RestOfWeek({ sessions, now }: { sessions: DashSession[]; now: Date }) {
  const grouped = new Map<string, DashSession[]>()
  for (const s of sessions) {
    const list = grouped.get(s.date) ?? []
    list.push(s)
    grouped.set(s.date, list)
  }

  return (
    <section>
      <Eyebrow label="Rest of the week" />
      <Card>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No further sessions in the next 7 days.</p>
          ) : (
            <div className="space-y-4">
              {Array.from(grouped.entries()).map(([date, items]) => (
                <div key={date}>
                  <h3 className="border-b pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {dayHeader(date, now)}
                  </h3>
                  <ul className="divide-y">
                    {items.map((s) => (
                      <li key={s.id} className="flex items-center gap-3 py-2 text-sm">
                        <span className="w-14 shrink-0 tabular-nums text-muted-foreground">{clock(s.startTime)}</span>
                        <span className="min-w-0 flex-1 truncate">
                          {s.courseId ? (
                            <Link href={`/admin/courses/${s.courseId}?from=dashboard`} className="hover:underline">
                              {s.courseName}
                            </Link>
                          ) : (
                            s.courseName
                          )}
                          <span className="text-muted-foreground"> · {s.instructorName ?? <Unassigned />}</span>
                        </span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          {s.enrolled}/{s.capacity}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

// ─── Filling now ─────────────────────────────────────────────────────────────

const RISK_LABEL: Record<FillingCourse['risk'], string> = {
  below_min: 'below minimum',
  open: 'filling',
  nearly_full: 'nearly full',
  full: 'full',
}

export function FillingNow({ courses }: { courses: FillingCourse[] }) {
  return (
    <section>
      <Eyebrow label="Filling now" />
      <Card>
        <CardContent>
          {courses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No courses starting in the next two weeks.</p>
          ) : (
            <ul className="space-y-3">
              {courses.map((c) => {
                const tone = c.risk === 'below_min' ? 'warn' : c.risk === 'full' ? 'ok' : 'brand'
                const startsIn =
                  c.daysUntilStart === 0 ? 'starts today' : c.daysUntilStart === 1 ? 'starts tomorrow' : `starts in ${c.daysUntilStart}d`
                return (
                  <li key={c.id}>
                    <Link href={`/admin/courses/${c.id}?from=dashboard`} className="group block">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="min-w-0 truncate font-medium group-hover:underline">
                          {c.name}
                          <TypeChip code={c.shortCode} />
                        </span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          {c.enrolled}/{c.capacity}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <FillBar enrolled={c.enrolled} capacity={c.capacity} tone={tone} />
                        <span className={cn('text-xs', c.risk === 'below_min' ? 'text-warning' : 'text-muted-foreground')}>
                          {startsIn} · {RISK_LABEL[c.risk]}
                          {c.waitlist > 0 && ` · ${c.waitlist} on waitlist`}
                        </span>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

// ─── Just enrolled ───────────────────────────────────────────────────────────

const CHIP: Record<JustEnrolledItem['chip'], { label: string; cls: string }> = {
  paid: { label: 'Paid', cls: 'bg-primary/10 text-primary' },
  pending: { label: 'Pending', cls: 'bg-warning/10 text-warning' },
  waitlist: { label: 'Waitlist', cls: 'bg-muted text-muted-foreground' },
}

export function JustEnrolled({ items }: { items: JustEnrolledItem[] }) {
  return (
    <section>
      <Eyebrow label="Just enrolled" />
      <Card>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent enrollments.</p>
          ) : (
            <ul className="space-y-2.5">
              {items.map((item) => {
                const chip = CHIP[item.chip]
                return (
                  <li key={item.id} className="flex items-center gap-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                      {item.initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {item.studentId ? (
                          <Link href={`/admin/students/${item.studentId}`} className="hover:underline">
                            {item.studentName}
                          </Link>
                        ) : (
                          item.studentName
                        )}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{item.courseName}</p>
                    </div>
                    <span className={cn('shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium', chip.cls)}>
                      {chip.label}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
