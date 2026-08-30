import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { BlockCard, type BlockWithJoins } from './BlockCard'
import { AddSheet } from './AddSheet'
import { EditPhotoSheet } from './EditPhotoSheet'
import { EditNoteSheet } from './EditNoteSheet'
import { EditPlaceSheet } from './EditPlaceSheet'
import { EditMealSheet } from './EditMealSheet'
import { EditMovieSheet } from './EditMovieSheet'
import { EditTextSheet } from './EditTextSheet'
import { EditStickerSheet } from './EditStickerSheet'
import { EditJournalSheet } from './EditJournalSheet'
import { PlusIcon, LockIcon, UnlockIcon, EditIcon, SendToBackIcon } from './icons'
import { defaultBlockPosition, hashRotation } from '../lib/hash'
import { FRAME_SIZES } from '../lib/frames'
import { STICKER_BASE_WIDTH, STICKER_BY_KEY } from '../lib/stickers'
import { useSwipeGesture } from '../lib/useSwipeGesture'

type Pos = { x: number; y: number }

const EDITABLE_TYPES = new Set(['photo', 'note', 'journal', 'place', 'text', 'meal', 'movie', 'sticker'])
// place/text render as compact inline tags (a pin+name, a bare headline/label
// string) rather than a boxy card — there's no clean corner to overlay a lock
// toggle on without it sitting on top of the text itself, so those two types
// don't get the button. Locking is still honored for them if it's ever set.
const LOCKABLE_TYPES = new Set(['photo', 'note', 'journal', 'meal', 'movie', 'sticker'])

function blockPosition(block: BlockWithJoins, index: number): Pos {
  const layout = (block.layout ?? {}) as { x?: number; y?: number }
  if (typeof layout.x === 'number' && typeof layout.y === 'number') return { x: layout.x, y: layout.y }
  return defaultBlockPosition(block.id, index)
}

function blockRotation(block: BlockWithJoins): number {
  const layout = (block.layout ?? {}) as { r?: number }
  return typeof layout.r === 'number' ? layout.r : hashRotation(block.id)
}

function blockLocked(block: BlockWithJoins): boolean {
  const layout = (block.layout ?? {}) as { locked?: boolean }
  return layout.locked === true
}

function blockSentBack(block: BlockWithJoins): boolean {
  const layout = (block.layout ?? {}) as { back?: boolean }
  return layout.back === true
}

// Card heights vary a lot by type — a photo frame needs real room, a place
// tag barely any — so a single flat estimate either clips tall cards or,
// applied to a small one, leaves a wall of empty space below it before the
// canvas ends. Approximate per type instead.
function estimateBlockHeight(block: BlockWithJoins): number {
  const data = (block.data ?? {}) as { frame?: string; photo_url?: string; sticker?: string; text?: string; width?: number }
  switch (block.type) {
    case 'photo': {
      const frame = FRAME_SIZES[data.frame ?? 'classic'] ?? FRAME_SIZES.classic
      return frame.h + 30
    }
    case 'sticker': {
      const sticker = data.sticker ? STICKER_BY_KEY[data.sticker] : undefined
      const ratio = sticker ? sticker.h / sticker.w : 0.6
      return STICKER_BASE_WIDTH * ratio + 20
    }
    case 'journal': {
      const text = data.text || ''
      const width = typeof data.width === 'number' ? data.width : 220
      const charsPerLine = Math.max(10, Math.floor(width / 8))
      const wrappedLines = text.split('\n').reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / charsPerLine)), 0)
      return Math.max(60, wrappedLines * 22 + 28)
    }
    case 'movie': return 300
    case 'meal': return data.photo_url ? 230 : 100
    case 'note': return 100
    case 'text': return 70
    case 'place': return 60
    default: return 150
  }
}

function angleOf(a: { x: number; y: number }, b: { x: number; y: number }) {
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
}

function DraggableBlock({
  block,
  pos,
  rotation,
  zIndex,
  pageLocked,
  blockLocked,
  blockSentBack,
  onDrag,
  onMoved,
  onRotate,
  onRotated,
  onFront,
  onEdit,
  onToggleLock,
  onToggleSendBack,
  onMeasure,
}: {
  block: BlockWithJoins
  pos: Pos
  rotation: number
  zIndex: number
  pageLocked: boolean
  blockLocked: boolean
  blockSentBack: boolean
  onDrag: (pos: Pos) => void
  onMoved: (id: string, pos: Pos) => void
  onRotate: (r: number) => void
  onRotated: (id: string, r: number) => void
  onFront: () => void
  onEdit?: () => void
  onToggleLock?: () => void
  onToggleSendBack?: () => void
  onMeasure: (height: number) => void
}) {
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef<{ startX: number; startY: number; origin: Pos } | null>(null)
  // Two fingers down at once switches from dragging to twist-to-rotate;
  // dropping back to one finger resumes dragging from wherever it is now.
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const rotateRef = useRef<{ startAngle: number; base: number } | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const locked = pageLocked || blockLocked
  const showButtonCluster = LOCKABLE_TYPES.has(block.type)

  // estimateBlockHeight (used for the initial canvasHeight, before this can
  // measure anything) is a rough guess from the block's data — it was
  // repeatedly wrong for rich-text journal entries in particular (HTML tags
  // and contentEditable's per-line <div>s don't match a plain character-
  // count estimate), letting a tall entry visually spill into the next
  // day's section. getBoundingClientRect reflects the block's actual
  // rendered size (rotation and scale included, since — unlike
  // ResizeObserver's contentRect — it's measured post-transform), so once
  // this fires the canvas height it feeds is exact instead of guessed.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const measure = () => onMeasure(el.getBoundingClientRect().height)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rotation, block.data])

  function beginRotate() {
    const pts = Array.from(pointersRef.current.values())
    rotateRef.current = { startAngle: angleOf(pts[0], pts[1]), base: rotation }
  }

  function onPointerDown(e: React.PointerEvent) {
    if (locked) return
    // Without this, a mouse-drag starting on the <img> inside a photo block
    // can also kick off the browser's own native image-drag gesture, which
    // races our pointer-capture drag below and can leave its ghost preview
    // stuck on screen across navigations.
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointersRef.current.size === 1) {
      onFront()
      dragRef.current = { startX: e.clientX, startY: e.clientY, origin: pos }
      setDragging(true)
    } else if (pointersRef.current.size === 2) {
      dragRef.current = null
      setDragging(false)
      beginRotate()
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointersRef.current.has(e.pointerId)) return
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointersRef.current.size >= 2 && rotateRef.current) {
      const pts = Array.from(pointersRef.current.values())
      const delta = angleOf(pts[0], pts[1]) - rotateRef.current.startAngle
      onRotate(rotateRef.current.base + delta)
      return
    }
    if (dragRef.current) {
      const { startX, startY, origin } = dragRef.current
      onDrag({ x: origin.x + (e.clientX - startX), y: origin.y + (e.clientY - startY) })
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!pointersRef.current.has(e.pointerId)) return
    pointersRef.current.delete(e.pointerId)
    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch { /* already released */ }

    if (rotateRef.current && pointersRef.current.size < 2) {
      rotateRef.current = null
      onRotated(block.id, rotation)
    }

    if (pointersRef.current.size === 0) {
      if (dragRef.current) onMoved(block.id, pos)
      dragRef.current = null
      setDragging(false)
    } else if (pointersRef.current.size === 1) {
      // One finger lifted off a two-finger rotate — pick dragging back up
      // from here with whichever finger is still down.
      const [remaining] = Array.from(pointersRef.current.values())
      dragRef.current = { startX: remaining.x, startY: remaining.y, origin: pos }
      setDragging(true)
    }
    // A plain tap (or a tiny drag) only reorders/moves the block via onFront
    // above — it must never also pop the edit sheet open. Editing is only
    // triggered by the block's own pencil button now.
  }

  return (
    <div
      ref={wrapRef}
      className={`block-drag-wrap${dragging ? ' dragging' : ''}`}
      style={{ left: pos.x, top: pos.y, zIndex, touchAction: 'none', transform: 'translateZ(0)' }}
      onPointerDown={locked ? undefined : onPointerDown}
      onPointerMove={locked ? undefined : onPointerMove}
      onPointerUp={locked ? undefined : onPointerUp}
      onPointerCancel={locked ? undefined : onPointerUp}
    >
      {/* Photo/note/journal/meal/movie/sticker cards apply their own
          rotate+scale transform for the drag/resize gestures — an edit or
          lock button rendered *inside* that transformed box would visually
          rotate and resize right along with it. Rendering both here instead,
          as siblings of the card inside this wrapper (which never rotates
          or scales, only translates), keeps them upright, fixed-size, and
          pinned to the wrapper's own top-right corner regardless of what the
          card inside is doing. Compact inline types (place/text) don't get
          this treatment — they render their own edit button inline, since
          there's no boxy corner to anchor one to. */}
      <BlockCard block={block} onEdit={(pageLocked || showButtonCluster) ? undefined : onEdit} rotationOverride={rotation} />
      {!pageLocked && showButtonCluster && (
        <>
          {onToggleSendBack && (
            <button
              className={`block-send-back${blockSentBack ? ' is-back' : ''}`}
              onClick={(e) => { e.stopPropagation(); onToggleSendBack() }}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label={blockSentBack ? 'Bring forward' : 'Send to back'}
            >
              <SendToBackIcon />
            </button>
          )}
          {onToggleLock && (
            <button
              className={`block-lock${blockLocked ? ' is-locked' : ''}`}
              onClick={(e) => { e.stopPropagation(); onToggleLock() }}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label={blockLocked ? 'Unlock block' : 'Lock block'}
            >
              {blockLocked ? <LockIcon /> : <UnlockIcon />}
            </button>
          )}
          {onEdit && (
            <button
              className="block-edit"
              onClick={(e) => { e.stopPropagation(); onEdit() }}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="Edit"
            >
              <EditIcon />
            </button>
          )}
        </>
      )}
    </div>
  )
}

export function PageCanvas({
  pageId,
  pageNumber,
  blocks,
  loading,
  locked = false,
  emptyMessage,
  onReload,
  onSwipeLeft,
  onSwipeRight,
  onDoubleTap,
  minHeight = 420,
  showFab = true,
}: {
  pageId: string | null
  pageNumber: number | null
  blocks: BlockWithJoins[]
  loading: boolean
  locked?: boolean
  emptyMessage: string
  onReload: () => void
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onDoubleTap?: () => void
  minHeight?: number
  showFab?: boolean
}) {
  const [editingBlock, setEditingBlock] = useState<BlockWithJoins | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [zOrder, setZOrder] = useState<Record<string, number>>({})
  const [positions, setPositions] = useState<Record<string, Pos>>({})
  const [rotations, setRotations] = useState<Record<string, number>>({})
  const [locks, setLocks] = useState<Record<string, boolean>>({})
  const [sentBacks, setSentBacks] = useState<Record<string, boolean>>({})
  const [measuredHeights, setMeasuredHeights] = useState<Record<string, number>>({})
  const zCounter = useRef(0)
  const swipe = useSwipeGesture({ onSwipeLeft, onSwipeRight, onDoubleTap, ignoreSelector: '.block-drag-wrap' })

  // Positions/rotations are lifted up here (rather than kept local to each
  // dragged block) so the canvas-height calc below always sees where a
  // block was just dragged to, instead of the stale position from the last
  // fetch — otherwise dragging something further down didn't grow the
  // scrollable area until the page was reloaded.
  useEffect(() => {
    setPositions(Object.fromEntries(blocks.map((b, i) => [b.id, blockPosition(b, i)])))
    setRotations(Object.fromEntries(blocks.map((b) => [b.id, blockRotation(b)])))
    setLocks(Object.fromEntries(blocks.map((b) => [b.id, blockLocked(b)])))
    setSentBacks(Object.fromEntries(blocks.map((b) => [b.id, blockSentBack(b)])))
  }, [blocks])

  function bringToFront(id: string) {
    zCounter.current += 1
    const z = zCounter.current
    setZOrder((prev) => (prev[id] === z ? prev : { ...prev, [id]: z }))
  }

  function handleDrag(id: string, pos: Pos) {
    setPositions((prev) => ({ ...prev, [id]: pos }))
  }

  function handleRotate(id: string, r: number) {
    setRotations((prev) => ({ ...prev, [id]: r }))
  }

  // Layout is a single JSON column ({x, y, r, locked, back}) — merge in just the
  // changed piece against that block's current layout, or a drag would wipe
  // out a rotation set elsewhere (and vice versa) instead of only updating
  // the field that actually changed. The block's own `layout` prop is a
  // snapshot from whenever this page last fetched — once dragged AND
  // rotated in the same session (without a reload in between), it no longer
  // reflects the other gesture's change, so fall back to the live
  // positions/rotations/locks state (updated on every gesture) instead of
  // that stale snapshot.
  async function persistLayout(id: string, patch: Partial<{ x: number; y: number; r: number; locked: boolean; back: boolean }>) {
    const block = blocks.find((b) => b.id === id)
    const currentLayout = (block?.layout ?? {}) as Record<string, unknown>
    const livePos = positions[id]
    const liveRot = rotations[id]
    const liveLock = locks[id]
    const liveBack = sentBacks[id]
    const merged = {
      ...currentLayout,
      ...(livePos ? { x: livePos.x, y: livePos.y } : {}),
      ...(typeof liveRot === 'number' ? { r: liveRot } : {}),
      ...(typeof liveLock === 'boolean' ? { locked: liveLock } : {}),
      ...(typeof liveBack === 'boolean' ? { back: liveBack } : {}),
      ...patch,
    }
    await supabase.from('blocks').update({ layout: merged }).eq('id', id)
  }

  async function handleMoved(id: string, pos: Pos) {
    await persistLayout(id, pos)
  }

  async function handleRotated(id: string, r: number) {
    await persistLayout(id, { r })
  }

  async function handleToggleLock(id: string) {
    const next = !(locks[id] ?? false)
    setLocks((prev) => ({ ...prev, [id]: next }))
    await persistLayout(id, { locked: next })
  }

  async function handleToggleSendBack(id: string) {
    const next = !(sentBacks[id] ?? false)
    setSentBacks((prev) => ({ ...prev, [id]: next }))
    await persistLayout(id, { back: next })
  }

  function handleMeasure(id: string, height: number) {
    setMeasuredHeights((prev) => (prev[id] === height ? prev : { ...prev, [id]: height }))
  }

  // Blocks are positioned absolutely, so the canvas never grows to fit them
  // on its own — once a page has enough content to run past the default
  // floor, grow the canvas to the lowest block's bottom edge so the page
  // scrolls to reveal everything instead of clipping (or, before this
  // session, letting a tall block visually spill into the next section).
  // measuredHeights (the block's real, post-transform rendered height) is
  // preferred once available; estimateBlockHeight is only the placeholder
  // guess used for the first render, before anything has measured itself.
  const canvasHeight = blocks.reduce((max, b, i) => {
    const pos = positions[b.id] ?? blockPosition(b, i)
    const measured = measuredHeights[b.id]
    if (typeof measured === 'number') return Math.max(max, pos.y + measured)
    const data = (b.data ?? {}) as { card_scale?: number }
    const scale = typeof data.card_scale === 'number' ? data.card_scale : 1
    return Math.max(max, pos.y + estimateBlockHeight(b) * scale)
  }, minHeight)

  return (
    <>
      <div
        className="page-canvas"
        style={{ minHeight: canvasHeight }}
        onPointerDown={swipe.onPointerDown}
        onPointerUp={swipe.onPointerUp}
      >
        {loading && <div className="empty-state">loading…</div>}
        {!loading && pageId && blocks.length === 0 && (
          <div className="empty-state">{emptyMessage}</div>
        )}
        {blocks.map((b, i) => {
          const isBack = sentBacks[b.id] ?? blockSentBack(b)
          // Sent-to-back blocks stay behind everything else no matter what —
          // ignoring the session's bring-to-front counter here (rather than
          // just seeding a low starting value) is what keeps a later tap or
          // drag from popping one back on top.
          const zIndex = isBack ? -1000 + i : (zOrder[b.id] ?? i)
          return (
          <DraggableBlock
            key={b.id}
            block={b}
            pos={positions[b.id] ?? blockPosition(b, i)}
            rotation={rotations[b.id] ?? blockRotation(b)}
            zIndex={zIndex}
            pageLocked={locked}
            blockLocked={locks[b.id] ?? blockLocked(b)}
            blockSentBack={isBack}
            onDrag={(pos) => handleDrag(b.id, pos)}
            onMoved={handleMoved}
            onRotate={(r) => handleRotate(b.id, r)}
            onRotated={handleRotated}
            onFront={() => bringToFront(b.id)}
            onMeasure={(h) => handleMeasure(b.id, h)}
            onToggleLock={LOCKABLE_TYPES.has(b.type) ? () => handleToggleLock(b.id) : undefined}
            onToggleSendBack={LOCKABLE_TYPES.has(b.type) ? () => handleToggleSendBack(b.id) : undefined}
            onEdit={EDITABLE_TYPES.has(b.type) ? () => {
              // Same staleness issue as persistLayout above: b.layout is a
              // snapshot from the last fetch, so if this block was dragged
              // or rotated on the canvas earlier this session, saving from
              // the edit sheet (which starts from b.layout) would silently
              // revert that gesture. Seed it with the live values first.
              const livePos = positions[b.id]
              const liveRot = rotations[b.id]
              const currentLayout = (b.layout ?? {}) as Record<string, unknown>
              setEditingBlock({
                ...b,
                layout: {
                  ...currentLayout,
                  ...(livePos ? { x: livePos.x, y: livePos.y } : {}),
                  ...(typeof liveRot === 'number' ? { r: liveRot } : {}),
                },
              })
            } : undefined}
          />
          )
        })}
        {pageNumber != null && <div className="pagetag">PAGE {pageNumber}</div>}
      </div>

      {pageId && !locked && showFab && (
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
      {editingBlock?.type === 'journal' && (
        <EditJournalSheet block={editingBlock} onClose={() => setEditingBlock(null)} onSaved={() => { setEditingBlock(null); onReload() }} onDeleted={() => { setEditingBlock(null); onReload() }} />
      )}
      {editingBlock?.type === 'place' && (
        <EditPlaceSheet block={editingBlock} onClose={() => setEditingBlock(null)} onSaved={() => { setEditingBlock(null); onReload() }} onDeleted={() => { setEditingBlock(null); onReload() }} />
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
      {editingBlock?.type === 'sticker' && (
        <EditStickerSheet block={editingBlock} onClose={() => setEditingBlock(null)} onSaved={() => { setEditingBlock(null); onReload() }} onDeleted={() => { setEditingBlock(null); onReload() }} />
      )}
    </>
  )
}
