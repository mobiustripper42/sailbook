export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex items-start justify-center pt-16 sm:items-center sm:pt-0 bg-background px-4">
      {children}
    </div>
  )
}
