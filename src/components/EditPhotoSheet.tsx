import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { BlockWithJoins } from './BlockCard'
import { TrashIcon } from './icons'
import type { Json } from '../lib/database.types'
import { hashRotation } from '../lib/hash'
import { FRAME_SIZES, FRAME_WINDOWS } from '../lib/frames'

const FRAMES: { key: string; label: string }[] = [
  { key: 'classic', label: 'Classic' },
  { key: 'tall', label: 'Tall' },
  { key: 'square', label: 'Square' },
]

export function EditPhotoSheet({
  block,
  onClose,
  onSaved,
  onDeleted,
}: {
  block: BlockWithJoins
  onClose: () => void
  onSaved: () => void
  onDeleted: () => void
}) {
  const { user } = useAuth()
  const data = (block.data ?? {}) as Record<string, unknown>
  const layout = (block.layout ?? {}) as { x?: number; y?: number; r?: number }
  const [caption, setCaption] = useState((data.caption as string) || '')
  const [frame, setFrame] = useState((data.frame as string) || 'classic')
  const [rotation, setRotation] = useState(typeof layout.r === 'number' ? layout.r : hashRotation(block.id))
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>((data.photo_url as string) || null)
  const [zoom, setZoom] = useState(typeof data.photo_zoom === 'number' ? (data.photo_zoom as number) : 1)
  const [offsetX, setOffsetX] = useState(typeof data.photo_x === 'number' ? (data.photo_x as number) : 0)
  const [offsetY, setOffsetY] = useState(typeof data.photo_y === 'number' ? (data.photo_y as number) : 0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const previewBoxRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)

  const frameSize = FRAME_SIZES[frame] ?? FRAME_SIZES.classic
  const win = FRAME_WINDOWS[frame] ?? FRAME_WINDOWS.classic
  const previewW = 190
  const previewFrame = { w: previewW, h: previewW * (frameSize.h / frameSize.w), src: frameSize.src }

  function clamp(v: number, lo: number, hi: number) {
    return Math.min(hi, Math.max(lo, v))
  }

  function maxOffset(z: number) {
    return Math.max(0, (z - 1) * 50)
  }

  function pickPhoto(file: File | undefined) {
    if (!file) return
    setPhotoFile(file)
    setPreview((prev) => {
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
    setZoom(1)
    setOffsetX(0)
    setOffsetY(0)
  }

  function handleZoom(v: number) {
    const max = maxOffset(v)
    setZoom(v)
    setOffsetX((x) => clamp(x, -max, max))
    setOffsetY((y) => clamp(y, -max, max))
  }

  function onDragStart(e: React.PointerEvent) {
    if (!preview) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offsetX, oy: offsetY }
  }

  function onDragMove(e: React.PointerEvent) {
    if (!dragRef.current || !previewBoxRef.current) return
    const rect = previewBoxRef.current.getBoundingClientRect()
    const dx = ((e.clientX - dragRef.current.x) / rect.width) * 100
    const dy = ((e.clientY - dragRef.current.y) / rect.height) * 100
    const max = maxOffset(zoom)
    setOffsetX(clamp(dragRef.current.ox + dx, -max, max))
    setOffsetY(clamp(dragRef.current.oy + dy, -max, max))
  }

  function onDragEnd() {
    dragRef.current = null
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setBusy(true)
    setError(null)
    try {
      const nextData: Record<string, unknown> = { ...data, caption, frame, photo_zoom: zoom, photo_x: offsetX, photo_y: offsetY }
      if (photoFile) {
        const ext = photoFile.name.split('.').pop()?.toLowerCase() || 'jpg'
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`
        const { error: uploadErr } = await supabase.storage.from('photos').upload(path, photoFile, { contentType: photoFile.type || undefined })
        if (uploadErr) throw uploadErr
        const { data: pub } = supabase.storage.from('photos').getPublicUrl(path)
        nextData.photo_url = pub.publicUrl
      }
      const nextLayout = { ...layout, r: rotation }
      const { error: updateErr } = await supabase
        .from('blocks')
        .update({ data: nextData as unknown as Json, layout: nextLayout as unknown as Json })
        .eq('id', block.id)
      if (updateErr) throw updateErr
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this photo')
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    setBusy(true)
    setError(null)
    try {
      const { error: deleteErr } = await supabase.from('blocks').delete().eq('id', block.id)
      if (deleteErr) throw deleteErr
      onDeleted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete this block')
      setBusy(false)
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="handle" />
        <h2>Edit photo</h2>
        <div className="sub">change the picture or its caption</div>

        <form onSubmit={save}>
          <div className="field">
            <label>Photo</label>
            <div style={{ position: 'relative', width: previewFrame.w, height: previewFrame.h, margin: '0 auto' }}>
              <div
                style={{
                  position: 'absolute', inset: 0, backgroundImage: `url(${previewFrame.src})`,
                  backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', zIndex: 2, pointerEvents: 'none',
                }}
              />
              <div
                ref={previewBoxRef}
                style={{
                  position: 'absolute', overflow: 'hidden', touchAction: 'none', zIndex: 1,
                  left: `${win.left}%`, right: `${win.right}%`, top: `${win.top}%`, bottom: `${win.bottom}%`,
                  background: preview ? '#000' : 'var(--paper-alt)',
                }}
                onPointerDown={onDragStart}
                onPointerMove={onDragMove}
                onPointerUp={onDragEnd}
                onPointerCancel={onDragEnd}
              >
                {preview ? (
                  <img
                    src={preview}
                    alt=""
                    draggable={false}
                    style={{
                      position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                      transform: `translate(${offsetX}%, ${offsetY}%) scale(${zoom})`,
                      cursor: 'grab', pointerEvents: 'none',
                    }}
                  />
                ) : (
                  <label style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <span style={{ fontSize: 11.5, color: 'var(--ink-soft)', fontStyle: 'italic', textAlign: 'center', padding: '0 6px' }}>tap to add a photo</span>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => pickPhoto(e.target.files?.[0])} />
                  </label>
                )}
              </div>
              <div className="cap" style={{ position: 'absolute', left: '7%', right: '7%', top: '85%', margin: 0, padding: 0, textAlign: 'center', color: 'oklch(24% 0.02 50)', fontSize: 13, lineHeight: 1.15, zIndex: 3 }}>
                {caption || 'a moment'}
              </div>
              {preview && (
                <label
                  style={{
                    position: 'absolute', right: `calc(${win.right}% + 6px)`, bottom: `calc(${win.bottom}% + 6px)`, background: 'oklch(20% 0 0 / 0.55)', color: '#fff',
                    fontSize: 10.5, fontWeight: 600, padding: '3px 8px', borderRadius: 20, cursor: 'pointer', zIndex: 4,
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  Replace
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => pickPhoto(e.target.files?.[0])} />
                </label>
              )}
            </div>
            {preview && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                <span style={{ fontSize: 15, color: 'var(--ink-soft)' }}>−</span>
                <input
                  type="range"
                  min={1}
                  max={2.5}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => handleZoom(parseFloat(e.target.value))}
                  style={{ flex: 1 }}
                />
                <span style={{ fontSize: 17, color: 'var(--ink-soft)' }}>+</span>
              </div>
            )}
            {preview && <div className="sub" style={{ marginTop: 4 }}>drag the photo to reposition it, use the slider to zoom</div>}
          </div>
          <div className="field">
            <label>Caption</label>
            <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="made it right as the sky went pink" />
          </div>

          <div className="field">
            <label>Frame</label>
            <div className="frame-picker">
              {FRAMES.map((f) => (
                <button
                  type="button"
                  key={f.key}
                  className={`frame-opt${frame === f.key ? ' sel' : ''}`}
                  onClick={() => setFrame(f.key)}
                >
                  <div className="sw" style={{ backgroundImage: `url(${FRAME_SIZES[f.key].src})` }} />
                  <span>{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Rotation</label>
            <div className="rotate-row">
              <button type="button" onClick={() => setRotation((r) => r - 4)} aria-label="Rotate left">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12a8 8 0 0 1 14-5.3M4 4v4h4" /></svg>
              </button>
              <span className="rotate-val">{Math.round(rotation)}°</span>
              <button type="button" onClick={() => setRotation((r) => r + 4)} aria-label="Rotate right">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12a8 8 0 0 1-14 5.3M20 20v-4h-4" /></svg>
              </button>
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}
          <button className="cta" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
          <button className="cancel" style={{ width: 'auto', borderTop: 'none', padding: 0 }} onClick={onClose}>Cancel</button>
          <button
            onClick={remove}
            disabled={busy}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--rose)', fontSize: 13.5, fontWeight: 600 }}
          >
            <TrashIcon /> Delete block
          </button>
        </div>
      </div>
    </div>
  )
}
