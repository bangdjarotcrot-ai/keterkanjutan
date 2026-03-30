'use client'

import { Badge } from '@/components/ui/badge'
import { ImageUploader } from '@/components/molecules/image-uploader'

export interface ExtractionProgress {
  current: number
  total: number
  contactsFound: number
  isComplete: boolean
}

interface UploadSectionProps {
  imagePreviews: string[]
  isExtracting: boolean
  extractionProgress: ExtractionProgress | null
  onImagesSelect: (images: string[]) => void
  onExtract: () => void
  onClear: () => void
  totalContacts: number
}

export function UploadSection({
  imagePreviews,
  isExtracting,
  extractionProgress,
  onImagesSelect,
  onExtract,
  onClear,
  totalContacts,
}: UploadSectionProps) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        {totalContacts > 0 && (
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {totalContacts} contacts saved
          </Badge>
        )}
      </div>
      <ImageUploader
        onImagesSelect={onImagesSelect}
        imagePreviews={imagePreviews}
        isExtracting={isExtracting}
        extractionProgress={extractionProgress}
        onExtract={onExtract}
        onClear={onClear}
      />
    </div>
  )
}
