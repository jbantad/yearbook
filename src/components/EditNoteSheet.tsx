import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { BlockWithJoins } from './BlockCard'
import { TrashIcon } from './icons'
import { ColorSwatchPicker } from './ColorSwatchPicker'
import { PeopleTagFields } from './PeopleTagFields'
import { RichTextField, AlignToggle, isHtmlEmpty } from './RichTextField'
import { RotationField } from './RotationField'
import type { Json } from '../lib/database.types'
import { hashRotation } from '../lib/hash'
import { useBodyScrollLock } from '../lib/useBodyScrollLock'

export function EditNoteSheet({
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
  const [align, setAlign] = useState(data.align === 'center' ? 'center' : 'left')
  const [color, setColor] = useState(data.color as string | undefined)
  const [font, setFont] = useState((data.font as string) === 'mono' ? 'mono' : 'hand')
  const [transparent, setTransparent] = useState(data.transparent === true)
  const [cardScale, setCardScale] = useState(typeof data.card_scale === 'number' ? (data.card_scale as number) : 1)
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
      const nextData = { ...data, text, align, color, font, transparent, card_scale: cardScale }
      const nextLayout = { ...layout, r: rotation }
      const { error: updateErr } = await supabase
        .from('blocks')
        .update({ data: nextData as unknown as Json, layout: nextLayout as unknown as Json })
        .eq('id', block.id)
      if (updateErr) throw updateErr
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this note')
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
        <h2>Edit note</h2>
        <div className="sub">change the text or its angle on the page</div>

        <form onSubmit={save}>
          <div className="field">
            <label>Note</label>
            <RichTextField html={text} onChange={setText} placeholder="write something..." />
          </div>

          <div className="field">
            <label>Alignment</label>
            <AlignToggle align={align} onChange={setAlign} />
          </div>

          <div className="field">
            <label>Font</label>
            <div className="segmented" style={{ marginBottom: 0 }}>
              <button type="button" className={`seg${font === 'hand' ? ' sel' : ''}`} onClick={() => setFont('hand')} style={{ fontFamily: 'var(--font-hand)', fontStyle: 'normal', fontSize: 17 }}>
                Handwritten
              </button>
              <button type="button" className={`seg${font === 'mono' ? ' sel' : ''}`} onClick={() => setFont('mono')} style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 10, letterSpacing: '-0.03em', wordSpacing: '-0.15em' }}>
                Typed
              </button>
            </div>
          </div>

          <div className="toggle-row">
            <div>
              <div className="lbl">Remove background</div>
              <div className="hint">just the handwriting, no paper card</div>
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
            <label>Size</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 15, color: 'var(--ink-soft)' }}>−</span>
              <input
                type="range"
                min={0.6}
                max={2}
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
          <button className="cta" type="submit" disabled={busy || isHtmlEmpty(text)}>{busy ? 'Saving…' : 'Save changes'}</button>
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
