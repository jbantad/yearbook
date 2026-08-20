import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { TabBar } from '../components/TabBar'
import { BlockCard, type BlockWithJoins } from '../components/BlockCard'
import { BackIcon } from '../components/icons'

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
  const [blocks, setBlocks] = useState<BlockWithJoins[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !date) return
    setLoading(true)
    supabase
      .from('pages')
      .select('id, page_number')
      .eq('user_id', user.id)
      .eq('kind', 'day')
      .eq('page_date', date)
      .maybeSingle()
      .then(async ({ data: page }) => {
        if (!page) {
          setPageId(null)
          setBlocks([])
          setLoading(false)
          return
        }
        setPageId(page.id)
        setPageNumber(page.page_number)
        const { data } = await supabase
          .from('blocks')
          .select('*, place:places(name), movie:movies(title)')
          .eq('page_id', page.id)
          .order('captured_at', { ascending: true })
        setBlocks((data ?? []) as unknown as BlockWithJoins[])
        setLoading(false)
      })
  }, [user, date])

  if (!date) return null

  return (
    <div className="screen">
      <div className="nav">
        <button onClick={() => navigate(-1)}><BackIcon /></button>
        <div className="title">
          <h1>{formatDate(date)}</h1>
          <div className="pg">DAY PAGE</div>
        </div>
        <div className="right">
          <button onClick={() => navigate(`/day/${shiftDate(date, -1)}`)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5 8 12l7 7" /></svg>
          </button>
          <button onClick={() => navigate(`/day/${shiftDate(date, 1)}`)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      <div className="page-canvas">
        {loading && <div className="empty-state">loading…</div>}
        {!loading && !pageId && (
          <div className="empty-state">No page for this day yet. File a moment here from the Loose Pile.</div>
        )}
        {!loading && pageId && blocks.length === 0 && (
          <div className="empty-state">This page is empty so far.</div>
        )}
        {blocks.map((b) => <BlockCard key={b.id} block={b} />)}
        {pageNumber != null && <div className="pagetag">PAGE {pageNumber}</div>}
      </div>

      <TabBar active="today" />
    </div>
  )
}
