import Link from 'next/link'

export default function RoleToggle({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block text-xs text-muted-foreground hover:text-foreground mt-1 mb-0.5"
    >
      {label}
    </Link>
  )
}
