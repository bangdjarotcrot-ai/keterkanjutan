'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1.5">
            <CardTitle className="text-lg">Upload Contact Table Images</CardTitle>
            <CardDescription>
              Upload image(s) of contact tables to extract names, phone numbers, and addresses
            </CardDescription>
          </div>
          {totalContacts > 0 && (
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {totalContacts} contacts
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ImageUploader
          onImagesSelect={onImagesSelect}
          imagePreviews={imagePreviews}
          isExtracting={isExtracting}
          extractionProgress={extractionProgress}
          onExtract={onExtract}
          onClear={onClear}
        />
      </CardContent>
    </Card>
  )
}
