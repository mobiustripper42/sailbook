import { AppShell } from '@/components/shell/app-shell'

export { roleLayoutMetadata as generateMetadata } from '@/components/shell/layout-metadata'

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="instructor">{children}</AppShell>
}
