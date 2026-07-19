# SailBook — UI Context (design system for @ui-reviewer)

The design-system reference `@ui-reviewer` checks surfaces against (DEC-S019). Sources: `docs/BRAND.md` (authoritative tokens, philosophy, voice), `docs/design/mockups/sailbook-redesign.html` (the reference implementation — every role/screen, both themes), and the live tokens in `src/app/globals.css`. Project-owned; nothing syncs from seeds.

SailBook is a sailing-school scheduling app for Learn to Sail Cleveland. Aesthetic priorities: **clarity first, personality second. Function over form. No nautical kitsch.** The look is the **Muster design system** (DEC-039) — a calm, data-dense operator-tool aesthetic. SailBook's distinct identity is its **sail-mark logo**, not a bespoke palette.

## Active Theme

- System: **Muster** (DEC-039 / token architecture DEC-040)
- Fonts: **IBM Plex Sans** (all UI text) + **IBM Plex Mono** (all meaningful numerals)
- Border radius: **~12px** (`--radius: 0.75rem`), consistent — never mixed
- Both themes first-class (**light is the canonical look**); `.dark` via next-themes, `defaultTheme="system"`, stored per user
- **Authoritative tokens: `docs/BRAND.md`.** If BRAND and the mockup ever disagree, BRAND wins.

---

## Design System Reference

### Token architecture (DEC-040)

The Muster palette is authored in **hex** in `globals.css` as the source of truth; **shadcn tokens are thin aliases** over it. So:
- **Shipped shadcn components** (Button, Card, Input, Badge, Dialog, Sidebar…) consume shadcn token names (`bg-primary`, `text-muted-foreground`, `border-border`) and re-skin automatically.
- **New redesign components** consume the Muster utilities directly: `bg-surface`, `bg-rail`, `bg-sink`, `text-ink`, `text-faint`, `border-line`, `bg-ok-bg text-ok border-ok-line`, etc.

**Two renames vs. the mockup** (avoid CSS-property collisions — see DEC-040):

| Mockup var | Our var / utility | Meaning |
|-----------|-------------------|---------|
| `--accent` | `--brand` (`text-brand`, `bg-brand`) | expressive harbor blue — focus ring, brandmark, dots |
| `--accent-ink` | `--brand-ink` (`text-brand-ink`) | text sitting on a blue *tint* (e.g. active nav) |
| `--muted` (text) | `--muted-ink` = shadcn `--muted-foreground` (`text-muted-foreground`) | muted body/label text |

shadcn keeps `--accent` = subtle hover fill (`--sink`) and `--muted` = a background (`--rail`). Do **not** use `bg-accent` expecting brand blue — it's the hover tint.

### Color

Four surface layers, blue in four roles, two hairlines, semantic chips. Never hardcode Tailwind color classes (`bg-slate-100`, `text-gray-500`) for surfaces or text.

| Role | Token / utility | Use |
|------|-----------------|-----|
| Page bg | `bg-background` (`--bg`) | page base |
| Card surface | `bg-card` / `bg-surface` (`--surface`) | cards, popovers, sidebar |
| Sidebar/muted bg | `bg-muted` (`--rail`) | quiet backgrounds |
| Inset / hover fill | `bg-secondary` / `bg-accent` / `bg-sink` (`--sink`) | row hover, inset wells, fill-bar tracks |
| Ink (text) | `text-foreground` / `text-ink` (`--ink`) | primary text |
| Muted text | `text-muted-foreground` (`--muted-ink`) | labels, metadata, sub-rows |
| Faint text | `text-faint` (`--faint`) | table headers, placeholders, timestamps — **AA-safe** |
| Brand blue | `text-brand` / `--ring` (`--brand`) | focus ring, brandmark, dot indicators |
| Brand fill | `bg-primary` (`--accent-solid`) + `text-primary-foreground` (`--on-accent`) | primary buttons, avatars, segmented-control active |
| Hairlines | `border-border` / `border-line` (`--line`) and `--line-soft` | card borders / interior row rules |

**Semantic chips** — encode state, never decorate. Each has a text, tint-bg, and line variant: `ok` / `warn` / `bad` / `info`. Example badge: `bg-ok-bg text-ok border border-ok-line`. Active→ok, Draft→sink/muted, Completed→info, Cancelled→bad.

**Course-type hues** (`--t-asa101 / -asa103 / -open / -ding / -camp`) — categorical, for calendar/legend/type-chip use only. Not status.

**Never:** raw `text-black`/`text-white` for content; hardcoded zinc/gray/slate/neutral; color as the *sole* state indicator (pair with icon or text).

### Typography

- **UI text:** IBM Plex Sans (`font-sans`).
- **Meaningful numerals:** IBM Plex Mono (`font-mono`) — times, dates, counts, capacities, prices, codes (`ASA101`), IDs. Mono numerals are a signature of the system; apply per-surface as screens are built.
- **Scale:** ≤3 sizes per screen. Page heading `text-2xl font-semibold`; section/CardTitle `text-base font-semibold`; body/labels `text-sm`; meta `text-xs`. Nothing below `text-xs` (12px) for content.
- **Weight:** `font-semibold` headings, `font-medium`/`font-semibold` labels, default body. Table headers are uppercase `text-faint` with tracking.

### Spacing & radius

- Tailwind 4px scale; no arbitrary values (`p-[13px]`). Page padding in layout, not pages (DEC-017). `space-y-6` between major sections.
- One radius: **`rounded-lg` = ~12px** (`--radius`). shadcn components inherit it. Pills/badges use full-round (`rounded-full`); avatars ~`rounded-md`. Never a jarring mix.

### Shadows

Two levels only: `--shadow-sm` hairline for cards, `--shadow` soft-lifted for modals/popovers. No `shadow-md`, `drop-shadow`, or arbitrary shadows.

### Focus (accessibility baseline — DEC-039)

A system `:focus-visible` token lives in `globals.css`: `outline: 2px solid var(--brand); outline-offset: 2px` on every interactive element, with mouse/touch focus quiet (`*:focus:not(:focus-visible)`). Don't override with bare `outline-none`. Keyboard focus must be visible on every control including segmented controls and custom `[role]` widgets.

### Components (mockup vocabulary)

- **Card:** primary container; `--shadow-sm`, `border-line`, `bg-surface`.
- **Badge / status:** chip triads above; uppercase, `rounded-full`. Variants map to Active/Draft/Completed/Cancelled/role/inactive.
- **Filter pills:** `rounded-full`, `border-line`; pressed = `bg-foreground text-background` (`aria-pressed`).
- **Tables (`table.tbl` idiom):** `w-full text-sm`; uppercase `text-faint` headers; `--line-soft` row rules; numeric cells `font-mono` + right-aligned; hoverable rows `bg-sink`. No striping.
- **Segmented control:** `border-line` group; active segment `bg-primary text-primary-foreground`. Needs proper aria (muster#469 carry-forward).
- **Fill / capacity bars:** `--sink` track + colored fill encoding fullness.
- **Inputs:** `border-line bg-surface`, faint placeholder. Every field a real `<label for>` — not placeholder-as-label.
- **Empty states:** `<EmptyState>` component, not a raw `<p>`.

### Layout & navigation

- Sidebar `bg-surface`, `border-line` divider; `flex-1 min-w-0 bg-background` main.
- **Active nav:** blue tint — `bg-[--info-bg] text-brand-ink` (bespoke; there is no `bg-accent` shortcut for it). Inactive: `text-muted-foreground hover:bg-sink hover:text-ink`.

### Mobile (375px)

All views work at 375px; no horizontal scroll (wide tables scroll inside their own container); touch targets ≥44px; cards stack single-column, go multi-column at `sm:`/`lg:`.

---

## What to Check

1. **Tokens** — Muster/shadcn tokens in use; no hardcoded Tailwind colors; `bg-accent` not mistaken for brand blue
2. **Both themes** — light *and* dark checked; surfaces use `bg-surface`/`bg-card` (dark-aware), no `bg-white`; AA contrast both ways
3. **Typography** — Plex Sans applied; **meaningful numerals in Plex Mono**; ≤3 sizes; ≥12px; correct weights
4. **Radius** — ~12px consistent; no mixed radii
5. **Shadows** — `--shadow-sm` cards, `--shadow` overlays; nothing else
6. **Chips/status** — correct chip triad per state; state also carried by icon/label, not color alone
7. **Focus** — `:focus-visible` ring intact on every control (incl. segmented/`[role]` widgets); no bare `outline-none`
8. **Tables** — faint uppercase headers, `--line-soft` rules, mono numeric cells, no striping
9. **Forms** — real `<label for>` per field; not placeholder-as-label
10. **Empty states** — `<EmptyState>`, not raw paragraph
11. **Layout/nav** — sidebar `bg-surface`; active nav = blue tint + `text-brand-ink`; padding not doubled
12. **Mobile 375px** — no horizontal scroll; tables scroll in-container; targets ≥44px

---

## How to Review (viewports)

Take Playwright screenshots at **375px, 768px, and 1440px** in **both light and dark**, then check each item above against source + screenshots.
