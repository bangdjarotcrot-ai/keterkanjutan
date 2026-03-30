'use client'

import { useCallback } from 'react'
import {
  Trash2,
  MapPin,
  RefreshCw,
  Loader2,
  Users,
  AlertTriangle,
  Search,
  X,
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
import { Pagination, PageSizeSelector } from '@/components/molecules/pagination'

interface ContactsTableProps {
  contacts: Contact[]
  isLoading: boolean
  selectedIds: Set<string>
  fetchingId: string | null
  fetchProgress: { current: number; total: number; pass: number } | null
  onSelectionChange: (ids: Set<string>) => void
  onDeleteSelected: () => void
  onFetchAddress: () => void
  onCancelFetchAddress: () => void
  isFetchingAddress: boolean
  onRefresh: () => void
  total: number
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  searchQuery: string
  onSearchChange: (value: string) => void
  keywordSuffix: string
  onKeywordSuffixChange: (value: string) => void
}

export function ContactsTable({
  contacts,
  isLoading,
  selectedIds,
  fetchingId,
  fetchProgress,
  onSelectionChange,
  onDeleteSelected,
  onFetchAddress,
  onCancelFetchAddress,
  isFetchingAddress,
  onRefresh,
  total,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  searchQuery,
  onSearchChange,
  keywordSuffix,
  onKeywordSuffixChange,
}: ContactsTableProps) {
  const allSelected =
    contacts.length > 0 &&
    contacts.every((c) => selectedIds.has(c.id))

  const totalPages = Math.ceil(total / pageSize)
  const showingFrom = total === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const showingTo = Math.min(currentPage * pageSize, total)

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
                ? fetchProgress.pass === 1
                  ? `Fetching ${fetchProgress.current}/${fetchProgress.total}...`
                  : `Retrying ${fetchProgress.current}/${fetchProgress.total}...`
                : 'Fetch Address Detail'}
            </Button>
            {isFetchingAddress && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onCancelFetchAddress}
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            )}
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
          {!isFetchingAddress && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const withAddress = contacts.filter(
                    (c) => selectedIds.has(c.id) && c.kecamatan && c.kelurahan && c.kota && c.provinsi
                  )
                  if (withAddress.length === 0) return
                  const newSelected = new Set(selectedIds)
                  withAddress.forEach((c) => newSelected.delete(c.id))
                  onSelectionChange(newSelected)
                }}
                disabled={contacts.filter(
                  (c) => selectedIds.has(c.id) && c.kecamatan && c.kelurahan && c.kota && c.provinsi
                ).length === 0}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                <MapPin className="h-3 w-3" />
                Deselect with Address
              </button>
              <span className="text-muted-foreground/40">|</span>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                ~1 sec/contact &middot; Region: <span className="font-medium text-foreground">{keywordSuffix}</span>
              </p>
            </div>
          )}
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
                contacts.map((contact) => (
                  <ContactRow
                    key={contact.id}
                    contact={contact}
                    isSelected={selectedIds.has(contact.id)}
                    isFetching={fetchingId === contact.id}
                    onSelect={handleSelectOne}
                    onDelete={handleDeleteOne}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination footer */}
      {!isLoading && contacts.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1">
          <PageSizeSelector
            pageSize={pageSize}
            onPageSizeChange={onPageSizeChange}
            total={total}
          />
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Showing {showingFrom.toLocaleString()}–{showingTo.toLocaleString()} of {total.toLocaleString()}
            </span>
            {selectedIds.size > 0 && (
              <span className="text-xs text-muted-foreground">{selectedIds.size} contact(s) selected</span>
            )}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          </div>
        </div>
      )}
    </div>
  )
}
