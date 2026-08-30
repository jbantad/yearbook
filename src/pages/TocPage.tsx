import { Fragment, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { TabBar } from '../components/TabBar'
import { HIDDEN_BLOCK_TYPES } from '../components/BlockCard'
import { getOrCreateDayPage, todayISO } from '../lib/pages'

type DayBlock = { type: string; data: unknown }
type DayGroup = { date: string; blocks: DayBlock[] }

function stripHtml(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  return (div.textContent || '').trim()
}

// A short, recognizable label per block — good enough to jog your memory
// when scanning a long list of days, without joining every related table.
function blockLabel(b: DayBlock): string {
  const data = (b.data ?? {}) as Record<string, unknown>
  switch (b.type) {
    case 'note': return stripHtml(String(data.text || '')) || 'note'
    case 'journal': return stripHtml(String(data.text || '')) || 'journal entry'
    case 'text': return String(data.content || '').trim() || 'headline'
    case 'photo': return String(data.caption || '').trim() || 'photo'
    case 'meal': return String(data.dish || '').trim() || 'meal'
    case 'movie': return 'movie'
    case 'place': return 'a place'
    case 'sticker': return 'sticker'
    default: return b.type
  }
}

function formatMonth(dateISO: string) {
  return new Date(dateISO + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

function formatWeekday(dateISO: string) {
  return new Date(dateISO + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long' })
}

function formatDay(dateISO: string) {
  const d = new Date(dateISO + 'T00:00:00')
  return { n: d.getDate(), m: d.toLocaleDateString(undefined, { month: 'short' }) }
}

async function fetchDayGroups(userId: string): Promise<DayGroup[]> {
  const { data: pages } = await supabase
    .from('pages')
    .select('id, page_date')
    .eq('user_id', userId)
    .eq('kind', 'day')
    .order('page_date', { ascending: false })
  const pageList = pages ?? []
  if (pageList.length === 0) return []
  const ids = pageList.map((p) => p.id)
  const { data: blocks } = await supabase.from('blocks').select('page_id, type, data').in('page_id', ids)
  const byPage = new Map<string, DayBlock[]>()
  for (const b of blocks ?? []) {
    const arr = byPage.get(b.page_id as string) ?? []
    arr.push(b)
    byPage.set(b.page_id as string, arr)
  }
  return pageList.map((p) => ({ date: p.page_date, blocks: byPage.get(p.id) ?? [] }))
}

export function TocPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [groups, setGroups] = useState<DayGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [jumpDate, setJumpDate] = useState(todayISO())
  const [jumping, setJumping] = useState(false)

  useEffect(() => {
    if (!user) return
    fetchDayGroups(user.id).then((g) => { setGroups(g); setLoading(false) })
  }, [user])

  async function jumpTo(dateISO: string) {
    if (!user || !dateISO) return
    setJumping(true)
    await getOrCreateDayPage(user.id, dateISO)
    navigate(`/day/${dateISO}`)
  }

  const rows = groups.map((g, i) => ({
    ...g,
    month: formatMonth(g.date),
    showMonth: i === 0 || formatMonth(g.date) !== formatMonth(groups[i - 1].date),
  }))

  return (
    <div className="screen">
      <div className="header">
        <div className="row"><h1>Table of Contents</h1></div>
        <div className="sub">every day you've journaled — tap one to jump in</div>
      </div>

      <div className="pile">
        <div className="toc-jump">
          <label>Jump to (or start) a date</label>
          <div className="toc-jump-row">
            <input type="date" value={jumpDate} onChange={(e) => setJumpDate(e.target.value)} max={todayISO()} />
            <button onClick={() => jumpTo(jumpDate)} disabled={jumping || !jumpDate}>{jumping ? '…' : 'Go'}</button>
          </div>
        </div>

        {loading && <div className="empty-state">loading…</div>}
        {!loading && groups.length === 0 && <div className="empty-state">No days yet — jump to a date above to start one.</div>}

        {rows.map((g) => {
          const { month, showMonth } = g
          const visible = g.blocks.filter((b) => !HIDDEN_BLOCK_TYPES.has(b.type))
          const preview = visible.slice(0, 3).map(blockLabel).join(' · ')
          const { n, m } = formatDay(g.date)
          return (
            <Fragment key={g.date}>
              {showMonth && <div className="month-label">{month}</div>}
              <button className={`prow${visible.length === 0 ? ' toc-empty' : ''}`} onClick={() => navigate(`/day/${g.date}`)}>
                <div
                  className="av"
                  style={{
                    background: 'var(--kraft-light)', color: 'var(--ink)', borderRadius: 10,
                    fontFamily: 'var(--font-body)', fontStyle: 'normal', fontSize: 16, fontWeight: 600,
                    flexDirection: 'column', gap: 0, lineHeight: 1.05,
                  }}
                >
                  {n}
                  <span style={{ fontSize: 9, fontWeight: 400, textTransform: 'uppercase', color: 'var(--ink-soft)' }}>{m}</span>
                </div>
                <div className="body">
                  <div className="nm">{formatWeekday(g.date)}</div>
                  <div className="meta">{visible.length === 0 ? 'Nothing here yet' : preview}</div>
                </div>
              </button>
            </Fragment>
          )
        })}
      </div>

      <TabBar active="toc" />
    </div>
  )
}
