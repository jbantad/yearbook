import { useRef, useState } from 'react'
import { FRAME_SIZES, FRAME_WINDOWS, TRIPTYCH_WINDOWS, frameChromeStyle, frameOverlayStyle, frameContainerStyle } from '../lib/frames'
import { RotationField } from './RotationField'

const FRAMES: { key: string; label: string }[] = [
  { key: 'classic', label: 'Classic' },
  { key: 'tall', label: 'Tall' },
  { key: 'square', label: 'Square' },
  { key: 'white', label: 'White' },
  { key: 'triptych', label: 'Triptych' },
]

// The image is rendered at scale(zoom * PHOTO_BASE_SCALE); baking in a
// small always-on overscan means there's a little room to reposition even
// at the zoom slider's minimum, without ever revealing empty space beyond
// the image's edges (which a same-as-container base scale would allow).
export const PHOTO_BASE_SCALE = 1.12

export function clampOffset(v: number, zoom: number) {
  const effective = zoom * PHOTO_BASE_SCALE
  const max = Math.max(0, (effective - 1) * 50)
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
  triptychPreviews,
  onPickTriptychPhoto,
  triptychZooms,
  triptychOffsets,
  onTriptychZoomChange,
  onTriptychOffsetChange,
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
  triptychPreviews?: (string | null)[]
  onPickTriptychPhoto?: (index: number, file: File | undefined) => void
  triptychZooms?: number[]
  triptychOffsets?: { x: number; y: number }[]
  onTriptychZoomChange?: (index: number, v: number) => void
  onTriptychOffsetChange?: (index: number, x: number, y: number) => void
}) {
  const previewBoxRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const [selectedSlot, setSelectedSlot] = useState(0)
  const triBoxRefs = useRef<(HTMLDivElement | null)[]>([null, null, null])
  const triDragRef = useRef<{ index: number; x: number; y: number; ox: number; oy: number } | null>(null)

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

  if (frame === 'triptych') {
    const previews = triptychPreviews ?? [null, null, null]
    const triZooms = triptychZooms ?? [1, 1, 1]
    const triOffsets = triptychOffsets ?? [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }]

    function handleTriZoom(v: number) {
      onTriptychZoomChange?.(selectedSlot, v)
      const off = triOffsets[selectedSlot] ?? { x: 0, y: 0 }
      onTriptychOffsetChange?.(selectedSlot, clampOffset(off.x, v), clampOffset(off.y, v))
    }

    function onTriDragStart(i: number, e: React.PointerEvent) {
      if (!previews[i]) return
      setSelectedSlot(i)
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      const off = triOffsets[i] ?? { x: 0, y: 0 }
      triDragRef.current = { index: i, x: e.clientX, y: e.clientY, ox: off.x, oy: off.y }
    }

    function onTriDragMove(e: React.PointerEvent) {
      const d = triDragRef.current
      const box = d ? triBoxRefs.current[d.index] : null
      if (!d || !box) return
      const rect = box.getBoundingClientRect()
      const dx = ((e.clientX - d.x) / rect.width) * 100
      const dy = ((e.clientY - d.y) / rect.height) * 100
      const z = triZooms[d.index] ?? 1
      onTriptychOffsetChange?.(d.index, clampOffset(d.ox + dx, z), clampOffset(d.oy + dy, z))
    }

    function onTriDragEnd() {
      triDragRef.current = null
    }

    return (
      <>
        <div className="field">
          <div style={{ position: 'relative', width: previewFrame.w, height: previewFrame.h, margin: '0 auto' }}>
            <div
              style={{
                position: 'absolute', inset: 0, backgroundImage: `url(${previewFrame.src})`,
                backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', zIndex: 2, pointerEvents: 'none',
              }}
            />
            {TRIPTYCH_WINDOWS.map((win, i) => {
              const off = triOffsets[i] ?? { x: 0, y: 0 }
              const z = triZooms[i] ?? 1
              return (
                <div
                  key={i}
                  ref={(el) => { triBoxRefs.current[i] = el }}
                  style={{
                    position: 'absolute', overflow: 'hidden', touchAction: 'none', zIndex: 1,
                    left: `${win.left}%`, right: `${win.right}%`, top: `${win.top}%`, bottom: `${win.bottom}%`,
                    background: previews[i] ? '#000' : 'var(--paper-alt)',
                    outline: selectedSlot === i && previews[i] ? '2px solid var(--amber)' : 'none',
                    outlineOffset: -2,
                  }}
                  onPointerDown={(e) => onTriDragStart(i, e)}
                  onPointerMove={onTriDragMove}
                  onPointerUp={onTriDragEnd}
                  onPointerCancel={onTriDragEnd}
                >
                  {previews[i] ? (
                    <>
                      <img
                        src={previews[i] as string}
                        alt=""
                        draggable={false}
                        style={{
                          position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                          transform: `translate(${off.x}%, ${off.y}%) scale(${z * PHOTO_BASE_SCALE})`,
                          cursor: 'grab', pointerEvents: 'none',
                        }}
                      />
                      <label
                        style={{
                          position: 'absolute', right: 3, bottom: 3, width: 18, height: 18, borderRadius: '50%',
                          background: 'oklch(20% 0 0 / 0.55)', color: '#fff', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', cursor: 'pointer', zIndex: 2,
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 10, height: 10 }}><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" /></svg>
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { onPickTriptychPhoto?.(i, e.target.files?.[0]); setSelectedSlot(i) }} />
                      </label>
                    </>
                  ) : (
                    <label style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <span style={{ fontSize: 10, color: 'var(--ink-soft)', fontStyle: 'italic', textAlign: 'center', padding: '0 4px' }}>tap to add</span>
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { onPickTriptychPhoto?.(i, e.target.files?.[0]); setSelectedSlot(i) }} />
                    </label>
                  )}
                </div>
              )
            })}
            {caption && (
              <div
                className="cap"
                style={{
                  position: 'absolute', left: '7%', right: '7%', bottom: 0, top: `calc(100% - ${TRIPTYCH_WINDOWS[2].bottom}%)`,
                  margin: 0, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                  color: 'oklch(24% 0.02 50)', fontSize: 15, lineHeight: 1.15, zIndex: 3,
                }}
              >
                {caption}
              </div>
            )}
          </div>
          {previews.some(Boolean) && (
            <>
              <label style={{ marginTop: 10, display: 'block' }}>Size (selected square)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 15, color: 'var(--ink-soft)' }}>−</span>
                <input
                  type="range"
                  min={1}
                  max={2.5}
                  step={0.05}
                  value={triZooms[selectedSlot] ?? 1}
                  onChange={(e) => handleTriZoom(parseFloat(e.target.value))}
                  style={{ flex: 1 }}
                  disabled={!previews[selectedSlot]}
                />
                <span style={{ fontSize: 17, color: 'var(--ink-soft)' }}>+</span>
              </div>
            </>
          )}
          <div className="sub" style={{ marginTop: 8 }}>tap a square to add or select its photo — drag to reposition, use the slider to zoom</div>
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
                <div className="sw" style={frameChromeStyle(f.key)} />
                <span>{f.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Rotation</label>
          <RotationField value={rotation} onChange={(v) => onRotationChange(() => v)} />
        </div>
      </>
    )
  }

  return (
    <>
      <div className="field">
        <div style={{ position: 'relative', width: previewFrame.w, height: previewFrame.h, margin: '0 auto', ...frameContainerStyle(frame) }}>
          <div
            style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', ...frameOverlayStyle(frame) }}
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
                  transform: `translate(${offsetX}%, ${offsetY}%) scale(${zoom * PHOTO_BASE_SCALE})`,
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
          <>
            <label style={{ marginTop: 10, display: 'block' }}>Size</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
          </>
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
              <div className="sw" style={frameChromeStyle(f.key)} />
              <span>{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Rotation</label>
        <RotationField value={rotation} onChange={(v) => onRotationChange(() => v)} />
      </div>
    </>
  )
}
