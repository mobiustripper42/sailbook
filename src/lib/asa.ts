// ASA course detection (#129/#135/#153). A course counts as ASA when its
// course type's `certification_body`, trimmed and uppercased, is exactly "ASA".
// Free-text today; #147 tracks constraining it to an enum, at which point this
// stays the single source of truth for the check.
export function isAsaCertBody(certBody: string | null | undefined): boolean {
  return certBody?.trim().toUpperCase() === 'ASA'
}
