'use client'

import { useCallback, useState } from 'react'
import { Download, ChevronDown, FileSpreadsheet, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface Contact {
  id: string
  name: string
  phone: string
  address: string
  kecamatan: string | null
  kelurahan: string | null
  kota: string | null
  provinsi: string | null
  latitude: number | null
  longitude: number | null
  fullAddress: string | null
  postcode: string | null
}

interface ExportButtonProps {
  contacts: Contact[]
}

function generateCsv(contacts: Contact[]): string {
  const headers = ['Name', 'Phone', 'Address', 'Kecamatan', 'Kelurahan', 'Kota', 'Provinsi', 'Full Address', 'Latitude', 'Longitude', 'Postcode']
  const rows = contacts.map((c) =>
    [
      c.name,
      c.phone,
      c.address,
      c.kecamatan ?? '',
      c.kelurahan ?? '',
      c.kota ?? '',
      c.provinsi ?? '',
      c.fullAddress ?? '',
      c.latitude ?? '',
      c.longitude ?? '',
      c.postcode ?? '',
    ]
      .map((field) => `"${String(field).replace(/"/g, '""')}"`)
      .join(',')
  )

  return [headers.join(','), ...rows].join('\n')
}

function downloadBlob(csvContent: string, filename: string) {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function ExportButton({ contacts }: ExportButtonProps) {
  const [isExportingAll, setIsExportingAll] = useState(false)

  const handleExportCurrent = useCallback(() => {
    if (contacts.length === 0) return
    const csvContent = generateCsv(contacts)
    downloadBlob(csvContent, `contacts-current-${new Date().toISOString().slice(0, 10)}.csv`)
  }, [contacts])

  const handleExportAll = useCallback(async () => {
    setIsExportingAll(true)
    try {
      const res = await fetch('/api/contacts/export-all')
      if (!res.ok) throw new Error('Export failed')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      // Extract filename from Content-Disposition header
      const disposition = res.headers.get('Content-Disposition')
      const match = disposition?.match(/filename="?(.+?)"?$/)
      link.download = match ? match[1] : `contacts-all-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      console.error('Failed to export all contacts')
    } finally {
      setIsExportingAll(false)
    }
  }, [])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={contacts.length === 0}
          className="gap-1.5"
        >
          <Download className="h-4 w-4" />
          Export
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportCurrent}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Current Data ({contacts.length} rows)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportAll} disabled={isExportingAll}>
          <Database className="h-4 w-4 mr-2" />
          {isExportingAll ? 'Exporting...' : 'Whole Database'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
