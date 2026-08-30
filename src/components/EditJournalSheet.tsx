import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { BlockWithJoins } from './BlockCard'
import { TrashIcon } from './icons'
import { ColorSwatchPicker } from './ColorSwatchPicker'
import { PeopleTagFields } from './PeopleTagFields'
import type { Json } from '../lib/database.types'
import { hashRotation } from '../lib/hash'
import { useBodyScrollLock } from '../lib/useBodyScrollLock'

export function EditJournalSheet({
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
  const [text, setText] = useState((data.text as string) || '')
  const [color, setColor] = useState(data.color as string | undefined)
  const [font, setFont] = useState((data.font as string) === 'mono' ? 'mono' : 'hand')
  const [transparent, setTransparent] = useState(data.transparent === true)
  const [width, setWidth] = useState(typeof data.width === 'number' ? (data.width as number) : 220)
  const [rotation, setRotation] = useState(typeof layout.r === 'number' ? layout.r : hashRotation(block.id))
  const [taggedIds, setTaggedIds] = useState<string[]>((block.people ?? []).map((p) => p.id))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const { error: delErr } = await supabase.from('block_people').delete().eq('block_id', block.id)
      if (delErr) throw delErr
      if (taggedIds.length > 0) {
        const { error: insErr } = await supabase.from('block_people').insert(taggedIds.map((person_id) => ({ block_id: block.id, person_id })))
        if (insErr) throw insErr
      }
      const nextData = { ...data, text, color, font, transparent, width }
      const nextLayout = { ...layout, r: rotation }
      const { error: updateErr } = await supabase
        .from('blocks')
        .update({ data: nextData as unknown as Json, layout: nextLayout as unknown as Json })
        .eq('id', block.id)
      if (updateErr) throw updateErr
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this journal entry')
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
        <h2>Edit journal</h2>
        <div className="sub">change the writing, its width, or its angle</div>

        <form onSubmit={save}>
          <div className="field">
            <label>Entry</label>
            <textarea value={text} onChange={(e) => setText(e.target.value)} required rows={6} />
          </div>

          <div className="field">
            <label>Font</label>
            <div className="segmented" style={{ marginBottom: 0 }}>
              <button type="button" className={`seg${font === 'hand' ? ' sel' : ''}`} onClick={() => setFont('hand')} style={{ fontFamily: 'var(--font-hand)', fontStyle: 'normal', fontSize: 17 }}>
                Handwritten
              </button>
              <button type="button" className={`seg${font === 'mono' ? ' sel' : ''}`} onClick={() => setFont('mono')} style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 12 }}>
                Typed
              </button>
            </div>
          </div>

          <div className="toggle-row">
            <div>
              <div className="lbl">Remove background</div>
              <div className="hint">just the writing, no paper card</div>
            </div>
            <button type="button" className={`switch${transparent ? ' on' : ''}`} onClick={() => setTransparent((t) => !t)} aria-label="Toggle background">
              <div className="knob" />
            </button>
          </div>

          {!transparent && (
            <div className="field">
              <label>Color</label>
              <ColorSwatchPicker value={color} onChange={setColor} />
            </div>
          )}

          <PeopleTagFields taggedIds={taggedIds} onChange={setTaggedIds} />

          <div className="field">
            <label>Width</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 15, color: 'var(--ink-soft)' }}>−</span>
              <input
                type="range"
                min={140}
                max={360}
                step={5}
                value={width}
                onChange={(e) => setWidth(parseFloat(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: 17, color: 'var(--ink-soft)' }}>+</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 6, fontStyle: 'italic' }}>
              resizes the box only — letters stay this size, text rewraps
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
