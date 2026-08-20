import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { TabBar } from '../components/TabBar'
import { MealIcon, MovieIcon, PlaceIcon, ChevronIcon, PlusIcon } from '../components/icons'
import type { Tables } from '../lib/database.types'

type Shelf = 'movie' | 'place' | 'meal' | 'person'
type Block = Tables<'blocks'> & { place?: { name: string } | null; movie?: { title: string; poster_path: string | null } | null }
type Person = Tables<'people'> & { count: number }

export function ShelvesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [shelf, setShelf] = useState<Shelf>('movie')
  const [blocks, setBlocks] = useState<Block[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [addingPerson, setAddingPerson] = useState(false)
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [busy, setBusy] = useState(false)

  async function loadPeople() {
    if (!user) return
    setLoading(true)
    const { data: ppl } = await supabase.from('people').select('*').eq('user_id', user.id).order('display_name')
    const { data: links } = await supabase
      .from('block_people')
      .select('person_id, blocks!inner(user_id)')
      .eq('blocks.user_id', user.id)
    const counts: Record<string, number> = {}
    for (const l of links ?? []) counts[l.person_id] = (counts[l.person_id] ?? 0) + 1
    setPeople((ppl ?? []).map((p) => ({ ...p, count: counts[p.id] ?? 0 })))
    setLoading(false)
  }

  useEffect(() => {
    if (!user) return
    if (shelf === 'person') {
      loadPeople()
      return
    }
    setLoading(true)
    supabase
      .from('blocks')
      .select('*, place:places(name), movie:movies(title, poster_path)')
      .eq('user_id', user.id)
      .eq('type', shelf)
      .order('captured_at', { ascending: false })
      .then(({ data }) => {
        setBlocks((data ?? []) as unknown as Block[])
        setLoading(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, shelf])

  async function addPerson(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !name.trim()) return
    setBusy(true)
    await supabase.from('people').insert({ user_id: user.id, display_name: name.trim(), relationship: relationship.trim() || null })
    setBusy(false)
    setName('')
    setRelationship('')
    setAddingPerson(false)
    loadPeople()
  }

  return (
    <div className="screen">
      <div className="header">
        <h1>Shelves</h1>
        <div className="sub">
          {loading ? 'loading…' : shelf === 'person' ? `${people.length} people tagged` : `${blocks.length} ${shelf === 'movie' ? 'watched' : shelf === 'meal' ? 'logged' : 'visited'}`}
        </div>
      </div>

      <div className="chips">
        <button className={`chip ${shelf === 'movie' ? 'active' : ''}`} onClick={() => setShelf('movie')}>Movies</button>
        <button className={`chip ${shelf === 'place' ? 'active' : ''}`} onClick={() => setShelf('place')}>Places</button>
        <button className={`chip ${shelf === 'meal' ? 'active' : ''}`} onClick={() => setShelf('meal')}>Meals</button>
        <button className={`chip ${shelf === 'person' ? 'active' : ''}`} onClick={() => setShelf('person')}>People</button>
      </div>

      {shelf === 'person' ? (
        <div className="plist">
          {people.map((p) => (
            <button className="prow" key={p.id} onClick={() => navigate(`/people/${p.id}`)}>
              <div className="av" style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}>{p.display_name[0]?.toUpperCase()}</div>
              <div className="body">
                <div className="nm">{p.display_name}</div>
                <div className="meta">{[p.relationship, `${p.count} moment${p.count === 1 ? '' : 's'} together`].filter(Boolean).join(' · ')}</div>
              </div>
              <ChevronIcon />
            </button>
          ))}

          {!addingPerson ? (
            <button className="padd" onClick={() => setAddingPerson(true)}>
              <div className="plus"><PlusIcon /></div>
              <span>Add someone</span>
            </button>
          ) : (
            <form onSubmit={addPerson} style={{ background: 'var(--card)', borderRadius: 14, padding: 14 }}>
              <div className="field">
                <label>Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
              </div>
              <div className="field">
                <label>Relationship (optional)</label>
                <input value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="sister, friend…" />
              </div>
              <button className="cta" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Add'}</button>
              <button type="button" className="cancel" onClick={() => setAddingPerson(false)}>Cancel</button>
            </form>
          )}
        </div>
      ) : (
        <>
          {!loading && blocks.length === 0 && <div className="empty-state">Nothing here yet.</div>}
          <div className="shelf-grid">
            {blocks.map((b) => {
              const data = (b.data ?? {}) as Record<string, unknown>
              const hue = (Math.abs(b.id.charCodeAt(0) * 7) % 360)
              const title = shelf === 'movie' ? b.movie?.title : shelf === 'place' ? b.place?.name : ((data.dish as string) || (data.description as string))
              const dateStr = new Date(b.captured_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
              const poster = shelf === 'movie' ? b.movie?.poster_path : undefined
              return (
                <div className="mcard" key={b.id} onClick={() => b.page_id && navigate(`/day/${new Date(b.captured_at).toISOString().slice(0, 10)}`)} style={{ cursor: b.page_id ? 'pointer' : 'default' }}>
                  <div
                    className="art"
                    style={poster
                      ? { backgroundImage: `url(${poster})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                      : { background: `linear-gradient(160deg, oklch(58% 0.1 ${hue}), oklch(30% 0.06 ${hue}))` }}
                  >
                    {!poster && shelf === 'movie' && <MovieIcon />}
                    {shelf === 'place' && <PlaceIcon />}
                    {shelf === 'meal' && <MealIcon />}
                  </div>
                  <div className="stub">
                    <div className="t">{title || 'untitled'}</div>
                    <div className="d">{dateStr}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      <TabBar active="shelves" />
    </div>
  )
}
