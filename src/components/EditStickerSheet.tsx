import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { BlockWithJoins } from './BlockCard'
import { TrashIcon } from './icons'
import type { Json } from '../lib/database.types'
import { hashRotation } from '../lib/hash'
import { RotationField } from './RotationField'
import { STICKER_BASE_WIDTH, stickerSelectionFromData, stickerSelectionImage, stickerSelectionToData, type StickerSelection } from '../lib/stickers'
import { StickerPicker } from './StickerPicker'
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
  const [sticker, setSticker] = useState<StickerSelection | null>(stickerSelectionFromData(data))
  const [cardScale, setCardScale] = useState(typeof data.card_scale === 'number' ? (data.card_scale as number) : 1)
  const [rotation, setRotation] = useState(typeof layout.r === 'number' ? layout.r : hashRotation(block.id))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const previewSticker = stickerSelectionImage(sticker)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!sticker) return
    setBusy(true)
    setError(null)
    try {
      const nextData = { ...data, ...stickerSelectionToData(sticker), card_scale: cardScale }
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

          <StickerPicker value={sticker} onChange={setSticker} />

          <div className="field">
            <label>Size</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 15, color: 'var(--ink-soft)' }}>−</span>
              <input
                type="range"
                min={0.5}
                max={4}
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
            <RotationField value={rotation} onChange={setRotation} />
          </div>

          {error && <div className="auth-error">{error}</div>}
          <button className="cta" type="submit" disabled={busy || !sticker}>{busy ? 'Saving…' : 'Save changes'}</button>
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
