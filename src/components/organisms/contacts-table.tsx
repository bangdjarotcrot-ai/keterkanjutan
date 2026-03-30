'use client'

import { useCallback } from 'react'
import { RefObject } from 'react'
import {
  Trash2,
  MapPin,
  RefreshCw,
  Loader2,
  Users,
  AlertTriangle,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { SearchBar } from '@/components/molecules/search-bar'
import { ExportButton, type Contact } from '@/components/molecules/export-button'
import { ContactRow } from '@/components/molecules/contact-row'
import { KeywordSettings } from '@/components/molecules/keyword-settings'
import { EmptyState } from '@/components/atoms/empty-state'

interface ContactsTableProps {
  contacts: Contact[]
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  selectedIds: Set<string>
  fetchingId: string | null
  fetchProgress: { current: number; total: number } | null
  onSelectionChange: (ids: Set<string>) => void
  onDeleteSelected: () => void
  onFetchAddress: () => void
  isFetchingAddress: boolean
  onRefresh: () => void
  onLoadMore: () => void
  total: number
  searchQuery: string
  onSearchChange: (value: string) => void
  keywordSuffix: string
  onKeywordSuffixChange: (value: string) => void
  sentinelRef: RefObject<HTMLDivElement | null>
}

export function ContactsTable({
  contacts,
  isLoading,
  isLoadingMore,
  hasMore,
  selectedIds,
  fetchingId,
  fetchProgress,
  onSelectionChange,
  onDeleteSelected,
  onFetchAddress,
  isFetchingAddress,
  onRefresh,
  onLoadMore,
  total,
  searchQuery,
  onSearchChange,
  keywordSuffix,
  onKeywordSuffixChange,
  sentinelRef,
}: ContactsTableProps) {
  const allSelected =
    contacts.length > 0 &&
    contacts.every((c) => selectedIds.has(c.id))

  const handleSelectAll = () => {
    if (allSelected) {
      const newSelected = new Set(selectedIds)
      contacts.forEach((c) => newSelected.delete(c.id))
      onSelectionChange(newSelected)
    } else {
      const newSelected = new Set(selectedIds)
      contacts.forEach((c) => newSelected.add(c.id))
      onSelectionChange(newSelected)
    }
  }

  const handleSelectOne = useCallback(
    (id: string) => {
      const newSelected = new Set(selectedIds)
      if (newSelected.has(id)) {
        newSelected.delete(id)
      } else {
        newSelected.add(id)
      }
      onSelectionChange(newSelected)
    },
    [selectedIds, onSelectionChange]
  )

  const handleDeleteOne = useCallback(
    (id: string) => {
      onSelectionChange(new Set([id]))
      onDeleteSelected()
    },
    [onSelectionChange, onDeleteSelected]
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            placeholder={`Search all ${total} contacts...`}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <KeywordSettings
            value={keywordSuffix}
            onChange={onKeywordSuffixChange}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <ExportButton contacts={contacts} />
        </div>
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-center gap-2">
            <Badge variant="default">{selectedIds.size} selected</Badge>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={onFetchAddress}
              disabled={isFetchingAddress}
            >
              {isFetchingAddress ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
              {fetchProgress
                ? `Fetching ${fetchProgress.current}/${fetchProgress.total}...`
                : 'Fetch Address Detail'}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onDeleteSelected}
              disabled={isFetchingAddress}
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected
            </Button>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            ~1 sec/contact &middot; Region: <span className="font-medium text-foreground">{keywordSuffix}</span>
          </p>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="sticky top-0 z-10 bg-background">
              <tr className="border-b">
                <th className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap w-10 [&>[role=checkbox]]:translate-y-[2px]">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    disabled={contacts.length === 0}
                  />
                </th>
                <th className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap">
                  Name
                </th>
                <th className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap">
                  Phone
                </th>
                <th className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap">
                  Address
                </th>
                <th className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap hidden lg:table-cell">
                  Kecamatan
                </th>
                <th className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap hidden lg:table-cell">
                  Kelurahan
                </th>
                <th className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap hidden md:table-cell">
                  Kota
                </th>
                <th className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap hidden md:table-cell">
                  Provinsi
                </th>
                <th className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap">
                  Status
                </th>
                <th className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap w-12">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-2">
                      <Skeleton className="h-4 w-4 rounded" />
                    </td>
                    <td className="p-2">
                      <Skeleton className="h-4 w-28 rounded" />
                    </td>
                    <td className="p-2">
                      <Skeleton className="h-4 w-24 rounded" />
                    </td>
                    <td className="p-2">
                      <Skeleton className="h-4 w-40 rounded" />
                    </td>
                    <td className="p-2 hidden lg:table-cell">
                      <Skeleton className="h-4 w-20 rounded" />
                    </td>
                    <td className="p-2 hidden lg:table-cell">
                      <Skeleton className="h-4 w-20 rounded" />
                    </td>
                    <td className="p-2 hidden md:table-cell">
                      <Skeleton className="h-4 w-16 rounded" />
                    </td>
                    <td className="p-2 hidden md:table-cell">
                      <Skeleton className="h-4 w-16 rounded" />
                    </td>
                    <td className="p-2">
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </td>
                    <td className="p-2">
                      <Skeleton className="h-8 w-8 rounded" />
                    </td>
                  </tr>
                ))
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    {searchQuery ? (
                      <EmptyState
                        icon={Search}
                        title="No matches found"
                        description={`No contacts match "${searchQuery}" in the database.`}
                      />
                    ) : (
                      <EmptyState
                        icon={Users}
                        title="No contacts yet"
                        description="Upload an image of a contact table to get started. Extracted contacts will appear here."
                      />
                    )}
                  </td>
                </tr>
              ) : (
                <>
                  {contacts.map((contact) => (
                    <ContactRow
                      key={contact.id}
                      contact={contact}
                      isSelected={selectedIds.has(contact.id)}
                      isFetching={fetchingId === contact.id}
                      onSelect={handleSelectOne}
                      onDelete={handleDeleteOne}
                    />
                  ))}

                  {/* Infinite scroll sentinel + loading more */}
                  {hasMore && (
                    <tr>
                      <td colSpan={10}>
                        <div
                          ref={sentinelRef}
                          className="flex items-center justify-center py-4"
                        >
                          {isLoadingMore ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading more...
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Scroll down to load more
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer stats */}
      {!isLoading && contacts.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>
            Showing {contacts.length} of {total} contacts
            {searchQuery && ` matching "${searchQuery}"`}
          </span>
          {selectedIds.size > 0 && (
            <span>{selectedIds.size} contact(s) selected</span>
          )}
        </div>
      )}
    </div>
  )
}
