'use client'

import { RefreshCw, Maximize2, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface MapControlsProps {
  totalPins: number
  onFitBounds: () => void
  onRefresh: () => void
  isLoading: boolean
}

export function MapControls({ totalPins, onFitBounds, onRefresh, isLoading }: MapControlsProps) {
  return (
    <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2">
      <Badge variant="secondary" className="bg-background shadow-md text-xs">
        <MapPin className="h-3 w-3 mr-1" />
        {totalPins} contact{totalPins !== 1 ? 's' : ''}
      </Badge>
      <Button
        variant="secondary"
        size="icon"
        className="h-8 w-8 shadow-md bg-background hover:bg-accent"
        onClick={onFitBounds}
        title="Fit all markers"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
      <Button
        variant="secondary"
        size="icon"
        className="h-8 w-8 shadow-md bg-background hover:bg-accent"
        onClick={onRefresh}
        disabled={isLoading}
        title="Refresh map data"
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  )
}
