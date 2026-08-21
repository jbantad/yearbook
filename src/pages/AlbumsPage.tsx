import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { TabBar } from '../components/TabBar'
import { BackIcon, PlusIcon } from '../components/icons'
import type { Tables } from '../lib/database.types'

type Album = Tables<'pages'>

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function AlbumsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('pages')
      .select('*')
      .eq('user_id', user.id)
      .eq('kind', 'event')
      .order('created_at', { ascending: false })
    setAlbums(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  async function createAlbum(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !title.trim()) return
    setBusy(true)
    const { data, error } = await supabase
      .from('pages')
      .insert({ user_id: user.id, kind: 'event', title: title.trim(), page_date: todayISO() })
      .select('id')
      .single()
    setBusy(false)
    if (error || !data) return
    navigate(`/page/${data.id}`)
  }

  return (
    <div className="screen">
      <div className="nav">
        <button onClick={() => navigate(-1)}><BackIcon /></button>
        <div className="title"><h1>Albums</h1></div>
        <div style={{ width: 32 }} />
      </div>

      <div className="pile">
        {loading && <div className="empty-state">loading…</div>}
        {!loading && albums.length === 0 && !creating && (
          <div className="empty-state">No albums yet — a good spot for a trip or a project that isn't tied to one day.</div>
        )}
        {albums.map((a) => (
          <button key={a.id} className="prow" onClick={() => navigate(`/page/${a.id}`)}>
            <div className="av" style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}>
              {(a.title ?? 'A')[0]?.toUpperCase()}
            </div>
            <div className="body">
              <div className="nm">{a.title || 'Untitled album'}</div>
              <div className="meta">started {new Date(a.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
            </div>
          </button>
        ))}

        {!creating ? (
          <button className="padd" onClick={() => setCreating(true)}>
            <div className="plus"><PlusIcon /></div>
            <span>New album</span>
          </button>
        ) : (
          <form onSubmit={createAlbum} style={{ background: 'var(--card)', borderRadius: 14, padding: 14 }}>
            <div className="field">
              <label>Album title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Iceland 2026" required autoFocus />
            </div>
            <button className="cta" type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create album'}</button>
            <button type="button" className="cancel" onClick={() => { setCreating(false); setTitle('') }}>Cancel</button>
          </form>
        )}
      </div>

      <TabBar active="calendar" />
    </div>
  )
}
