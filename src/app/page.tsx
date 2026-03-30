'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Contact as ContactIcon, ChevronDown, ImagePlus, MapPinned } from 'lucide-react'
import Image from 'next/image'
import { UploadSection, type ExtractionProgress } from '@/components/organisms/upload-section'
import { ContactsTable } from '@/components/organisms/contacts-table'
import dynamic from 'next/dynamic'

const MapView = dynamic(() => import('@/components/organisms/map-view').then((m) => m.MapView), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[500px] rounded-lg border bg-muted/30">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    </div>
  ),
})
import { useToast } from '@/hooks/use-toast'
import { useDebounce } from '@/hooks/use-debounce'
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'
import type { Contact } from '@/components/molecules/export-button'
import { useKeywordSuffix } from '@/components/molecules/keyword-settings'

const PAGE_SIZE = 50

export default function Home() {
  const { toast } = useToast()

  // Upload & extraction state
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionProgress, setExtractionProgress] = useState<ExtractionProgress | null>(null)
  const [isUploadVisible, setIsUploadVisible] = useState(false)

  // Contacts state (infinite scroll)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [isLoadingContacts, setIsLoadingContacts] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Search (server-side with debounce)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Address fetching state (frontend-driven)
  const [isFetchingAddress, setIsFetchingAddress] = useState(false)
  const [fetchingId, setFetchingId] = useState<string | null>(null)
  const [fetchProgress, setFetchProgress] = useState<{ current: number; total: number } | null>(null)

  // Keyword suffix for address search
  const [keywordSuffix, setKeywordSuffix] = useKeywordSuffix()

  // Abort ref for extraction
  const abortRef = useRef(false)

  // Fetch contacts (first page or new search)
  const fetchContacts = useCallback(async (search?: string) => {
    const query = search !== undefined ? search : debouncedSearch
    setIsLoadingContacts(true)

    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE) })
      if (query.trim()) params.set('search', query.trim())

      const res = await fetch(`/api/contacts?${params}`)
      const data = await res.json()

      if (data.success) {
        setContacts(data.contacts)
        setTotal(data.total)
        setHasMore(data.hasMore)
        setNextCursor(data.nextCursor)
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error)
    } finally {
      setIsLoadingContacts(false)
    }
  }, [debouncedSearch])

  // Load more contacts (infinite scroll)
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !nextCursor) return
    setIsLoadingMore(true)

    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        cursor: nextCursor,
      })
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim())

      const res = await fetch(`/api/contacts?${params}`)
      const data = await res.json()

      if (data.success) {
        setContacts((prev) => [...prev, ...data.contacts])
        setHasMore(data.hasMore)
        setNextCursor(data.nextCursor)
        setTotal(data.total)
      }
    } catch (error) {
      console.error('Failed to load more contacts:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, hasMore, nextCursor, debouncedSearch])

  // Infinite scroll observer
  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    isLoading: isLoadingMore,
  })

  // Initial load
  useEffect(() => {
    fetchContacts()
  }, [])

  // Re-fetch when debounced search changes
  useEffect(() => {
    fetchContacts(debouncedSearch)
  }, [debouncedSearch, fetchContacts])

  // Handle search change (immediate UI update, debounced API call)
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    setSelectedIds(new Set())
  }, [])

  // Handle multiple image selection
  const handleImagesSelect = useCallback((images: string[]) => {
    setImagePreviews(images)
    setExtractionProgress(null)
  }, [])

  // Handle clear
  const handleClear = useCallback(() => {
    setImagePreviews([])
    setExtractionProgress(null)
  }, [])

  // Delay helper
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  // Handle sequential extraction
  const handleExtract = useCallback(async () => {
    if (imagePreviews.length === 0) return

    setIsExtracting(true)
    abortRef.current = false

    const totalImages = imagePreviews.length
    let totalContactsFound = 0

    for (let i = 0; i < totalImages; i++) {
      if (abortRef.current) break

      setExtractionProgress({
        current: i + 1,
        total: totalImages,
        contactsFound: totalContactsFound,
        isComplete: false,
      })

      try {
        const res = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: imagePreviews[i] }),
        })
        const data = await res.json()

        if (data.success) {
          totalContactsFound += data.count
          // Refresh contacts to show new data
          await fetchContacts(debouncedSearch)
        } else {
          toast({
            title: `Image ${i + 1} failed`,
            description: data.error || 'Could not extract contacts from this image.',
            variant: 'destructive',
          })
        }
      } catch {
        toast({
          title: `Image ${i + 1} failed`,
          description: 'An error occurred while processing this image.',
          variant: 'destructive',
        })
      }

      if (i < totalImages - 1 && !abortRef.current) {
        await delay(5000)
      }
    }

    setExtractionProgress({
      current: totalImages,
      total: totalImages,
      contactsFound: totalContactsFound,
      isComplete: true,
    })

    if (totalContactsFound > 0) {
      toast({
        title: 'Extraction complete',
        description: `Successfully extracted ${totalContactsFound} contacts from ${totalImages} image(s).`,
      })
    }

    setIsExtracting(false)
  }, [imagePreviews, debouncedSearch, fetchContacts, toast])

  // Handle delete selected
  const handleDeleteSelected = useCallback(async () => {
    if (selectedIds.size === 0) return

    try {
      const res = await fetch('/api/contacts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      })
      const data = await res.json()

      if (data.success) {
        toast({
          title: 'Deleted',
          description: `${selectedIds.size} contact(s) deleted successfully.`,
        })
        setSelectedIds(new Set())
        // Remove from local state immediately, then refresh
        setContacts((prev) => prev.filter((c) => !selectedIds.has(c.id)))
        setTotal((prev) => prev - selectedIds.size)
        await fetchContacts(debouncedSearch)
      }
    } catch {
      toast({
        title: 'Delete failed',
        description: 'Could not delete contacts. Please try again.',
        variant: 'destructive',
      })
    }
  }, [selectedIds, debouncedSearch, fetchContacts, toast])

  // Handle fetch address — frontend-driven sequential loop
  const handleFetchAddress = useCallback(async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return

    setIsFetchingAddress(true)
    setFetchProgress({ current: 0, total: ids.length })

    let successCount = 0
    let failCount = 0

    for (let i = 0; i < ids.length; i++) {
      const contactId = ids[i]
      setFetchingId(contactId)
      setFetchProgress({ current: i + 1, total: ids.length })

      try {
        const res = await fetch('/api/contacts/fetch-address', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: contactId, keywordSuffix }),
        })
        const data = await res.json()

        if (data.success && data.contact) {
          // Update locally — no refetch needed
          const updated = data.contact
          setContacts((prev) =>
            prev.map((c) =>
              c.id === contactId
                ? {
                    ...c,
                    kecamatan: updated.kecamatan,
                    kelurahan: updated.kelurahan,
                    kota: updated.kota,
                    provinsi: updated.provinsi,
                    latitude: updated.latitude,
                    longitude: updated.longitude,
                    fullAddress: updated.fullAddress,
                    postcode: updated.postcode,
                  }
                : c
            )
          )
          successCount++
          console.log(`[FetchAddress] ${i + 1}/${ids.length} ✅ ${updated.name}`)
        } else {
          failCount++
          console.warn(`[FetchAddress] ${i + 1}/${ids.length} ❌ ${data.error || 'Unknown error'}`)
        }
      } catch (err) {
        failCount++
        console.error(`[FetchAddress] ${i + 1}/${ids.length} ❌ Network error:`, err)
      }

      setFetchingId(null)

      // 1-second delay between requests (Nominatim rate limit)
      if (i < ids.length - 1) {
        await delay(1100)
      }
    }

    setFetchProgress(null)
    setIsFetchingAddress(false)
    setSelectedIds(new Set())

    toast({
      title: 'Address fetching complete',
      description: `${successCount} found, ${failCount} not found.`,
      ...(failCount > 0 ? { variant: 'destructive' } : {}),
    })
  }, [selectedIds, keywordSuffix, toast])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Alpha System Database"
            width={40}
            height={40}
            className="rounded-lg object-cover"
          />
          <div>
            <h1 className="text-xl font-bold tracking-tight">Alpha System Database</h1>
            <p className="text-sm text-muted-foreground">
              Extract phone numbers &amp; addresses from table images
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 space-y-8 max-w-7xl">
        {/* Contacts Table Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <ContactIcon className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Saved Contacts</h2>
          </div>
          <ContactsTable
            contacts={contacts}
            isLoading={isLoadingContacts}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            selectedIds={selectedIds}
            fetchingId={fetchingId}
            fetchProgress={fetchProgress}
            onSelectionChange={setSelectedIds}
            onDeleteSelected={handleDeleteSelected}
            onFetchAddress={handleFetchAddress}
            isFetchingAddress={isFetchingAddress}
            onRefresh={() => fetchContacts(debouncedSearch)}
            onLoadMore={loadMore}
            total={total}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            keywordSuffix={keywordSuffix}
            onKeywordSuffixChange={setKeywordSuffix}
            sentinelRef={sentinelRef}
          />
        </section>

        {/* Map Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <MapPinned className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Contact Map</h2>
          </div>
          <MapView />
        </section>

        {/* Upload Section — Toggleable */}
        <div>
          <button
            onClick={() => setIsUploadVisible((prev) => !prev)}
            className="flex items-center justify-between w-full rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary text-primary-foreground">
                <ImagePlus className="h-4 w-4" />
              </div>
              <div className="flex flex-col items-start gap-0.5">
                <h3 className="text-sm font-semibold">Upload Contact Table Images</h3>
                <p className="text-xs text-muted-foreground">
                  Extract names, phone numbers, and addresses from table images
                </p>
              </div>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${isUploadVisible ? 'rotate-180' : ''}`}
            />
          </button>

          {isUploadVisible && (
            <div className="mt-2">
              <UploadSection
                imagePreviews={imagePreviews}
                isExtracting={isExtracting}
                extractionProgress={extractionProgress}
                onImagesSelect={handleImagesSelect}
                onExtract={handleExtract}
                onClear={handleClear}
                totalContacts={total}
              />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4 mt-auto">
        <div className="container mx-auto px-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>Alpha System Database &mdash; Powered by AI Vision</span>
          <span>Address data from OpenStreetMap</span>
        </div>
      </footer>
    </div>
  )
}
