import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { PlusIcon } from './icons'
import type { Tables } from '../lib/database.types'

type Person = Tables<'people'>

// Tagging people is an attribute of a photo or note, not a block of its
// own — this renders the chip picker (plus inline "new person" add) shared
// by AddSheet's photo/note branches and EditPhotoSheet/EditNoteSheet.
export function PeopleTagFields({
  taggedIds,
  onChange,
}: {
  taggedIds: string[]
  onChange: (ids: string[]) => void
}) {
  const { user } = useAuth()
  const [people, setPeople] = useState<Person[]>([])
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('people').select('*').eq('user_id', user.id).order('display_name').then(({ data }) => setPeople(data ?? []))
  }, [user])

  function toggle(id: string) {
    onChange(taggedIds.includes(id) ? taggedIds.filter((x) => x !== id) : [...taggedIds, id])
  }

  async function addPerson() {
    if (!user || !newName.trim()) return
    setBusy(true)
    try {
      const name = newName.trim()
      const existing = people.find((p) => p.display_name.toLowerCase() === name.toLowerCase())
      let person = existing
      if (!person) {
        const { data: created, error } = await supabase.from('people').insert({ user_id: user.id, display_name: name }).select('*').single()
        if (error) throw error
        person = created
        setPeople((prev) => [...prev, created].sort((a, b) => a.display_name.localeCompare(b.display_name)))
      }
      if (person && !taggedIds.includes(person.id)) onChange([...taggedIds, person.id])
      setNewName('')
      setAdding(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="field">
      <label>Tag people (optional)</label>
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
      {adding && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginTop: 8 }}>
          <div style={{ flex: 1 }}>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="name" />
          </div>
          <button type="button" className="cta" style={{ margin: 0, width: 'auto', padding: '11px 16px' }} onClick={addPerson} disabled={busy}>Add</button>
        </div>
      )}
    </div>
  )
}
