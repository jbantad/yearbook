import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { BlockWithJoins } from './BlockCard'
import { TrashIcon } from './icons'
import type { Json } from '../lib/database.types'
import { hashRotation } from '../lib/hash'
import { STICKERS, STICKER_BASE_WIDTH, STICKER_BY_KEY } from '../lib/stickers'
import { useBodyScrollLock } from '../lib/useBodyScrollLock'

export function EditStickerSheet({
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
  useBodyScrollLock()
  const data = (block.data ?? {}) as Record<string, unknown>
  const layout = (block.layout ?? {}) as { x?: number; y?: number; r?: number }
  const [stickerKey, setStickerKey] = useState((data.sticker as string) || STICKERS[0].key)
  const [cardScale, setCardScale] = useState(typeof data.card_scale === 'number' ? (data.card_scale as number) : 1)
  const [rotation, setRotation] = useState(typeof layout.r === 'number' ? layout.r : hashRotation(block.id))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const previewSticker = STICKER_BY_KEY[stickerKey]

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const nextData = { ...data, sticker: stickerKey, card_scale: cardScale }
      const nextLayout = { ...layout, r: rotation }
      const { error: updateErr } = await supabase
        .from('blocks')
        .update({ data: nextData as unknown as Json, layout: nextLayout as unknown as Json })
        .eq('id', block.id)
      if (updateErr) throw updateErr
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this sticker')
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
        <h2>Edit sticker</h2>
        <div className="sub">swap it, resize it, or change its angle</div>

        <form onSubmit={save}>
          {previewSticker && (
            <div
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', height: 140,
                background: 'var(--paper-alt)', borderRadius: 10, marginBottom: 14, overflow: 'hidden',
              }}
            >
              <div
                className="sticker-block"
                style={{
                  width: STICKER_BASE_WIDTH,
                  height: STICKER_BASE_WIDTH * (previewSticker.h / previewSticker.w),
                  transform: `rotate(${rotation}deg) scale(${cardScale})`,
                }}
              >
                <img src={previewSticker.src} alt="" />
              </div>
            </div>
          )}

          <div className="field">
            <label>Sticker</label>
            <div className="sticker-grid">
              {STICKERS.map((s) => (
                <button
                  type="button"
                  key={s.key}
                  className={`sticker-opt${stickerKey === s.key ? ' sel' : ''}`}
                  onClick={() => setStickerKey(s.key)}
                >
                  <img src={s.src} alt="" />
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Size</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 15, color: 'var(--ink-soft)' }}>−</span>
              <input
                type="range"
                min={0.5}
                max={2.5}
                step={0.05}
                value={cardScale}
                onChange={(e) => setCardScale(parseFloat(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: 17, color: 'var(--ink-soft)' }}>+</span>
            </div>
          </div>

          <div className="field">
            <label>Rotation</label>
            <div className="rotate-row">
              <button type="button" onClick={() => setRotation((r) => r - 1)} aria-label="Rotate left">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12a8 8 0 0 1 14-5.3M4 4v4h4" /></svg>
              </button>
              <span className="rotate-val">{Math.round(rotation)}°</span>
              <button type="button" onClick={() => setRotation((r) => r + 1)} aria-label="Rotate right">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12a8 8 0 0 1-14 5.3M20 20v-4h-4" /></svg>
              </button>
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}
          <button className="cta" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
          <button className="cancel" style={{ width: 'auto', marginTop: 0, borderTop: 'none', padding: 0 }} onClick={onClose}>Cancel</button>
          <button
            className="delete-block-btn"
            onClick={remove}
            disabled={busy}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--rose)', fontSize: 13.5, fontWeight: 600 }}
          >
            <TrashIcon /> Delete
          </button>
        </div>
      </div>
    </div>
  )
}
