import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { BlockWithJoins } from './BlockCard'
import { TrashIcon, PlusIcon } from './icons'
import { ColorSwatchPicker } from './ColorSwatchPicker'
import type { Json, Tables } from '../lib/database.types'
import { hashRotation } from '../lib/hash'

type Person = Tables<'people'>

export function EditPersonSheet({
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
  const [people, setPeople] = useState<Person[]>([])
  const [taggedIds, setTaggedIds] = useState<string[]>((block.people ?? []).map((p) => p.id))
  const [color, setColor] = useState(data.color as string | undefined)
  const [rotation, setRotation] = useState(typeof layout.r === 'number' ? layout.r : hashRotation(block.id))
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    supabase.from('people').select('*').eq('user_id', user.id).order('display_name').then(({ data }) => setPeople(data ?? []))
  }, [user])

  function toggle(id: string) {
    setTaggedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function addPerson() {
    if (!user || !newName.trim()) return
    setBusy(true)
    setError(null)
    try {
      const { data: created, error: personErr } = await supabase
        .from('people')
        .insert({ user_id: user.id, display_name: newName.trim() })
        .select('*')
        .single()
      if (personErr) throw personErr
      setPeople((prev) => [...prev, created].sort((a, b) => a.display_name.localeCompare(b.display_name)))
      setTaggedIds((prev) => [...prev, created.id])
      setNewName('')
      setAdding(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add this person')
    } finally {
      setBusy(false)
    }
  }

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
      const nextData = { ...data, color }
      const nextLayout = { ...layout, r: rotation }
      const { error: updateErr } = await supabase
        .from('blocks')
        .update({ data: nextData as unknown as Json, layout: nextLayout as unknown as Json })
        .eq('id', block.id)
      if (updateErr) throw updateErr
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save who was tagged')
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
        <h2>Edit who's tagged</h2>
        <div className="sub">choose who this moment was with</div>

        <form onSubmit={save}>
          <div className="field">
            <label>Tagged</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {people.map((p) => {
                const sel = taggedIds.includes(p.id)
                return (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => toggle(p.id)}
                    className={`chip${sel ? ' active' : ''}`}
                    style={{ background: sel ? 'var(--ink)' : 'none' }}
                  >
                    {p.display_name}
                  </button>
                )
              })}
              {!adding && (
                <button type="button" className="chip" onClick={() => setAdding(true)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <PlusIcon /> New person
                </button>
              )}
            </div>
          </div>

          {adding && (
            <div className="field" style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label>Name</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
              </div>
              <button type="button" className="cta" style={{ margin: 0, width: 'auto', padding: '11px 16px' }} onClick={addPerson} disabled={busy}>Add</button>
            </div>
          )}

          <div className="field">
            <label>Color</label>
            <ColorSwatchPicker value={color} onChange={setColor} />
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
