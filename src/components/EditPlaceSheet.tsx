import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { BlockWithJoins } from './BlockCard'
import { TrashIcon, PlaceIcon } from './icons'
import { ColorSwatchPicker } from './ColorSwatchPicker'
import type { Json } from '../lib/database.types'
import { hashRotation } from '../lib/hash'
import pinPhoto from '../assets/pin-trimmed.png'

export function EditPlaceSheet({
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
  const data = (block.data ?? {}) as Record<string, unknown>
  const layout = (block.layout ?? {}) as { x?: number; y?: number; r?: number }
  const [name, setName] = useState(block.place?.name ?? '')
  const [color, setColor] = useState(data.color as string | undefined)
  const [pinStyle, setPinStyle] = useState(data.pin_style === 'pin' ? 'pin' : 'outline')
  const [rotation, setRotation] = useState(typeof layout.r === 'number' ? layout.r : hashRotation(block.id))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (block.place_id && name.trim()) {
        const { error: placeErr } = await supabase.from('places').update({ name: name.trim() }).eq('id', block.place_id)
        if (placeErr) throw placeErr
      }
      const nextData = { ...data, color, pin_style: pinStyle }
      const nextLayout = { ...layout, r: rotation }
      const { error: updateErr } = await supabase
        .from('blocks')
        .update({ data: nextData as unknown as Json, layout: nextLayout as unknown as Json })
        .eq('id', block.id)
      if (updateErr) throw updateErr
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this place')
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
        <h2>Edit place</h2>
        <div className="sub">renaming updates it everywhere it's tagged</div>

        <form onSubmit={save}>
          <div className="field">
            <label>Place name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="field">
            <label>Style</label>
            <div className="frame-picker">
              <button
                type="button"
                className={`frame-opt${pinStyle === 'outline' ? ' sel' : ''}`}
                onClick={() => setPinStyle('outline')}
              >
                <div className="sw" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PlaceIcon color="var(--block-place)" />
                </div>
                <span>Icon</span>
              </button>
              <button
                type="button"
                className={`frame-opt${pinStyle === 'pin' ? ' sel' : ''}`}
                onClick={() => setPinStyle('pin')}
              >
                <div className="sw" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={pinPhoto} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                </div>
                <span>Pin</span>
              </button>
            </div>
          </div>

          <div className="field">
            <label>Color</label>
            <ColorSwatchPicker value={color} onChange={setColor} />
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
