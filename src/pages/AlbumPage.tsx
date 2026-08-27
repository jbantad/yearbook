import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { TabBar } from '../components/TabBar'
import { type BlockWithJoins } from '../components/BlockCard'
import { PageCanvas } from '../components/PageCanvas'
import { BackIcon } from '../components/icons'

export function AlbumPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState<string | null>(null)
  const [pageNumber, setPageNumber] = useState<number | null>(null)
  const [blocks, setBlocks] = useState<BlockWithJoins[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  async function load() {
    if (!user || !id) return
    setLoading(true)
    const { data: page } = await supabase
      .from('pages')
      .select('id, title, page_number')
      .eq('user_id', user.id)
      .eq('kind', 'event')
      .eq('id', id)
      .maybeSingle()
    if (!page) {
      setNotFound(true)
      setLoading(false)
      return
    }
    setTitle(page.title)
    setPageNumber(page.page_number)
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
  }, [user, id])

  if (notFound) {
    return (
      <div className="screen">
        <div className="nav">
          <button onClick={() => navigate('/albums')}><BackIcon /></button>
          <div className="title"><h1>Album</h1></div>
          <div style={{ width: 32 }} />
        </div>
        <div className="page-canvas">
          <div className="empty-state">Couldn't find this album.</div>
        </div>
        <TabBar active="calendar" />
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="nav">
        <button onClick={() => navigate('/albums')}><BackIcon /></button>
        <div className="title">
          <h1>{title || 'Untitled album'}</h1>
          <div className="pg">ALBUM</div>
        </div>
        <div style={{ width: 32 }} />
      </div>

      <PageCanvas
        pageId={id ?? null}
        pageNumber={pageNumber}
        blocks={blocks}
        loading={loading}
        emptyMessage="This album is empty so far. Tap + to add the first moment."
        onReload={load}
      />

      <TabBar active="calendar" />
    </div>
  )
}
