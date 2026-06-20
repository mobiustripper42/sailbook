# Tiller handoff — Weather go/no-go: bring the upstream signal into SailBook

**Pitched:** 2026-06-20 · **Project:** SailBook (v2.0.0) · **Status:** draft, Eric is the gate

---

## The idea

SailBook spent an entire phase building the cancellation → makeup machinery — `cancel_reason`,
`session_attendance` status transitions, `makeup_session_id`, the cancellation/makeup
notification triggers. That whole subsystem exists to absorb **one** event: a session getting
weather-cancelled. AS-7 names it outright ("I cancel a specific session (weather day)…"), the QA
script uses "weather" as the canonical cancel reason — and yet **weather appears nowhere in the
product as a signal.** It's treated as exogenous noise that Andy watches for himself and reacts to,
usually at 7am on the dock.

**Weather go/no-go** brings the upstream signal into the two surfaces that already exist:

1. **Admin session view** — a forecast badge on each upcoming session (next ~48h), fetched at
   render. Wind, gusts, precip, a one-word call. Andy sees "Sat 9am — 18kt gusts, rain" on
   *Thursday*, when he still has options, not Saturday morning.
2. **Student `tomorrow` reminder** — the day-before reminder (which already fires via cron) gets a
   forecast line, so students self-select. A 4kt drifter day and a small-craft-advisory day read
   very differently to a nervous ASA 101 student.

Optional second step (separate, gated): a nightly `weather-watch` cron that flags sessions crossing
configured wind/precip thresholds with a `weather_advisory` enum, so the admin dashboard shows
amber/red badges without anyone refreshing a forecast by hand.

The forecast comes from **Open-Meteo** — free, no API key, no account. The school sails from **one
marina**, so there is no geocoding problem: a single configured lat/long covers every session.

## Why it's worth it — and why now

- **It closes a named gap on the highest-pain decision Andy makes.** Weather is *the* reason
  sessions die, and right now the response is fully manual and reactive. Moving the decision 24–48h
  earlier turns a scramble into a choice.
- **It's a forcing function for the system you already built.** The makeup machinery is downstream
  plumbing for an event you currently treat as a surprise. Feed the forecast in and the plumbing
  gets to fire *proactively* — cancel Thursday, the waitlist/makeup notifications you already wrote
  go out Thursday, students reschedule before they've mentally written off the weekend. Every
  late cancellation is attrition and refund risk; speed of response is the moat.
- **Now, because it's nearly free to build.** No API key, no new service, no geocoding, no new
  table for the core. It piggybacks on the existing cron + notifications layer. The "hard part"
  (per-session weather infra) was imagined; at one-marina scale it collapses to one fetch wrapper
  and one env var.

## Why you haven't already

SailBook was conceived as a **scheduling / enrollment / payments** app — a back-office CRM/ERP
shape. Weather lives in a *different mental category* (a marine-ops tool, a weather app), so it
never crossed into the SPEC — not even the "Not V2" list mentions it. You built elaborate machinery
to clean up after weather while never letting weather into the building. That's the blind spot: the
thing your whole makeup subsystem is *for* was never modeled as an input. The reframe that makes it
cheap — one marina ⇒ one lat/long ⇒ Open-Meteo with no key ⇒ two existing surfaces to wire — only
becomes obvious once you stop picturing "weather integration" as its own product.

---

## Build handoff

### Approach

Three layers, smallest-first. Ship 1+2; treat 3 as a follow-up task.

- **Layer 0 — `src/lib/weather.ts`.** One wrapper around Open-Meteo. Everything else calls it.
- **Layer 1 — admin forecast badge.** Fetch at render in the admin session view. No persistence;
  a forecast is stale the moment it's stored, so there's nothing worth keeping for the live view.
- **Layer 2 — forecast line in the `tomorrow` student reminder.** Add to `notifyUpcomingSessionReminders`,
  **1-day-out slot only** (a 7-day forecast is noise; don't send it).
- **Layer 3 (follow-up, gated) — `weather-watch` cron + `weather_advisory` column.** Nightly
  threshold flag for amber/red dashboard badges. One migration, one cron route mirroring the
  existing three.

**Key decisions, with reasoning:**

- **Single configured location, not per-session geocoding.** `sessions.location` is free-text
  varchar. The school sails from one marina. Add `WEATHER_LAT` / `WEATHER_LNG` env vars (document
  the assumption in `DECISIONS.md` as a new DEC). Per-session geocoding adds an API, a call per
  session, cost, and failure surface to compute the same lat/long every time. If a second sail
  location ever appears, *that's* the moment for a `locations` table FK'd from sessions — a known,
  bounded refactor, not a landmine. Not now.
- **Open-Meteo, no key.** `https://api.open-meteo.com/v1/forecast` with `windspeed_unit=kn`,
  `hourly=wind_speed_10m,wind_gusts_10m,precipitation,precipitation_probability`, and
  `start_date`/`end_date` = the session date. Pick the hour matching `start_time`. Free, no auth,
  generous rate limits — fine for one school. (Lake-specific wave data via Open-Meteo's Marine API
  is unreliable on the Great Lakes; **wind + gusts + precip is the load-bearing signal** for a
  sailing school. Don't chase wave height.)
- **Fetch-at-render for the live badge, not a table.** Stale data has negative value here.
- **Forecast is advisory, never automatic.** No auto-cancel. Andy decides; the product informs.
  This is the line the Skeptic drew and it's correct — an AI/threshold system that cancels classes
  on its own erodes trust the first time it's wrong about a 12kt afternoon that cleaned up by 9am.

### File-by-file

**Layer 0**
- `src/lib/weather.ts` (new) — export `getSessionForecast({ dateISO, startTime }): Promise<Forecast | null>`
  returning `{ windKnots: number; gustKnots: number; precipMm: number; precipChance: number; summary: string; call: 'go' | 'marginal' | 'nogo' }`.
  `call` derived from configurable thresholds (defaults: `nogo` ≥ 22kt sustained OR ≥ 28kt gust OR
  ≥ 80% precip; `marginal` ≥ 15kt OR ≥ 20kt gust OR ≥ 50% precip; else `go`). Read lat/long from
  `process.env.WEATHER_LAT/LNG`; if unset, return `null` (feature degrades to invisible, never throws).
  Wrap the fetch in a try/catch → `null` on any failure. Add a short in-memory cache keyed by
  `dateISO|startTime` (the admin list re-renders; don't hammer the API).
- `.env.example` — add `WEATHER_LAT=`, `WEATHER_LNG=`, optional threshold overrides.

**Layer 1 — admin badge**
- Find the admin upcoming-sessions view (admin course detail / sessions list — the Server Component
  that renders `SessionRow`). Call `getSessionForecast` for sessions within the next 48h (skip past
  and far-future), render a small badge next to the date. `go`/`marginal`/`nogo` → use the Mira
  theme tokens, **no raw red** beyond the existing destructive token usage; lean on icon + label so
  it's not color-only (a11y). `null` forecast → render nothing.
- New component `src/components/admin/session-forecast-badge.tsx`.

**Layer 2 — student reminder line**
- `src/lib/notifications/templates.ts` — add optional `forecast?: string` to `SessionReminderData`;
  in `sessionReminder`, when present, append one line to `smsBody` ("Forecast: ~8kt, clear") and a
  row to `emailText`/`emailHtml`. Keep SMS short — it's the expensive channel.
- `src/lib/notifications/triggers.ts` — in `notifyUpcomingSessionReminders`, **only for the
  `daysOut === 1` slot**, call `getSessionForecast` once per session (not per student) and pass the
  rendered string into `sessionReminder`. Reuse the existing `Promise.all` batching.

**Layer 3 — threshold cron (follow-up)**
- Migration: `ALTER TABLE sessions ADD COLUMN weather_advisory text` (enum-style check:
  `none|watch|warning`, default `none`). RLS already covers `sessions`; confirm no policy change
  needed for the column (it inherits row policies). Add a pgTAP assertion if you touch policies.
- `src/lib/notifications/triggers.ts` or new `src/lib/weather-watch.ts` — `runWeatherWatch()`:
  scan scheduled sessions in next 48h, fetch forecast, set `weather_advisory` from thresholds.
- `src/app/api/cron/weather-watch/route.ts` (new) — mirror `low-enrollment/route.ts` exactly:
  `verifyCron(req)` guard, call the function, return JSON count.
- `vercel.json` — add `{ "path": "/api/cron/weather-watch", "schedule": "0 11 * * *" }`
  (morning UTC, before the 14:00 reminder cron so badges are fresh).
- Admin badge reads `weather_advisory` for amber/red without a live fetch.

### Gotchas / risks

- **Location assumption is the only real mess vector.** If the school ever sails from multiple
  marinas, `WEATHER_LAT` is silently wrong for the others. Document the single-location assumption
  in `DECISIONS.md` so future-you knows the trip-wire. Bounded refactor, not a surprise.
- **Don't forecast 7 days out.** Open-Meteo will happily return a number; it's noise at that range
  and sending it trains students to ignore the line. 1-day-out only.
- **Fail invisible, never loud.** Every weather call path returns `null`/no-op on error or missing
  env. A flaky forecast API must never break the admin sessions page or block a reminder send. The
  existing notification triggers already swallow-and-log; match that contract.
- **Don't auto-cancel.** Advisory only. The threshold cron *flags*; the human *decides*.
- **One fetch per session, not per student** in the reminder loop, or you'll multiply API calls by
  roster size for identical data.
- **Timezone.** Session `date`/`start_time` are local; Open-Meteo wants the date + an hour index.
  Reuse the existing UTC-safe date handling pattern (`isoDateOffset`) rather than `new Date()` slop.
- **a11y / brand.** BRAND.md forbids decorative color and color-only signals; the badge must carry
  an icon + text label, use theme tokens, and pass the 375px viewport.

### Done when

- `getSessionForecast` returns a structured forecast for a real Lake Erie lat/long and `null` when
  env is unset or the API errors (unit-testable with a mocked fetch).
- Admin sessions list shows a forecast badge for sessions in the next 48h; nothing for past/far/
  unconfigured. Passes 375/768/1440 Playwright viewports + the @ui-reviewer check.
- The `tomorrow` student reminder includes a forecast line in SMS + email; the 1-week reminder does
  **not**. Covered by a notifications test (mock the weather wrapper, assert the line appears only
  for the 1-day slot).
- (Layer 3) `npx playwright`/pgTAP green; `weather-watch` cron sets `weather_advisory` on a session
  that crosses threshold in a seeded fixture; `verifyCron` rejects an unauthenticated hit.
- New DEC entry in `DECISIONS.md` recording the single-location + advisory-not-automatic decisions.

### Kickoff

> Read `docs/tiller/2026-06-20-weather-go-no-go.md`. Let's build Layer 0 + Layer 1 + Layer 2
> (weather wrapper, admin forecast badge, forecast line in the 1-day student reminder) as one task.
> Single marina via `WEATHER_LAT`/`WEATHER_LNG`, Open-Meteo no-key, fetch-at-render for the badge,
> advisory-only — no auto-cancel. Start by confirming the marina lat/long and the admin sessions
> Server Component that renders the session list, then plan the files before writing. Layer 3
> (threshold cron + `weather_advisory` column) is a follow-up task, not this one.
