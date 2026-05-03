import { TableHead } from '@/components/ui/table'
import { cn } from '@/lib/utils'

type SortDir = 'asc' | 'desc'

export function SortableHead<T extends string>({
  label,
  sortKey,
  activeKey,
  dir,
  onClick,
  className,
}: {
  label: string
  sortKey: T
  activeKey: T
  dir: SortDir
  onClick: (key: T) => void
  className?: string
}) {
  const isActive = sortKey === activeKey
  return (
    <TableHead className={className} aria-sort={isActive ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        onClick={() => onClick(sortKey)}
        className="inline-flex items-center gap-1 text-left hover:text-foreground"
      >
        {label}
        <span className={cn('text-xs', isActive ? 'text-foreground' : 'text-muted-foreground/40')}>
          {isActive ? (dir === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </button>
    </TableHead>
  )
}
