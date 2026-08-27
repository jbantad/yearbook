import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { BlockCard, type BlockWithJoins } from './BlockCard'
import { AddSheet } from './AddSheet'
import { EditPhotoSheet } from './EditPhotoSheet'
import { EditNoteSheet } from './EditNoteSheet'
import { EditPlaceSheet } from './EditPlaceSheet'
import { EditPersonSheet } from './EditPersonSheet'
import { EditGratitudeSheet } from './EditGratitudeSheet'
import { EditMealSheet } from './EditMealSheet'
import { EditMovieSheet } from './EditMovieSheet'
import { EditTextSheet } from './EditTextSheet'
import { PlusIcon } from './icons'
import { defaultBlockPosition } from '../lib/hash'
import { useSwipeGesture } from '../lib/useSwipeGesture'

type Pos = { x: number; y: number }

const EDITABLE_TYPES = new Set(['photo', 'note', 'place', 'person', 'gratitude', 'text', 'meal', 'movie'])

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

export function PageCanvas({
  pageId,
  pageNumber,
  blocks,
  loading,
  emptyMessage,
  onReload,
  onSwipeLeft,
  onSwipeRight,
  onDoubleTap,
}: {
  pageId: string | null
  pageNumber: number | null
  blocks: BlockWithJoins[]
  loading: boolean
  emptyMessage: string
  onReload: () => void
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onDoubleTap?: () => void
}) {
  const [editingBlock, setEditingBlock] = useState<BlockWithJoins | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const swipe = useSwipeGesture({ onSwipeLeft, onSwipeRight, onDoubleTap, ignoreSelector: '.block-drag-wrap' })

  async function handleMoved(id: string, pos: Pos) {
    await supabase.from('blocks').update({ layout: pos }).eq('id', id)
  }

  return (
    <>
      <div
        className="page-canvas"
        onPointerDown={swipe.onPointerDown}
        onPointerUp={swipe.onPointerUp}
      >
        {loading && <div className="empty-state">loading…</div>}
        {!loading && pageId && blocks.length === 0 && (
          <div className="empty-state">{emptyMessage}</div>
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
      </div>

      {pageId && (
        <button className="fab" onClick={() => setAddOpen(true)} aria-label="Add a moment">
          <PlusIcon />
        </button>
      )}

      {addOpen && (
        <AddSheet
          pageId={pageId}
          onClose={() => setAddOpen(false)}
          onCreated={() => { setAddOpen(false); onReload() }}
        />
      )}

      {editingBlock?.type === 'photo' && (
        <EditPhotoSheet block={editingBlock} onClose={() => setEditingBlock(null)} onSaved={() => { setEditingBlock(null); onReload() }} onDeleted={() => { setEditingBlock(null); onReload() }} />
      )}
      {editingBlock?.type === 'note' && (
        <EditNoteSheet block={editingBlock} onClose={() => setEditingBlock(null)} onSaved={() => { setEditingBlock(null); onReload() }} onDeleted={() => { setEditingBlock(null); onReload() }} />
      )}
      {editingBlock?.type === 'place' && (
        <EditPlaceSheet block={editingBlock} onClose={() => setEditingBlock(null)} onSaved={() => { setEditingBlock(null); onReload() }} onDeleted={() => { setEditingBlock(null); onReload() }} />
      )}
      {editingBlock?.type === 'person' && (
        <EditPersonSheet block={editingBlock} onClose={() => setEditingBlock(null)} onSaved={() => { setEditingBlock(null); onReload() }} onDeleted={() => { setEditingBlock(null); onReload() }} />
      )}
      {editingBlock?.type === 'gratitude' && (
        <EditGratitudeSheet block={editingBlock} onClose={() => setEditingBlock(null)} onSaved={() => { setEditingBlock(null); onReload() }} onDeleted={() => { setEditingBlock(null); onReload() }} />
      )}
      {editingBlock?.type === 'meal' && (
        <EditMealSheet block={editingBlock} onClose={() => setEditingBlock(null)} onSaved={() => { setEditingBlock(null); onReload() }} onDeleted={() => { setEditingBlock(null); onReload() }} />
      )}
      {editingBlock?.type === 'movie' && (
        <EditMovieSheet block={editingBlock} onClose={() => setEditingBlock(null)} onSaved={() => { setEditingBlock(null); onReload() }} onDeleted={() => { setEditingBlock(null); onReload() }} />
      )}
      {editingBlock?.type === 'text' && (
        <EditTextSheet block={editingBlock} onClose={() => setEditingBlock(null)} onSaved={() => { setEditingBlock(null); onReload() }} onDeleted={() => { setEditingBlock(null); onReload() }} />
      )}
    </>
  )
}
