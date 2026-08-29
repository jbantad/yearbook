import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { TabBar } from '../components/TabBar'
import { type BlockWithJoins } from '../components/BlockCard'
import { PageCanvas } from '../components/PageCanvas'
import { getOrCreateDayPage } from '../lib/pages'
import { BackIcon, LockIcon, UnlockIcon } from '../components/icons'
import { useSwipeGesture } from '../lib/useSwipeGesture'

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
}
function shiftDate(iso: string, days: number) {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function DayPage() {
  const { date } = useParams<{ date: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [pageId, setPageId] = useState<string | null>(null)
  const [pageNumber, setPageNumber] = useState<number | null>(null)
  const [locked, setLocked] = useState(false)
  const [blocks, setBlocks] = useState<BlockWithJoins[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  async function load() {
    if (!user || !date) return
    setLoading(true)
    const { data: page } = await supabase
      .from('pages')
      .select('id, page_number, locked')
      .eq('user_id', user.id)
      .eq('kind', 'day')
      .eq('page_date', date)
      .maybeSingle()
    if (!page) {
      setPageId(null)
      setBlocks([])
      setLoading(false)
      return
    }
    setPageId(page.id)
    setPageNumber(page.page_number)
    setLocked(page.locked)
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
    setBlocks(withPeople as unknown as BlockWithJoins[])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, date])

  async function createPage() {
    if (!user || !date) return
    setCreating(true)
    await getOrCreateDayPage(user.id, date)
    await load()
    setCreating(false)
  }

  async function toggleLock() {
    if (!pageId) return
    const next = !locked
    setLocked(next)
    await supabase.from('pages').update({ locked: next }).eq('id', pageId)
  }

  const goPrev = () => date && navigate(`/day/${shiftDate(date, -1)}`)
  const goNext = () => date && navigate(`/day/${shiftDate(date, 1)}`)
  const goCalendar = () => navigate('/calendar')
  const emptySwipe = useSwipeGesture({ onSwipeLeft: goNext, onSwipeRight: goPrev, onDoubleTap: goCalendar })

  const bottomSentinelRef = useRef<HTMLDivElement>(null)
  const wasIntersectingRef = useRef(false)

  useEffect(() => {
    wasIntersectingRef.current = false
    const el = bottomSentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Skip the observer's initial report — on a short page the sentinel
        // can already be on-screen at load with no scrolling at all, which
        // would otherwise navigate away immediately.
        const wasIntersecting = wasIntersectingRef.current
        wasIntersectingRef.current = entry.isIntersecting
        if (entry.isIntersecting && !wasIntersecting && window.scrollY > 20) {
          goPrev()
        }
      },
      { threshold: 1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, pageId, loading])

  if (!date) return null

  return (
    <div className="screen">
      <div className="nav">
        <button onClick={() => navigate(-1)}><BackIcon /></button>
        <div className="title">
          <h1>{formatDate(date)}</h1>
          <div className="pg">DAY PAGE</div>
        </div>
        {pageId ? (
          <button onClick={toggleLock} aria-label={locked ? 'Unlock page' : 'Lock page'}>
            {locked ? <LockIcon /> : <UnlockIcon />}
          </button>
        ) : (
          <div style={{ width: 32 }} />
        )}
      </div>

      {!loading && !pageId ? (
        <div className="page-canvas" onPointerDown={emptySwipe.onPointerDown} onPointerUp={emptySwipe.onPointerUp}>
          <div className="empty-state">
            No page for this day yet.
            <div style={{ marginTop: 12 }}>
              <button className="cta" style={{ width: 'auto', padding: '10px 20px' }} onClick={createPage} disabled={creating}>
                {creating ? 'Creating…' : 'Create this page'}
              </button>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--ink-faint)', fontStyle: 'italic' }}>swipe to flip days · double-tap for calendar</div>
          </div>
        </div>
      ) : (
        <PageCanvas
          pageId={pageId}
          pageNumber={pageNumber}
          blocks={blocks}
          loading={loading}
          locked={locked}
          emptyMessage="This page is empty so far. Tap + to add something."
          onReload={load}
          onSwipeLeft={goNext}
          onSwipeRight={goPrev}
          onDoubleTap={goCalendar}
        />
      )}

      <div className="scroll-prev-hint">keep scrolling for {formatDate(shiftDate(date, -1))}</div>
      <div ref={bottomSentinelRef} style={{ height: 1 }} />

      <TabBar active="today" />
    </div>
  )
}
