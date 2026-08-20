import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { BlockWithJoins } from './BlockCard'
import { TrashIcon } from './icons'
import type { Json } from '../lib/database.types'
import { hashRotation } from '../lib/hash'

export function EditTextSheet({
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
  const style = (data.style as string) || 'headline'
  const [content, setContent] = useState((data.content as string) || '')
  const [rotation, setRotation] = useState(typeof layout.r === 'number' ? layout.r : hashRotation(block.id))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const nextData = { ...data, content }
      const nextLayout = { ...layout, r: rotation }
      const { error: updateErr } = await supabase
        .from('blocks')
        .update({ data: nextData as unknown as Json, layout: nextLayout as unknown as Json })
        .eq('id', block.id)
      if (updateErr) throw updateErr
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this text')
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
        <h2>Edit {style === 'label' ? 'label' : 'headline'}</h2>
        <div className="sub">{style === 'label' ? 'short — shows as label-maker tiles' : 'a title for this page'}</div>

        <form onSubmit={save}>
          <div className="field">
            <label>Text</label>
            <input value={content} onChange={(e) => setContent(e.target.value)} placeholder={style === 'label' ? 'CAMPFIRE NIGHT' : 'Lake Weekend'} required autoFocus />
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
