import { useRef } from 'react'
import { FRAME_SIZES, FRAME_WINDOWS } from '../lib/frames'

const FRAMES: { key: string; label: string }[] = [
  { key: 'classic', label: 'Classic' },
  { key: 'tall', label: 'Tall' },
  { key: 'square', label: 'Square' },
]

export function clampOffset(v: number, zoom: number) {
  const max = Math.max(25, (zoom - 1) * 60)
  return Math.min(max, Math.max(-max, v))
}

// Shared by AddSheet (creating a photo) and EditPhotoSheet (editing one) so
// the frame/pan-zoom/rotation controls — and their fiddly geometry — only
// exist in one place.
export function PhotoFields({
  preview,
  onPickPhoto,
  caption,
  onCaptionChange,
  frame,
  onFrameChange,
  zoom,
  onZoomChange,
  offsetX,
  offsetY,
  onOffsetChange,
  rotation,
  onRotationChange,
}: {
  preview: string | null
  onPickPhoto: (file: File | undefined) => void
  caption: string
  onCaptionChange: (v: string) => void
  frame: string
  onFrameChange: (v: string) => void
  zoom: number
  onZoomChange: (v: number) => void
  offsetX: number
  offsetY: number
  onOffsetChange: (x: number, y: number) => void
  rotation: number
  onRotationChange: (updater: (r: number) => number) => void
}) {
  const previewBoxRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)

  const frameSize = FRAME_SIZES[frame] ?? FRAME_SIZES.classic
  const win = FRAME_WINDOWS[frame] ?? FRAME_WINDOWS.classic
  const previewW = 190
  const previewFrame = { w: previewW, h: previewW * (frameSize.h / frameSize.w), src: frameSize.src }

  function handleZoom(v: number) {
    onZoomChange(v)
    onOffsetChange(clampOffset(offsetX, v), clampOffset(offsetY, v))
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
    onOffsetChange(clampOffset(dragRef.current.ox + dx, zoom), clampOffset(dragRef.current.oy + dy, zoom))
  }

  function onDragEnd() {
    dragRef.current = null
  }

  return (
    <>
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
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => onPickPhoto(e.target.files?.[0])} />
              </label>
            )}
          </div>
          {caption && (
            <div
              className="cap"
              style={{
                position: 'absolute', left: '7%', right: '7%', bottom: 0, top: `calc(100% - ${win.bottom}%)`,
                margin: 0, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                color: 'oklch(24% 0.02 50)', fontSize: 15, lineHeight: 1.15, zIndex: 3,
              }}
            >
              {caption}
            </div>
          )}
          {preview && (
            <label
              style={{
                position: 'absolute', right: `calc(${win.right}% + 6px)`, bottom: `calc(${win.bottom}% + 6px)`, background: 'oklch(20% 0 0 / 0.55)', color: '#fff',
                fontSize: 10.5, fontWeight: 600, padding: '3px 8px', borderRadius: 20, cursor: 'pointer', zIndex: 4,
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              Replace
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => onPickPhoto(e.target.files?.[0])} />
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
        <label>Caption (optional)</label>
        <input value={caption} onChange={(e) => onCaptionChange(e.target.value)} placeholder="add a caption" />
      </div>

      <div className="field">
        <label>Frame</label>
        <div className="frame-picker">
          {FRAMES.map((f) => (
            <button
              type="button"
              key={f.key}
              className={`frame-opt${frame === f.key ? ' sel' : ''}`}
              onClick={() => onFrameChange(f.key)}
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
          <button type="button" onClick={() => onRotationChange((r) => r - 4)} aria-label="Rotate left">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12a8 8 0 0 1 14-5.3M4 4v4h4" /></svg>
          </button>
          <span className="rotate-val">{Math.round(rotation)}°</span>
          <button type="button" onClick={() => onRotationChange((r) => r + 4)} aria-label="Rotate right">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12a8 8 0 0 1-14 5.3M20 20v-4h-4" /></svg>
          </button>
        </div>
      </div>
    </>
  )
}
