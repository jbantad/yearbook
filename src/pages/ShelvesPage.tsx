import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { TabBar } from '../components/TabBar'
import { MealIcon, MovieIcon, PlaceIcon } from '../components/icons'
import type { Tables } from '../lib/database.types'

type Shelf = 'movie' | 'place' | 'meal'
type Block = Tables<'blocks'> & { place?: { name: string } | null; movie?: { title: string; poster_path: string | null } | null }

export function ShelvesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [shelf, setShelf] = useState<Shelf>('movie')
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
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
  }, [user, shelf])

  return (
    <div className="screen">
      <div className="header">
        <h1>Shelves</h1>
        <div className="sub">{loading ? 'loading…' : `${blocks.length} ${shelf === 'movie' ? 'watched' : shelf === 'meal' ? 'logged' : 'visited'}`}</div>
      </div>

      <div className="chips">
        <button className={`chip ${shelf === 'movie' ? 'active' : ''}`} onClick={() => setShelf('movie')}>Movies</button>
        <button className={`chip ${shelf === 'place' ? 'active' : ''}`} onClick={() => setShelf('place')}>Places</button>
        <button className={`chip ${shelf === 'meal' ? 'active' : ''}`} onClick={() => setShelf('meal')}>Meals</button>
      </div>

      {!loading && blocks.length === 0 && <div className="empty-state">Nothing here yet.</div>}

      <div className="shelf-grid">
        {blocks.map((b) => {
          const data = (b.data ?? {}) as Record<string, unknown>
          const hue = (Math.abs(b.id.charCodeAt(0) * 7) % 360)
          const title = shelf === 'movie' ? b.movie?.title : shelf === 'place' ? b.place?.name : ((data.dish as string) || (data.description as string))
          const dateStr = new Date(b.captured_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
          return (
            <div className="mcard" key={b.id} onClick={() => b.page_id && navigate(`/day/${new Date(b.captured_at).toISOString().slice(0, 10)}`)} style={{ cursor: b.page_id ? 'pointer' : 'default' }}>
              <div className="art" style={{ background: `linear-gradient(160deg, oklch(58% 0.1 ${hue}), oklch(30% 0.06 ${hue}))` }}>
                {shelf === 'movie' && <MovieIcon />}
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

      <TabBar active="shelves" />
    </div>
  )
}
