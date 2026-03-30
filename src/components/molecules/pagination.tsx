'use client'

import { useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

// Generate visible page numbers with ellipsis
function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | 'ellipsis')[] = []

  // Always show first page
  pages.push(1)

  if (current > 3) {
    pages.push('ellipsis')
  }

  // Pages around current
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (current < total - 2) {
    pages.push('ellipsis')
  }

  // Always show last page
  if (total > 1) {
    pages.push(total)
  }

  return pages
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const [jumpValue, setJumpValue] = useState('')
  const pages = getPageNumbers(currentPage, totalPages)

  const handleJump = useCallback(() => {
    const page = parseInt(jumpValue)
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page)
      setJumpValue('')
    }
  }, [jumpValue, totalPages, onPageChange])

  if (totalPages <= 1) return null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
      {/* Page buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          title="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          title="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-0.5">
          {pages.map((page, i) =>
            page === 'ellipsis' ? (
              <span key={`e${i}`} className="px-1 text-muted-foreground text-sm select-none">
                ...
              </span>
            ) : (
              <Button
                key={page}
                variant={page === currentPage ? 'default' : 'outline'}
                size="icon"
                className="h-8 w-8 text-xs"
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            )
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          title="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          title="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Jump to page */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Go to</span>
        <Input
          type="number"
          min={1}
          max={totalPages}
          value={jumpValue}
          onChange={(e) => setJumpValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleJump()
          }}
          className="h-8 w-20 text-center text-sm"
          placeholder="Page"
        />
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={handleJump}
          disabled={!jumpValue}
        >
          Go
        </Button>
      </div>
    </div>
  )
}

interface PageSizeSelectorProps {
  pageSize: number
  onPageSizeChange: (size: number) => void
  total: number
  options?: number[]
}

export function PageSizeSelector({
  pageSize,
  onPageSizeChange,
  total,
  options = [25, 50, 100, 250, 500, 1000],
}: PageSizeSelectorProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>Show</span>
      <select
        value={pageSize}
        onChange={(e) => onPageSizeChange(Number(e.target.value))}
        className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {options.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
      <span>of {total.toLocaleString()}</span>
    </div>
  )
}
