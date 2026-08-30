import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { TabBar } from '../components/TabBar'
import { type BlockWithJoins } from '../components/BlockCard'
import { PageCanvas } from '../components/PageCanvas'
import { AddSheet } from '../components/AddSheet'
import { getOrCreateDayPage, findPriorPageDates } from '../lib/pages'
import { LockIcon, UnlockIcon, PlusIcon } from '../components/icons'

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
}

type DayEntry = {
  date: string
  pageId: string | null
  pageNumber: number | null
  locked: boolean
  blocks: BlockWithJoins[]
}

async function fetchDay(userId: string, date: string): Promise<DayEntry> {
  const { data: page } = await supabase
    .from('pages')
    .select('id, page_number, locked')
    .eq('user_id', userId)
    .eq('kind', 'day')
    .eq('page_date', date)
    .maybeSingle()
  if (!page) return { date, pageId: null, pageNumber: null, locked: false, blocks: [] }
  const { data } = await supabase
    .from('blocks')
    .select('*, place:places(name), movie:movies(title, poster_path, rating), people:block_people(person:people(id, display_name))')
    .eq('page_id', page.id)
    .order('captured_at', { ascending: true })
  const withPeople = (data ?? []).map((b) => ({
    ...b,
    people: ((b as { people?: { person: { id: string; display_name: string } | null }[] }).people ?? [])
      .map((p) => p.person)
      .filter((p): p is { id: string; display_name: string } => !!p),
  }))
  return {
    date,
    pageId: page.id,
    pageNumber: page.page_number,
    locked: page.locked,
    blocks: withPeople as unknown as BlockWithJoins[],
  }
}

const BATCH_SIZE = 8
const MAX_EMPTY_BATCHES_PER_LOAD = 4

export function DayPage() {
  const { date } = useParams<{ date: string }>()
  const { user } = useAuth()
  const [days, setDays] = useState<DayEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [exhausted, setExhausted] = useState(false)
  const [creating, setCreating] = useState(false)
  const [activeDate, setActiveDate] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const dayElRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  useEffect(() => {
    let cancelled = false
    if (!user || !date) return
    setLoading(true)
    setExhausted(false)
    fetchDay(user.id, date).then((entry) => {
      if (cancelled) return
      setDays([entry])
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [user, date])

  const reloadDay = useCallback(async (dayDate: string) => {
    if (!user) return
    const entry = await fetchDay(user.id, dayDate)
    setDays((prev) => prev.map((d) => (d.date === dayDate ? entry : d)))
  }, [user])

  const loadMore = useCallback(async () => {
    if (!user || loadingMore || exhausted || days.length === 0) return
    setLoadingMore(true)
    try {
      let cursor = days[days.length - 1].date
      let found: DayEntry[] = []
      for (let i = 0; i < MAX_EMPTY_BATCHES_PER_LOAD && found.length === 0; i++) {
        const priorDates = await findPriorPageDates(user.id, cursor, BATCH_SIZE)
        if (priorDates.length === 0) {
          setExhausted(true)
          break
        }
        cursor = priorDates[priorDates.length - 1]
        const entries = await Promise.all(priorDates.map((d) => fetchDay(user.id, d)))
        found = entries.filter((e) => e.blocks.length > 0)
        if (priorDates.length < BATCH_SIZE) {
          // fewer than a full batch came back — we've reached the oldest page
          if (found.length > 0) setDays((prev) => [...prev, ...found])
          setExhausted(true)
          setLoadingMore(false)
          return
        }
      }
      if (found.length > 0) setDays((prev) => [...prev, ...found])
    } finally {
      setLoadingMore(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, days, loadingMore, exhausted])

  async function createPage() {
    if (!user || !date) return
    setCreating(true)
    await getOrCreateDayPage(user.id, date)
    await reloadDay(date)
    setCreating(false)
  }

  async function toggleLock(entry: DayEntry) {
    if (!entry.pageId) return
    const next = !entry.locked
    setDays((prev) => prev.map((d) => (d.date === entry.date ? { ...d, locked: next } : d)))
    await supabase.from('pages').update({ locked: next }).eq('id', entry.pageId)
  }

  const bottomSentinelRef = useRef<HTMLDivElement>(null)

  // On a short page — or any viewport taller than the loaded content, which
  // is the common case on desktop — the sentinel can already sit on-screen
  // with nothing to scroll at all, so a plain "wait for it to scroll into
  // view" observer would never fire. Keep auto-loading batches after every
  // change to the day list until the sentinel is finally pushed off-screen
  // (meaning there's now enough content to scroll) or we run out of days.
  useEffect(() => {
    if (loading || loadingMore || exhausted) return
    const el = bottomSentinelRef.current
    if (!el) return
    if (el.getBoundingClientRect().top <= window.innerHeight) {
      loadMore()
    }
  }, [days, loading, loadingMore, exhausted, loadMore])

  // Once there's enough content that the sentinel starts off-screen, a real
  // scroll gesture is what should resume loading.
  useEffect(() => {
    const el = bottomSentinelRef.current
    if (!el || exhausted) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore()
      },
      { threshold: 1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [exhausted, loadMore])

  // Every day in the feed can add blocks, but the FAB is position:fixed —
  // rendering one per day would stack them all in the same screen corner.
  // Instead there's a single shared FAB that follows whichever day's header
  // has scrolled to the top band of the viewport (a standard scrollspy).
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const d = entry.target.getAttribute('data-date')
            if (d) setActiveDate(d)
          }
        }
      },
      { rootMargin: '-1px 0px -85% 0px', threshold: 0 },
    )
    dayElRefs.current.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [days])

  if (!date) return null

  const activeEntry = days.find((d) => d.date === activeDate) ?? days[0]

  const entryDay = days[0]

  return (
    <div className="screen" style={{ paddingTop: 'var(--safe-top)' }}>
      {!loading && entryDay && !entryDay.pageId && (
        <div className="page-canvas">
          <div className="empty-state">
            No page for this day yet.
            <div style={{ marginTop: 12 }}>
              <button className="cta" style={{ width: 'auto', padding: '10px 20px' }} onClick={createPage} disabled={creating}>
                {creating ? 'Creating…' : 'Create this page'}
              </button>
            </div>
          </div>
        </div>
      )}

      {days.map((entry, i) => (
        (entry.pageId && (i === 0 || entry.blocks.length > 0)) ? (
          <div
            key={entry.date}
            data-date={entry.date}
            ref={(el) => {
              if (el) dayElRefs.current.set(entry.date, el)
              else dayElRefs.current.delete(entry.date)
            }}
          >
            <div className="day-section-header" style={i === 0 ? { marginTop: 0 } : undefined}>
              <span>{formatDate(entry.date)}</span>
              <svg className="squiggle" viewBox="0 0 200 20" preserveAspectRatio="none">
                <path
                  d="M0,10 Q3.12,6.5 6.25,10 Q9.38,13.5 12.50,10 Q15.62,6.5 18.75,10 Q21.88,13.5 25.00,10 Q28.12,6.5 31.25,10 Q34.38,13.5 37.50,10 Q40.62,6.5 43.75,10 Q46.88,13.5 50.00,10 Q53.12,6.5 56.25,10 Q59.38,13.5 62.50,10 Q65.62,6.5 68.75,10 Q71.88,13.5 75.00,10 Q78.12,6.5 81.25,10 Q84.38,13.5 87.50,10 Q90.62,6.5 93.75,10 Q96.88,13.5 100.00,10 Q103.12,6.5 106.25,10 Q109.38,13.5 112.50,10 Q115.62,6.5 118.75,10 Q121.88,13.5 125.00,10 Q128.12,6.5 131.25,10 Q134.38,13.5 137.50,10 Q140.62,6.5 143.75,10 Q146.88,13.5 150.00,10 Q153.12,6.5 156.25,10 Q159.38,13.5 162.50,10 Q165.62,6.5 168.75,10 Q171.88,13.5 175.00,10 Q178.12,6.5 181.25,10 Q184.38,13.5 187.50,10 Q190.62,6.5 193.75,10 Q196.88,13.5 200.00,10"
                  fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
                />
              </svg>
              <button onClick={() => toggleLock(entry)} aria-label={entry.locked ? 'Unlock page' : 'Lock page'}>
                {entry.locked ? <LockIcon /> : <UnlockIcon />}
              </button>
            </div>
            <PageCanvas
              pageId={entry.pageId}
              pageNumber={entry.pageNumber}
              blocks={entry.blocks}
              loading={false}
              locked={entry.locked}
              emptyMessage="This page is empty so far. Tap + to add something."
              onReload={() => reloadDay(entry.date)}
              minHeight={i === 0 ? 420 : 120}
              showFab={false}
            />
          </div>
        ) : null
      ))}

      {!exhausted && (
        <div className="scroll-prev-hint">{loadingMore ? 'loading…' : 'keep scrolling for earlier entries'}</div>
      )}
      {exhausted && days.length > 0 && (
        <div className="scroll-prev-hint">that's everything so far</div>
      )}
      <div ref={bottomSentinelRef} style={{ height: 1 }} />

      {activeEntry?.pageId && !activeEntry.locked && (
        <button className="fab" onClick={() => setAddOpen(true)} aria-label="Add a moment">
          <PlusIcon />
        </button>
      )}

      {addOpen && activeEntry?.pageId && (
        <AddSheet
          pageId={activeEntry.pageId}
          onClose={() => setAddOpen(false)}
          onCreated={() => { setAddOpen(false); reloadDay(activeEntry.date) }}
        />
      )}

      <TabBar active="today" />
    </div>
  )
}
