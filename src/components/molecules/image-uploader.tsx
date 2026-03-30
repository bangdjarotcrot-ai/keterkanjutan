'use client'

import { useCallback, useRef, useState } from 'react'
import { ImagePlus, Loader2, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface ExtractionProgress {
  current: number
  total: number
  contactsFound: number
  isComplete: boolean
}

interface ImageUploaderProps {
  onImagesSelect: (images: string[]) => void
  imagePreviews: string[]
  isExtracting: boolean
  extractionProgress: ExtractionProgress | null
  onExtract: () => void
  onClear: () => void
}

export function ImageUploader({
  onImagesSelect,
  imagePreviews,
  isExtracting,
  extractionProgress,
  onExtract,
  onClear,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const readFileAsBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Not an image file'))
        return
      }
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }, [])

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'))
      if (fileArray.length === 0) return

      const base64Results = await Promise.all(fileArray.map(readFileAsBase64))
      onImagesSelect(base64Results)
    },
    [readFileAsBase64, onImagesSelect]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragOver(false)
      if (e.dataTransfer.files?.length) {
        handleFiles(e.dataTransfer.files)
      }
    },
    [handleFiles]
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        handleFiles(e.target.files)
      }
    },
    [handleFiles]
  )

  const handleClick = useCallback(() => {
    if (!isExtracting) {
      fileInputRef.current?.click()
    }
  }, [isExtracting])

  // Extraction in progress — show progress overlay
  if (isExtracting && extractionProgress) {
    const { current, total, contactsFound, isComplete } = extractionProgress
    const percent = Math.round((current / total) * 100)

    return (
      <div className="flex flex-col items-center gap-5 py-4">
        <div className="w-full max-w-md rounded-lg border bg-card p-6 flex flex-col items-center gap-4">
          {isComplete ? (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">
                  Extraction Complete!
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {total} image(s) processed &middot; {contactsFound} contact(s) found
                </p>
              </div>
              <Button onClick={onClear} className="w-full" variant="outline">
                Upload More Images
              </Button>
            </>
          ) : (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Loader2 className="h-7 w-7 text-primary animate-spin" />
              </div>
              <div className="w-full space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    Processing image {current} of {total}
                  </span>
                  <span className="text-muted-foreground">{percent}%</span>
                </div>
                <Progress value={percent} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  {contactsFound} contact(s) extracted so far
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  Please wait patiently and don&apos;t close this tab. Processing takes
                  ~5 seconds between each image.
                </span>
              </div>
            </>
          )}
        </div>

        {/* Thumbnail grid with current highlighted */}
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 w-full max-w-md">
          {imagePreviews.map((src, i) => (
            <div
              key={i}
              className={cn(
                'relative aspect-square rounded-md overflow-hidden border-2 transition-all',
                i < current
                  ? 'border-emerald-400 opacity-60'
                  : i === current - 1
                    ? 'border-primary ring-2 ring-primary/30'
                    : 'border-muted-foreground/20 opacity-40'
              )}
            >
              <img
                src={src}
                alt={`Image ${i + 1}`}
                className="w-full h-full object-cover"
              />
              {i < current && (
                <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/20">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Image previews selected (before extraction)
  if (imagePreviews.length > 0) {
    return (
      <div className="relative flex flex-col items-center gap-4">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 w-full max-w-lg">
          {imagePreviews.map((src, i) => (
            <div
              key={i}
              className="relative aspect-[4/3] rounded-lg overflow-hidden border bg-muted/30"
            >
              <img
                src={src}
                alt={`Image ${i + 1}`}
                className="w-full h-full object-contain"
              />
              {!isExtracting && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    const updated = imagePreviews.filter((_, idx) => idx !== i)
                    if (updated.length === 0) {
                      onClear()
                    } else {
                      onImagesSelect(updated)
                    }
                  }}
                  className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background shadow-sm flex items-center justify-center transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          {imagePreviews.length} image(s) selected
        </p>
        <div className="flex gap-2 w-full max-w-md">
          <Button
            onClick={onClear}
            variant="outline"
            className="flex-1"
            disabled={isExtracting}
          >
            Clear
          </Button>
          <Button
            onClick={onExtract}
            disabled={isExtracting}
            className="flex-1"
            size="lg"
          >
            <ImagePlus className="h-4 w-4 mr-2" />
            Extract Contacts
          </Button>
        </div>
      </div>
    )
  }

  // Empty dropzone
  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 transition-colors cursor-pointer',
        isDragOver
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/80">
        <ImagePlus className="h-7 w-7 text-muted-foreground" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">
          Drop your table image(s) here, or{' '}
          <span className="text-primary underline underline-offset-2">
            browse
          </span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Supports PNG, JPG, WEBP &middot; Select multiple images at once
        </p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  )
}
