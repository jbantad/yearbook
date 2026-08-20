import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { TabBar } from '../components/TabBar'
import { BlockCard, type BlockWithJoins } from '../components/BlockCard'
import { EditPhotoSheet } from '../components/EditPhotoSheet'
import { getOrCreateDayPage } from '../components/FileToPageSheet'
import { BackIcon, PaletteIcon } from '../components/icons'
import { defaultBlockPosition } from '../lib/hash'

type Pos = { x: number; y: number }

function blockPosition(block: BlockWithJoins, index: number): Pos {
  const layout = (block.layout ?? {}) as { x?: number; y?: number }
  if (typeof layout.x === 'number' && typeof layout.y === 'number') return { x: layout.x, y: layout.y }
  return defaultBlockPosition(block.id, index)
}

function DraggableBlock({ block, index, onMoved, onEdit }: { block: BlockWithJoins; index: number; onMoved: (id: string, pos: Pos) => void; onEdit?: () => void }) {
  const base = blockPosition(block, index)
  const [pos, setPos] = useState(base)
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef<{ startX: number; startY: number; origin: Pos } | null>(null)

  useEffect(() => { setPos(base) }, [base.x, base.y])

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { startX: e.clientX, startY: e.clientY, origin: pos }
    setDragging(true)
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return
    const { startX, startY, origin } = dragRef.current
    setPos({ x: origin.x + (e.clientX - startX), y: origin.y + (e.clientY - startY) })
  }
  function onPointerUp(e: React.PointerEvent) {
    if (!dragRef.current) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    dragRef.current = null
    setDragging(false)
    onMoved(block.id, pos)
  }

  return (
    <div
      className={`block-drag-wrap${dragging ? ' dragging' : ''}`}
      style={{ left: pos.x, top: pos.y }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <BlockCard block={block} onEdit={onEdit} />
    </div>
  )
}

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
  const [creating, setCreating] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState<BlockWithJoins | null>(null)

  async function load() {
    if (!user || !date) return
    setLoading(true)
    const { data: page } = await supabase
      .from('pages')
      .select('id, page_number')
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
    const { data } = await supabase
      .from('blocks')
      .select('*, place:places(name), movie:movies(title, poster_path)')
      .eq('page_id', page.id)
      .order('captured_at', { ascending: true })
    setBlocks((data ?? []) as unknown as BlockWithJoins[])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, date])

  async function handleMoved(id: string, pos: Pos) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, layout: { ...(b.layout as object), ...pos } } : b)))
    await supabase.from('blocks').update({ layout: pos }).eq('id', id)
  }

  async function createPage() {
    if (!user || !date) return
    setCreating(true)
    await getOrCreateDayPage(user.id, date)
    await load()
    setCreating(false)
  }

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
          <button onClick={() => navigate('/customize')} aria-label="Customize"><PaletteIcon /></button>
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
          <div className="empty-state">
            No page for this day yet.
            <div style={{ marginTop: 12 }}>
              <button className="cta" style={{ width: 'auto', padding: '10px 20px' }} onClick={createPage} disabled={creating}>
                {creating ? 'Creating…' : 'Create this page'}
              </button>
            </div>
          </div>
        )}
        {!loading && pageId && blocks.length === 0 && (
          <div className="empty-state">This page is empty so far. File a moment here from the Loose Pile.</div>
        )}
        {blocks.map((b, i) => (
          <DraggableBlock
            key={b.id}
            block={b}
            index={i}
            onMoved={handleMoved}
            onEdit={b.type === 'photo' ? () => setEditingPhoto(b) : undefined}
          />
        ))}
        {pageNumber != null && <div className="pagetag">PAGE {pageNumber}</div>}
      </div>

      {editingPhoto && (
        <EditPhotoSheet
          block={editingPhoto}
          onClose={() => setEditingPhoto(null)}
          onSaved={() => { setEditingPhoto(null); load() }}
          onDeleted={() => { setEditingPhoto(null); load() }}
        />
      )}

      <TabBar active="today" />
    </div>
  )
}
