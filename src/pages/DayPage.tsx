import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { TabBar } from '../components/TabBar'
import { BlockCard, type BlockWithJoins } from '../components/BlockCard'
import { EditPhotoSheet } from '../components/EditPhotoSheet'
import { EditNoteSheet } from '../components/EditNoteSheet'
import { EditPlaceSheet } from '../components/EditPlaceSheet'
import { EditPersonSheet } from '../components/EditPersonSheet'
import { EditGratitudeSheet } from '../components/EditGratitudeSheet'
import { EditTextSheet } from '../components/EditTextSheet'
import { getOrCreateDayPage } from '../components/FileToPageSheet'
import { BackIcon } from '../components/icons'
import { defaultBlockPosition } from '../lib/hash'
import type { Json } from '../lib/database.types'

type Pos = { x: number; y: number }

const EDITABLE_TYPES = new Set(['photo', 'note', 'place', 'person', 'gratitude', 'text'])

function blockPosition(block: BlockWithJoins, index: number): Pos {
  const layout = (block.layout ?? {}) as { x?: number; y?: number }
  if (typeof layout.x === 'number' && typeof layout.y === 'number') return { x: layout.x, y: layout.y }
  return defaultBlockPosition(block.id, index)
}

function DraggableBlock({ block, index, onMoved, onClick }: { block: BlockWithJoins; index: number; onMoved: (id: string, pos: Pos) => void; onClick?: () => void }) {
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
    const { startX, startY } = dragRef.current
    const moved = Math.hypot(e.clientX - startX, e.clientY - startY)
    dragRef.current = null
    setDragging(false)
    onMoved(block.id, pos)
    // setPointerCapture above routes the native click event to this wrapper
    // instead of letting it bubble from the block underneath, so a tap
    // (negligible movement) has to trigger the click behavior explicitly here.
    if (moved < 6) onClick?.()
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
      <BlockCard block={block} onClick={onClick} />
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
  const [editingBlock, setEditingBlock] = useState<BlockWithJoins | null>(null)
  const [addingText, setAddingText] = useState(false)

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

  async function addText(style: 'headline' | 'label') {
    if (!user || !pageId) return
    setAddingText(false)
    const { data: created, error } = await supabase
      .from('blocks')
      .insert({ user_id: user.id, page_id: pageId, type: 'text', data: { style, content: '' } as unknown as Json })
      .select('*')
      .single()
    if (error || !created) return
    await load()
    setEditingBlock({ ...created, people: [] } as unknown as BlockWithJoins)
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
            onClick={EDITABLE_TYPES.has(b.type) ? () => setEditingBlock(b) : undefined}
          />
        ))}
        {pageNumber != null && <div className="pagetag">PAGE {pageNumber}</div>}

        {!loading && pageId && (
          addingText ? (
            <div className="add-text-bar">
              <button className="headline-btn" onClick={() => addText('headline')}>Add headline</button>
              <button className="label-btn" onClick={() => addText('label')}>Add label</button>
            </div>
          ) : (
            <div className="add-text-bar" style={{ left: 'auto' }}>
              <button className="label-btn" onClick={() => setAddingText(true)} style={{ flex: 'none', width: 40, height: 40, borderRadius: '50%', padding: 0 }} aria-label="Add text">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              </button>
            </div>
          )
        )}
      </div>

      {editingBlock?.type === 'photo' && (
        <EditPhotoSheet
          block={editingBlock}
          onClose={() => setEditingBlock(null)}
          onSaved={() => { setEditingBlock(null); load() }}
          onDeleted={() => { setEditingBlock(null); load() }}
        />
      )}
      {editingBlock?.type === 'note' && (
        <EditNoteSheet
          block={editingBlock}
          onClose={() => setEditingBlock(null)}
          onSaved={() => { setEditingBlock(null); load() }}
          onDeleted={() => { setEditingBlock(null); load() }}
        />
      )}
      {editingBlock?.type === 'place' && (
        <EditPlaceSheet
          block={editingBlock}
          onClose={() => setEditingBlock(null)}
          onSaved={() => { setEditingBlock(null); load() }}
          onDeleted={() => { setEditingBlock(null); load() }}
        />
      )}
      {editingBlock?.type === 'person' && (
        <EditPersonSheet
          block={editingBlock}
          onClose={() => setEditingBlock(null)}
          onSaved={() => { setEditingBlock(null); load() }}
          onDeleted={() => { setEditingBlock(null); load() }}
        />
      )}
      {editingBlock?.type === 'gratitude' && (
        <EditGratitudeSheet
          block={editingBlock}
          onClose={() => setEditingBlock(null)}
          onSaved={() => { setEditingBlock(null); load() }}
          onDeleted={() => { setEditingBlock(null); load() }}
        />
      )}
      {editingBlock?.type === 'text' && (
        <EditTextSheet
          block={editingBlock}
          onClose={() => setEditingBlock(null)}
          onSaved={() => { setEditingBlock(null); load() }}
          onDeleted={() => { setEditingBlock(null); load() }}
        />
      )}

      <TabBar active="today" />
    </div>
  )
}
