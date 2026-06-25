# SailBook — UI Context (design system for @ui-reviewer)

The design-system reference `@ui-reviewer` checks surfaces against (DEC-S019). Sources: `docs/BRAND.md` (philosophy, voice), the Mira theme preset, and the live tokens in `app/globals.css`. Nothing here syncs from seeds — it's project-owned.

SailBook is a sailing school scheduling app for Simply Sailing. Aesthetic priorities: **clarity first, personality second. Function over form. No nautical kitsch.**

## Active Theme

- Preset: Mira (b7CSfQ4Xo)
- Font: Nunito Sans
- Base: Mist
- Accent: Sky
- Border radius: xs (`--radius: 0.125rem`)
- Default mode: Dark

---

## Design System Reference

### Color

Use shadcn CSS tokens backed by OKLCH values. Do **not** hardcode Tailwind color classes for surfaces or text.

| Token | Use |
|-------|-----|
| `bg-background` / `text-foreground` | Page base |
| `bg-card` / `text-card-foreground` | Card surfaces |
| `bg-primary` / `text-primary-foreground` | Primary actions, strong emphasis |
| `bg-secondary` / `text-secondary-foreground` | Secondary actions, chips |
| `text-muted-foreground` | Labels, metadata, supporting text |
| `bg-muted` | Muted backgrounds (empty states, disabled) |
| `bg-accent` / `text-accent-foreground` | Hover states, selected nav |
| `text-destructive` | Error states, irreversible actions |
| `border-border` | All borders |
| `ring` | Focus rings |

**Never:**
- Raw `text-black` or `text-white` (use foreground/background tokens)
- Hardcoded zinc, gray, slate, or neutral Tailwind classes for text or backgrounds
- Color as the sole state indicator (must pair with icon or text label)

**Exceptions:** Semantic amber for warnings is OK — it's a UX signal, not brand color.

### Typography

- **Font:** Nunito Sans, loaded as `--font-sans`.
- **Scale:** Max 3 font sizes per screen.
  - Page heading: `text-2xl font-semibold` (h1)
  - Section headings inside cards: `text-base font-semibold` (CardTitle)
  - Body / labels: `text-sm font-medium`
  - Meta / timestamps: `text-xs`
  - Nothing smaller than `text-xs` (12px).
- **Weight:** `font-semibold` for headings, `font-medium` for labels, default for body. Avoid `font-bold`.
- **Muted text:** `text-muted-foreground` token only.

### Spacing

- Tailwind 4px scale only. No arbitrary values (`p-[13px]`, `gap-[22px]`, etc.).
- Page padding lives in layout.tsx, not individual pages (DEC-017).
- Section spacing: `space-y-6` between major sections.

### Border Radius

One radius throughout: `rounded-xs` (`--radius: 0.125rem`). Never mixed.

**Never:** `rounded-md`, `rounded-lg`, `rounded-full` (except true circles like avatars), or zero radius overrides.

### Shadows

- Cards: shadcn Card default (shadow-sm or none, per theme).
- Modals/overlays: `shadow-lg`.
- Nothing else. No `shadow-md`, `drop-shadow`, or arbitrary shadows.

### Components

- **Card** (CardHeader, CardTitle, CardDescription, CardContent, CardFooter): primary content container.
- **Badge** variants — semantics must match:
  - `default`: confirmed, active, enrolled
  - `secondary`: pending, neutral, informational
  - `outline`: available spots, minor labels
  - `destructive`: cancelled, error, irreversible
- **Button** variants:
  - `default`: primary action (one per screen)
  - `secondary`: secondary action
  - `outline`: tertiary / back navigation
  - `ghost`: nav items, icon-only buttons
  - `destructive`: irreversible actions
- **Tables:** plain HTML `<table>` with `w-full text-sm`. `border-b` between rows, `last:border-0`. `text-muted-foreground` headers with `font-medium`. No striped rows.
- **Empty states:** `<EmptyState message="..." />` component — not raw `<p>` in the main content column.
- **Student-facing cards:** use `size="sm"` prop. Admin/instructor surfaces use the default.

### Layout & Navigation

- Two-column layout: fixed-width sidebar + `flex-1 min-w-0 bg-background` main.
- Sidebar uses `bg-sidebar` token — not `bg-white` (wrong in dark mode).
- **Active nav links:** `bg-accent text-accent-foreground`. Inactive: `text-muted-foreground hover:text-foreground`.

### Dark Mode

Dark mode is the default. Verify:
- Sidebar uses `bg-sidebar` token (dark-aware), not `bg-white`.
- Cards use `bg-card` (dark-aware), not `bg-white`.
- No hardcoded white backgrounds on any surface.
- Text contrast meets WCAG AA against dark backgrounds.
- Borders are subtle but visible (`border-border` token).

### Mobile (375px)

- All views must work at 375px.
- No horizontal scroll.
- Touch targets: minimum 44px height for interactive elements.
- Cards stack single-column on mobile (`grid-cols-1`), go multi-column at `sm:` or `lg:`.

### Visual Hierarchy

- One `<h1>` per page (`text-2xl font-semibold`).
- One primary CTA per screen. Multiple actions → one `default`, rest `secondary` or `outline`.

### Accessibility (Baseline)

- All interactive elements must have visible focus rings (shadcn manages this — don't override with bare `outline-none`).
- Color must not be the sole state indicator.
- Form fields must have visible `<label>` elements, not just placeholder text.
- Decorative icons: `aria-hidden="true"`.
- Images: meaningful `alt` text.

---

## What to Check

For each page or component under review:

1. **Color / tokens** — shadcn tokens in use; no hardcoded Tailwind color classes
2. **Dark mode** — sidebar/card backgrounds use dark-aware tokens; no `bg-white` surfaces
3. **Typography** — Nunito Sans applied; ≤3 sizes; min 12px; correct weights
4. **Spacing** — 4px scale; no arbitrary values; page padding in layout not page
5. **Border radius** — `rounded-xs` throughout; nothing else
6. **Shadows** — Card default; shadow-lg for modals; nothing else
7. **Component usage** — shadcn components used correctly; Badge/Button variants match semantics; one primary CTA
8. **Tables** — `w-full text-sm`, muted headers, row borders, no striping
9. **Empty states** — EmptyState component, not raw paragraph text
10. **Layout** — sidebar uses `bg-sidebar`; padding not doubled; main fills `flex-1`
11. **Mobile 375px** — no horizontal scroll; cards stack; touch targets ≥44px
12. **Accessibility** — focus states intact; color + icon for state; visible labels; `aria-hidden` on decorative icons

---

## How to Review (viewports)

Take Playwright screenshots at **375px, 768px, and 1440px** with **dark mode active**, then check each item above against the source and screenshots.
