import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { BlockWithJoins } from './BlockCard'
import { CheckIcon, ChevronIcon } from './icons'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
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
  const [customDate, setCustomDate] = useState(false)
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

        {!customDate ? (
          <>
            <button className="opt-row sel" onClick={() => fileTo(todayISO())} disabled={busy}>
              <div className="thumb">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /></svg>
              </div>
              <div className="body">
                <div className="name">Today</div>
                <div className="hint">matches when it was captured</div>
              </div>
              <div className="radio"><CheckIcon /></div>
            </button>
            <button className="opt-row" onClick={() => setCustomDate(true)} disabled={busy}>
              <div className="thumb">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--ink-soft)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /><path d="M8 14h2M8 17h5" /></svg>
              </div>
              <div className="body">
                <div className="name">Choose a different day</div>
                <div className="hint">another date on the calendar</div>
              </div>
              <ChevronIcon />
            </button>
          </>
        ) : (
          <div className="field">
            <label>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <button className="cta" style={{ marginTop: 14 }} onClick={() => fileTo(date)} disabled={busy}>
              {busy ? 'Filing…' : 'File to this page'}
            </button>
          </div>
        )}

        {error && <div className="auth-error">{error}</div>}
        <button className="cancel" onClick={onClose}>Cancel</button>
      </div>
    </div>
  )
}
