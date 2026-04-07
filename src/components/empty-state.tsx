export function EmptyState({
  message,
  action,
}: {
  message: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
      <p className="text-sm text-muted-foreground">{message}</p>
      {action}
    </div>
  )
}
