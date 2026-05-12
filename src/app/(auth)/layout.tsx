import { VersionTag } from "@/components/VersionTag";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center pt-16 sm:pt-0 bg-background px-4">
      <div className="flex-1 flex items-start sm:items-center w-full justify-center">
        {children}
      </div>
      <VersionTag className="py-4 text-xs text-muted-foreground" />
    </div>
  )
}
