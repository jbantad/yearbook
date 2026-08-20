import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { TabBar } from '../components/TabBar'
import { ChevronIcon, PlusIcon } from '../components/icons'
import type { Tables } from '../lib/database.types'

type Person = Tables<'people'> & { count: number }

export function PeoplePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    if (!user) return
    setLoading(true)
    const { data: ppl } = await supabase.from('people').select('*').eq('user_id', user.id).order('display_name')
    const { data: links } = await supabase
      .from('block_people')
      .select('person_id, blocks!inner(user_id)')
      .eq('blocks.user_id', user.id)
    const counts: Record<string, number> = {}
    for (const l of links ?? []) counts[l.person_id] = (counts[l.person_id] ?? 0) + 1
    setPeople((ppl ?? []).map((p) => ({ ...p, count: counts[p.id] ?? 0 })))
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  async function addPerson(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !name.trim()) return
    setBusy(true)
    await supabase.from('people').insert({ user_id: user.id, display_name: name.trim(), relationship: relationship.trim() || null })
    setBusy(false)
    setName('')
    setRelationship('')
    setAdding(false)
    load()
  }

  return (
    <div className="screen">
      <div className="header">
        <h1>People</h1>
        <div className="sub">{loading ? 'loading…' : `${people.length} people tagged`}</div>
      </div>

      <div className="plist">
        {people.map((p) => (
          <button className="prow" key={p.id} onClick={() => navigate(`/people/${p.id}`)}>
            <div className="av" style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}>{p.display_name[0]?.toUpperCase()}</div>
            <div className="body">
              <div className="nm">{p.display_name}</div>
              <div className="meta">{[p.relationship, `${p.count} moment${p.count === 1 ? '' : 's'} together`].filter(Boolean).join(' · ')}</div>
            </div>
            <ChevronIcon />
          </button>
        ))}

        {!adding ? (
          <button className="padd" onClick={() => setAdding(true)}>
            <div className="plus"><PlusIcon /></div>
            <span>Add someone</span>
          </button>
        ) : (
          <form onSubmit={addPerson} style={{ background: 'var(--card)', borderRadius: 14, padding: 14 }}>
            <div className="field">
              <label>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
            </div>
            <div className="field">
              <label>Relationship (optional)</label>
              <input value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="sister, friend…" />
            </div>
            <button className="cta" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Add'}</button>
            <button type="button" className="cancel" onClick={() => setAdding(false)}>Cancel</button>
          </form>
        )}
      </div>

      <TabBar active="profile" />
    </div>
  )
}
