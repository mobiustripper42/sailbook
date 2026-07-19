import { test, expect } from '@playwright/test'

// Foundation smoke for the Muster design system (DEC-039 / token architecture
// DEC-040). Runs against /login (unauthenticated, follows system theme = light
// in a headless browser); dark is exercised via localStorage like theme.spec.ts.
// Asserts the token *foundation*, not any specific screen's styling.
test.describe('Design system foundation (Muster / DEC-040)', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('body renders in IBM Plex Sans', async ({ page }) => {
    await page.goto('/login')
    const family = await page.evaluate(() => getComputedStyle(document.body).fontFamily)
    expect(family).toContain('IBM Plex Sans')
  })

  test('IBM Plex Mono is wired as --font-mono', async ({ page }) => {
    await page.goto('/login')
    const mono = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--font-mono'),
    )
    expect(mono).toContain('IBM Plex Mono')
  })

  test('keyboard focus shows the system :focus-visible ring (2px solid)', async ({ page }) => {
    await page.goto('/login')
    // A bare button (no shadcn focus styling) so we observe the baseline token,
    // not a component's own ring. Prepend it so it's the first tab stop.
    await page.evaluate(() => {
      const b = document.createElement('button')
      b.id = '__fv'
      b.textContent = 'fv'
      document.body.prepend(b)
    })
    await page.keyboard.press('Tab')
    const focus = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null
      if (!el || el.id !== '__fv') return { id: el?.id ?? null }
      const s = getComputedStyle(el)
      return { id: el.id, width: s.outlineWidth, style: s.outlineStyle }
    })
    expect(focus.id).toBe('__fv')
    expect(focus.style).toBe('solid')
    expect(focus.width).toBe('2px')
  })

  test('light and dark resolve distinct page backgrounds', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('html')).not.toHaveClass(/dark/)
    const light = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--bg').trim().toLowerCase(),
    )

    await page.evaluate(() => localStorage.setItem('theme', 'dark'))
    await page.reload()
    await expect(page.locator('html')).toHaveClass(/dark/)
    const dark = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--bg').trim().toLowerCase(),
    )

    expect(light).toBe('#eef2f6')
    expect(dark).toBe('#0d131e')
  })

  test('faint text and primary-button text meet WCAG AA in both themes', async ({ page }) => {
    const contrast = () =>
      page.evaluate(() => {
        const cs = getComputedStyle(document.documentElement)
        const v = (n: string) => cs.getPropertyValue(n).trim()
        const lin = (c: number) => {
          const s = c / 255
          return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
        }
        const lum = (hex: string) => {
          let h = hex.replace('#', '').trim()
          // CSS minification can collapse #ffffff -> #fff; expand shorthand.
          if (h.length === 3) h = h.split('').map((c) => c + c).join('')
          const r = parseInt(h.slice(0, 2), 16)
          const g = parseInt(h.slice(2, 4), 16)
          const b = parseInt(h.slice(4, 6), 16)
          return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
        }
        const ratio = (a: string, b: string) => {
          const l1 = lum(a)
          const l2 = lum(b)
          return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
        }
        // faint is used on surfaces (table headers, placeholders, sub-labels);
        // on-accent (button/label text) sits on accent-solid fills.
        return {
          faintOnSurface: ratio(v('--faint'), v('--surface')),
          onAccent: ratio(v('--on-accent'), v('--accent-solid')),
        }
      })

    await page.goto('/login')
    const light = await contrast()
    expect(light.faintOnSurface).toBeGreaterThanOrEqual(4.5)
    expect(light.onAccent).toBeGreaterThanOrEqual(4.5)

    await page.evaluate(() => localStorage.setItem('theme', 'dark'))
    await page.reload()
    const dark = await contrast()
    expect(dark.faintOnSurface).toBeGreaterThanOrEqual(4.5)
    expect(dark.onAccent).toBeGreaterThanOrEqual(4.5)
  })
})
