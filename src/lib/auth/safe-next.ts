/**
 * Validate a `next=` redirect target so it can only point back to our own
 * origin. Returns the path if safe, null otherwise — callers pick their own
 * fallback (`/student/dashboard`, `undefined` to skip a hidden input, etc).
 *
 * Rejects:
 * - empty / null / non-string
 * - missing leading `/`
 * - protocol-relative `//evil.com/path`
 * - backslash bypass `/\evil.com` (browsers parse `\` as `/`)
 */
export function safeNextPath(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string' || raw.length === 0) return null
  if (!raw.startsWith('/')) return null
  if (raw.startsWith('//')) return null
  if (raw.startsWith('/\\')) return null
  return raw
}
