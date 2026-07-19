# SailBook — Brand Direction

## Name
SailBook

## Tagline
Scheduling for Learn to Sail Cleveland. Now with a public front door — SailBook is its own site, not a WordPress add-on.

## Philosophy

In practice this means:
- Experience levels use human language ("Just getting started") not jargon ("Beginner")
- Prerequisites flag, they don't block — the admin decides, not the system
- The "Anything you want your instructor to know?" field keeps it personal
- Error messages guide, they don't scold
- The app assumes nothing about what a student already knows

## Voice
Practical, clean, no-nonsense. This is a tool for running a sailing school, not a consumer app. Admin screens should feel like a well-organized dashboard. Student screens should feel simple and clear — browse, register, pay, done. Instructor screens should feel like a roster and a schedule. The public landing page is the one place the voice warms up slightly — it's selling a first sail — but it never turns into marketing froth.

## Visual Direction

> **Supersedes the original Mira/Sky/Nunito direction (DEC-018).** The old shadcn "Mira" preset (Sky theme, Nunito Sans, xs radius) was never loved and has been replaced. SailBook now shares the **Muster design language** — a calm, data-dense operator-tool aesthetic. This is deliberate: there are near-zero cross-users between the two products, so a shared, well-tuned system costs us nothing and buys consistency. SailBook's *distinct* identity lives in its **logo** (below), not in a bespoke palette. If we ever want more separation, the **accent hue** is the single knob to turn.

**Type**
- **IBM Plex Sans** — all UI text (headings + body). Clean, slightly technical, humanist.
- **IBM Plex Mono** — every numeral that carries meaning: times, dates, counts, capacities, prices, codes (`ASA101`), IDs. Mono numerals are a signature of the system — they make the data legible and the tool feel precise.

**Color** (semantic, not decorative — accent is separate from status color)

| Token | Light | Dark |
|-------|-------|------|
| Accent (harbor slate-blue) | `#2f5d86` | `#6ba3d6` |
| Page bg | `#eef2f6` | `#0d131e` |
| Surface (cards) | `#ffffff` | `#161e2c` |
| Ink (text) | `#101826` | `#e8edf3` |
| Muted / faint | `#5b6675` / `#6a7482` | `#9aa7b7` / `#8792a1` |
| Hairline | `#e3e8ee` | `#25303f` |

Status colors (each has a text, a tint-bg, and a line variant), used only to encode state — never as decoration:
- **ok** `#15803d`, **warn** `#b45309`, **bad** `#be2f2a`, **info** `#3257a8` (lightened for dark mode).

Course types get their own quiet hue for calendar/legend use (slate / teal / purple / rust / amber). These are categorical, not status.

**Form**
- **Both themes are first-class.** Light is the primary/default look (the Muster world); dark is fully supported and stored per user. Neither is an afterthought — design and check contrast in both.
- Border radius: **~12px**, consistent — never mixed.
- **Two shadow levels only:** a hairline `shadow-sm` for cards, a soft lifted shadow for modals/popovers.
- Density is a feature: tables, chips, fill bars, and compact section frames. Surface the summary before the detail; encode state in form (a pill, a fill bar, a severity stripe) as well as in number.
- No decoration for decoration's sake — every element earns its place.
- Nautical without being kitschy — **no anchors, no rope borders, no "ahoy."**
- Prioritize usability over personality. This is a tool, not a brand exercise.

**Reference:** the redesign mockup is the working reference implementation of this system (all roles + public + auth). Tokens above are drawn from it. Fonts embed as woff2 data-URIs where a CDN isn't available.

## Logo
A **geometric double-sail mark** — two overlapping triangles (a mainsail + jib) on a short waterline, in the accent color — paired with the **SailBook** wordmark. Reads instantly as "sailing" without any literal boat, anchor, or rope. This mark is SailBook's distinguishing identity within the shared design language (Muster uses a plain square mark). Works at favicon size and as the app/nav brandmark.

## Priority
Function over form — but the form is now settled and worth keeping consistent. Match the mockup: same tokens, same components, both themes.
