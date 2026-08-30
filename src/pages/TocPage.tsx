import { Fragment, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { TabBar } from '../components/TabBar'
import { HIDDEN_BLOCK_TYPES } from '../components/BlockCard'
import { getOrCreateDayPage, todayISO } from '../lib/pages'

type DayBlock = { type: string; data: unknown }
type DayGroup = { id: string; date: string; blocks: DayBlock[] }

function hasVisibleBlocks(g: { blocks: DayBlock[] }) {
  return g.blocks.some((b) => !HIDDEN_BLOCK_TYPES.has(b.type))
}

// A day's headline block (if any) is the one thing meant to summarize it at
// a glance — journal entries and notes can run to paragraphs, far too much
// for a list row, so the preview only ever shows the headline text.
function headlineText(blocks: DayBlock[]): string {
  const headline = blocks.find((b) => {
    if (b.type !== 'text') return false
    const style = (b.data as Record<string, unknown> | null)?.style
    return (style ?? 'headline') === 'headline'
  })
  if (!headline) return ''
  const content = String((headline.data as Record<string, unknown>)?.content || '').trim()
  return content.length > 60 ? content.slice(0, 60) + '…' : content
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
  return pageList.map((p) => ({ id: p.id, date: p.page_date, blocks: byPage.get(p.id) ?? [] }))
}

// Pages get created eagerly just by visiting a date (see getOrCreateDayPage),
// and a removed feature can leave a page with rows that don't render
// anything visible (see HIDDEN_BLOCK_TYPES) — either way, a page nobody ever
// put real content on shouldn't stick around. Today's page is exempt so
// simply opening the Today tab doesn't get immediately deleted out from
// under you before you've had a chance to add anything.
async function purgeEmptyPages(groups: DayGroup[]): Promise<DayGroup[]> {
  const today = todayISO()
  const toDelete = groups.filter((g) => g.date !== today && !hasVisibleBlocks(g))
  if (toDelete.length > 0) {
    const ids = toDelete.map((g) => g.id)
    await supabase.from('blocks').delete().in('page_id', ids)
    await supabase.from('pages').delete().in('id', ids)
  }
  const deletedIds = new Set(toDelete.map((g) => g.id))
  return groups.filter((g) => !deletedIds.has(g.id) && hasVisibleBlocks(g))
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
    fetchDayGroups(user.id).then(purgeEmptyPages).then((g) => { setGroups(g); setLoading(false) })
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
          const preview = headlineText(g.blocks)
          const { n, m } = formatDay(g.date)
          return (
            <Fragment key={g.date}>
              {showMonth && <div className="month-label">{month}</div>}
              <button className="prow" onClick={() => navigate(`/day/${g.date}`)}>
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
                  {preview && <div className="meta">{preview}</div>}
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
