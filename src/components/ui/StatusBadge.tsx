import { cn } from '@/lib/utils'
import { getStatusStyle } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = getStatusStyle(status)
  
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
      style.bg,
      style.text,
      style.border,
      className
    )}>
      {status}
    </span>
  )
}

