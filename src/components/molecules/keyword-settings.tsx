'use client'

import { useState, useEffect, useCallback } from 'react'
import { Settings2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const STORAGE_KEY = 'contact-extractor-keyword-suffix'
const DEFAULT_SUFFIX = 'KEPRI'

interface KeywordSettingsProps {
  value: string
  onChange: (value: string) => void
}

export function KeywordSettings({ value, onChange }: KeywordSettingsProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)

  // Sync with parent value
  useEffect(() => {
    setInputValue(value)
  }, [value])

  const handleSave = useCallback(() => {
    const trimmed = inputValue.trim()
    const newValue = trimmed || DEFAULT_SUFFIX
    onChange(newValue)
    localStorage.setItem(STORAGE_KEY, newValue)
    setOpen(false)
  }, [inputValue, onChange])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8" title="Search settings">
          <Settings2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="end">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold">Address Search Settings</h4>
          </div>
          <p className="text-xs text-muted-foreground">
            Set a keyword suffix to narrow down the address search to a specific region.
          </p>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="keyword-suffix" className="text-xs">
              Keyword Suffix
            </Label>
            <Input
              id="keyword-suffix"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={DEFAULT_SUFFIX}
              className="h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
              }}
            />
            <p className="text-xs text-muted-foreground">
              Search query: &quot;{inputValue || DEFAULT_SUFFIX}&quot; will be appended to trimmed addresses.
            </p>
          </div>
          <Button onClick={handleSave} size="sm" className="w-full">
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function useKeywordSuffix(): [string, (value: string) => void] {
  const [suffix, setSuffixState] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_SUFFIX
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_SUFFIX
  })

  const setSuffix = useCallback((value: string) => {
    setSuffixState(value)
  }, [])

  return [suffix, setSuffix]
}
