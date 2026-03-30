'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  hasAddress: boolean
}

export function StatusBadge({ hasAddress }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs font-medium',
        hasAddress
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-muted bg-muted/50 text-muted-foreground'
      )}
    >
      {hasAddress ? 'With Address' : 'No Address'}
    </Badge>
  )
}
