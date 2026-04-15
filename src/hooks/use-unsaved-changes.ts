'use client'

import { useEffect, useCallback, useRef } from 'react'

const MSG = 'You have unsaved changes. Leave without saving?'

/**
 * Guards against accidentally losing unsaved form edits.
 *
 * Covers three navigation paths:
 *   1. Hard navigation (browser close, tab close, external links) — beforeunload
 *   2. Next.js <Link> clicks / soft navigation — capture-phase click listener that
 *      fires before the Link's onClick and blocks router.push via stopImmediatePropagation
 *   3. Browser back/forward button — pushes a guard history entry when dirty, then
 *      intercepts the popstate event before the user leaves
 *
 * Also returns a confirmDiscard() helper for explicit Cancel buttons.
 *
 * Tradeoff: on successful save + redirect, the guard history entry stays in the
 * browser's history stack, requiring one extra Back click to clear. Acceptable
 * for the complexity saved.
 */
export function useUnsavedChanges(isDirty: boolean) {
  const guardPushedRef = useRef(false)

  useEffect(() => {
    if (!isDirty) {
      guardPushedRef.current = false
      return
    }

    // ── 1. Hard navigation ────────────────────────────────────────────────────
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    // ── 2. Next.js <Link> clicks (soft navigation) ────────────────────────────
    // Registered in capture phase so it runs before the Link component's onClick.
    // stopImmediatePropagation prevents the Link's onClick from calling router.push.
    function handleLinkClick(e: MouseEvent) {
      const anchor = (e.target as Element).closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      // Skip hash links — let beforeunload handle external links
      if (!href || href.startsWith('#') || href.startsWith('http')) return
      if (!window.confirm(MSG)) {
        e.preventDefault()
        e.stopImmediatePropagation()
      }
    }
    document.addEventListener('click', handleLinkClick, true)

    // ── 3. Browser back/forward button ────────────────────────────────────────
    // Push a guard entry so the first Back click lands here instead of leaving.
    if (!guardPushedRef.current) {
      window.history.pushState(null, '')
      guardPushedRef.current = true
    }

    function handlePopState() {
      if (!window.confirm(MSG)) {
        // Stay: re-push guard entry so future Back clicks are still intercepted
        window.history.pushState(null, '')
      } else {
        // Leave: confirmed, go back past the guard entry to the actual previous page
        guardPushedRef.current = false
        window.history.go(-1)
      }
    }
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('click', handleLinkClick, true)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [isDirty])

  const confirmDiscard = useCallback((): boolean => {
    if (!isDirty) return true
    const confirmed = window.confirm(MSG)
    if (confirmed) guardPushedRef.current = false
    return confirmed
  }, [isDirty])

  return { confirmDiscard }
}
