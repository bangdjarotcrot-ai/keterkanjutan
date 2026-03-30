'use client'

import { useCallback } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  label?: string
}

export function ExportButton({ contacts, label = 'Export CSV' }: ExportButtonProps) {
  const handleExport = useCallback(() => {
    if (contacts.length === 0) return

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

    const csvContent = [headers.join(','), ...rows].join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'contacts-export.csv'
    link.click()
    URL.revokeObjectURL(url)
  }, [contacts])

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={contacts.length === 0}
    >
      <Download className="h-4 w-4" />
      {label}
    </Button>
  )
}
