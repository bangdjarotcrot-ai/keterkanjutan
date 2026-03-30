'use client'

import { Trash2, Loader2 } from 'lucide-react'
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

      {/* Phone */}
      <td className="p-2 align-middle whitespace-nowrap text-muted-foreground">
        {contact.phone}
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
