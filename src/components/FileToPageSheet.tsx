import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { BlockWithJoins } from './BlockCard'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export async function getOrCreateDayPage(userId: string, dateISO: string) {
  const { data: existing } = await supabase
    .from('pages')
    .select('id')
    .eq('user_id', userId)
    .eq('kind', 'day')
    .eq('page_date', dateISO)
    .maybeSingle()
  if (existing) return existing.id
  const { data: created, error } = await supabase
    .from('pages')
    .insert({ user_id: userId, kind: 'day', page_date: dateISO })
    .select('id')
    .single()
  if (error) throw error
  return created.id
}

export function FileToPageSheet({
  block,
  onClose,
  onFiled,
}: {
  block: BlockWithJoins
  onClose: () => void
  onFiled: (dateISO: string) => void
}) {
  const { user } = useAuth()
  const [mode, setMode] = useState<'today' | 'custom'>('today')
  const [date, setDate] = useState(todayISO())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fileTo(dateISO: string) {
    if (!user) return
    setBusy(true)
    setError(null)
    try {
      const pageId = await getOrCreateDayPage(user.id, dateISO)
      const { error: updateErr } = await supabase.from('blocks').update({ page_id: pageId }).eq('id', block.id)
      if (updateErr) throw updateErr
      onFiled(dateISO)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not file this block')
      setBusy(false)
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="handle" />
        <h2>File to a page</h2>
        <div className="sub">choose where this moment lives</div>

        <div className="segmented">
          <button type="button" className={`seg${mode === 'today' ? ' sel' : ''}`} onClick={() => setMode('today')} disabled={busy}>Today</button>
          <button type="button" className={`seg${mode === 'custom' ? ' sel' : ''}`} onClick={() => setMode('custom')} disabled={busy}>Choose a date</button>
        </div>

        {mode === 'today' ? (
          <div className="dest-card">
            <div className="day">{formatDate(todayISO())}</div>
            <div className="hint">matches when it was captured</div>
          </div>
        ) : (
          <div className="field">
            <label>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        )}

        {error && <div className="auth-error">{error}</div>}
        <button className="cta" onClick={() => fileTo(mode === 'today' ? todayISO() : date)} disabled={busy}>
          {busy ? 'Filing…' : 'File to this page'}
        </button>
        <button className="cancel" onClick={onClose}>Cancel</button>
      </div>
    </div>
  )
}
