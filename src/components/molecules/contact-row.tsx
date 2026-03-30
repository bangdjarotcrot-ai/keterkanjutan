'use client'

import { Trash2, Loader2 } from 'lucide-react'
import { ExternalLink } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/atoms/status-badge'
import type { Contact } from '@/components/molecules/export-button'
import { cn } from '@/lib/utils'

interface ContactRowProps {
  contact: Contact
  isSelected: boolean
  isFetching?: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

export function ContactRow({ contact, isSelected, isFetching, onSelect, onDelete }: ContactRowProps) {
  const hasAddress =
    contact.kecamatan || contact.kelurahan || contact.kota || contact.provinsi

  const truncatedAddress =
    contact.address.length > 40 ? contact.address.slice(0, 40) + '...' : contact.address

  // Normalize phone: ensure it starts with country code
  const getWhatsAppLink = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    let normalized: string
    if (cleaned.startsWith('62')) {
      normalized = cleaned
    } else if (cleaned.startsWith('8')) {
      normalized = '62' + cleaned
    } else {
      normalized = cleaned
    }
    return `https://wa.me/${normalized}`
  }

  const waLink = contact.phone ? getWhatsAppLink(contact.phone) : null

  return (
    <tr
      className={cn(
        'border-b transition-colors hover:bg-muted/50',
        isFetching && 'bg-primary/5'
      )}
    >
      {/* Checkbox */}
      <td className="p-2 align-middle whitespace-nowrap [&>[role=checkbox]]:translate-y-[2px]">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(contact.id)}
          disabled={isFetching}
        />
      </td>

      {/* Name */}
      <td className="p-2 align-middle whitespace-nowrap font-medium">
        {isFetching ? (
          <span className="flex items-center gap-1.5 text-primary">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {contact.name}
          </span>
        ) : (
          contact.name
        )}
      </td>

      {/* Phone + WhatsApp */}
      <td className="p-2 align-middle whitespace-nowrap">
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">{contact.phone}</span>
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-6 w-6 rounded-md text-green-600 hover:text-green-700 hover:bg-green-50 transition-colors"
              title={`Chat on WhatsApp: ${contact.phone}`}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
          )}
        </div>
      </td>

      {/* Address */}
      <td className="p-2 align-middle whitespace-nowrap max-w-[200px]">
        <span title={contact.address} className="text-muted-foreground">
          {truncatedAddress}
        </span>
      </td>

      {/* Kecamatan */}
      <td className="p-2 align-middle whitespace-nowrap text-muted-foreground hidden lg:table-cell">
        {isFetching ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
        ) : (
          contact.kecamatan ?? '-'
        )}
      </td>

      {/* Kelurahan */}
      <td className="p-2 align-middle whitespace-nowrap text-muted-foreground hidden lg:table-cell">
        {isFetching ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
        ) : (
          contact.kelurahan ?? '-'
        )}
      </td>

      {/* Kota */}
      <td className="p-2 align-middle whitespace-nowrap text-muted-foreground hidden md:table-cell">
        {isFetching ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
        ) : (
          contact.kota ?? '-'
        )}
      </td>

      {/* Provinsi */}
      <td className="p-2 align-middle whitespace-nowrap text-muted-foreground hidden md:table-cell">
        {isFetching ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
        ) : (
          contact.provinsi ?? '-'
        )}
      </td>

      {/* Status */}
      <td className="p-2 align-middle whitespace-nowrap">
        {isFetching ? (
          <span className="inline-flex items-center gap-1 text-xs text-primary font-medium">
            <Loader2 className="h-3 w-3 animate-spin" />
            Fetching
          </span>
        ) : (
          <StatusBadge hasAddress={!!hasAddress} />
        )}
      </td>

      {/* Actions */}
      <td className="p-2 align-middle whitespace-nowrap">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(contact.id)}
          disabled={isFetching}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  )
}
