import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { TabBar } from '../components/TabBar'
import { BookIcon, PlusIcon } from '../components/icons'
import { hashRotation } from '../lib/hash'
import { getOrCreateDayPage } from '../components/FileToPageSheet'
import type { Tables } from '../lib/database.types'

type Summary = { summary_date: string; block_count: number }
type Album = Tables<'pages'>

function pad(n: number) { return String(n).padStart(2, '0') }

export function CalendarPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [creating, setCreating] = useState<string | null>(null)

  async function createAndOpen(iso: string) {
    if (!user || creating) return
    setCreating(iso)
    await getOrCreateDayPage(user.id, iso)
    navigate(`/day/${iso}`)
  }
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() } // month 0-indexed
  })
  const [summaries, setSummaries] = useState<Record<string, Summary>>({})
  const [loading, setLoading] = useState(true)
  const [albums, setAlbums] = useState<Album[]>([])

  const monthStart = `${cursor.year}-${pad(cursor.month + 1)}-01`
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate()
  const monthEnd = `${cursor.year}-${pad(cursor.month + 1)}-${pad(daysInMonth)}`
  const leadBlanks = new Date(cursor.year, cursor.month, 1).getDay()
  const todayISO = new Date().toISOString().slice(0, 10)
  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  useEffect(() => {
    if (!user) return
    setLoading(true)
    supabase
      .from('day_summaries')
      .select('summary_date, block_count')
      .eq('user_id', user.id)
      .gte('summary_date', monthStart)
      .lte('summary_date', monthEnd)
      .then(({ data }) => {
        const map: Record<string, Summary> = {}
        for (const row of data ?? []) map[row.summary_date] = row
        setSummaries(map)
        setLoading(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, monthStart, monthEnd])

  useEffect(() => {
    if (!user) return
    supabase
      .from('pages')
      .select('*')
      .eq('user_id', user.id)
      .eq('kind', 'event')
      .order('created_at', { ascending: false })
      .then(({ data }) => setAlbums(data ?? []))
  }, [user])

  const cells = useMemo(() => {
    const arr: { day: number | null; iso: string | null }[] = []
    for (let i = 0; i < leadBlanks; i++) arr.push({ day: null, iso: null })
    for (let d = 1; d <= daysInMonth; d++) arr.push({ day: d, iso: `${cursor.year}-${pad(cursor.month + 1)}-${pad(d)}` })
    while (arr.length < 42) arr.push({ day: null, iso: null })
    return arr
  }, [leadBlanks, daysInMonth, cursor])

  return (
    <div className="screen">
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <h1>{monthLabel}</h1>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="chip" onClick={() => setCursor((c) => c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 })}>‹ prev</button>
            <button className="chip" onClick={() => setCursor((c) => c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 })}>next ›</button>
          </div>
        </div>
      </div>

      <div className="weekdays"><div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div></div>

      <div className="cal-grid">
        {cells.map((c, i) => {
          if (!c.day) return <div className="cell" key={i} />
          const summary = c.iso ? summaries[c.iso] : undefined
          const isToday = c.iso === todayISO
          if (loading) return <div className="cell" key={i} />
          if (!summary || summary.block_count === 0) {
            return (
              <div className={`cell ${isToday ? 'today' : ''}`} key={i}>
                <button className="empty-slot" onClick={() => createAndOpen(c.iso!)} disabled={creating === c.iso} aria-label={`Create page for day ${c.day}`}>
                  <span>{c.day}</span>
                </button>
              </div>
            )
          }
          const rot = isToday ? 0 : hashRotation(c.iso!, 4)
          const hue = ((hashRotation(c.iso!, 360) + 180) | 0)
          return (
            <div className={`cell ${isToday ? 'today' : ''}`} key={i}>
              <button className="day-stamp" style={{ transform: `rotate(${rot}deg)` }} onClick={() => navigate(`/day/${c.iso}`)}>
                <div className="frame">
                  <div
                    className="photo"
                    style={{ background: `radial-gradient(circle at 26% 22%, oklch(100% 0 0 / .28), transparent 45%), linear-gradient(155deg, oklch(60% 0.1 ${hue}), oklch(30% 0.06 ${hue}))` }}
                  >
                    <div className="numeral">{c.day}</div>
                  </div>
                </div>
              </button>
            </div>
          )
        })}
      </div>

      <div className="legend"><span>each stamp is that day's cover photo</span></div>

      <div className="albums-section">
        <div className="kicker" style={{ padding: '0 4px 8px' }}>Albums</div>
        <div className="album-row">
          {albums.map((a) => (
            <button key={a.id} className="album-chip" onClick={() => navigate(`/page/${a.id}`)}>
              <BookIcon />
              <span>{a.title || 'Untitled album'}</span>
            </button>
          ))}
          <button className="album-chip new" onClick={() => navigate('/albums')}>
            <PlusIcon />
            <span>New</span>
          </button>
        </div>
      </div>

      <TabBar active="calendar" />
    </div>
  )
}
