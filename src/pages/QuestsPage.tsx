import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { TabBar } from '../components/TabBar'
import { CheckIcon } from '../components/icons'
import type { Tables } from '../lib/database.types'

type Quest = Tables<'quests'>
type QuestItem = Tables<'quest_items'>

type QuestVM = Quest & { progress?: number; items?: QuestItem[] }

export function QuestsPage() {
  const { user } = useAuth()
  const [quests, setQuests] = useState<QuestVM[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    ;(async () => {
      const { data: qs } = await supabase
        .from('quests')
        .select('*')
        .eq('user_id', user.id)
        .order('status', { ascending: true })
        .order('created_at', { ascending: false })

      const enriched: QuestVM[] = []
      for (const q of qs ?? []) {
        if (q.kind === 'checklist') {
          const { data: items } = await supabase
            .from('quest_items')
            .select('*')
            .eq('quest_id', q.id)
            .order('sort_order', { ascending: true })
          enriched.push({ ...q, items: items ?? [] })
        } else {
          const rule = (q.rule ?? {}) as { block_type?: string }
          let progress = 0
          if (rule.block_type) {
            const { count } = await supabase
              .from('blocks')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .eq('type', rule.block_type as never)
            progress = count ?? 0
          }
          enriched.push({ ...q, progress })
        }
      }
      setQuests(enriched)
      setLoading(false)
    })()
  }, [user])

  const active = quests.filter((q) => q.status === 'active')
  const complete = quests.filter((q) => q.status === 'complete')

  return (
    <div className="screen">
      <div className="header">
        <h1>Quests</h1>
      </div>

      <div className="body" style={{ padding: '0 18px 100px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {loading && <div className="empty-state">loading…</div>}

        {!loading && quests.length === 0 && (
          <div className="empty-state">No quests yet.</div>
        )}

        {active.length > 0 && <div className="kicker">Active · {active.length}</div>}
        {active.map((q) => (
          <div className="qcard" key={q.id}>
            <div className="qhead">
              <div className="qtitle">
                <div className="name">{q.title}</div>
                {q.kind === 'count' && q.target && (
                  <div className="rule">reach {q.target}</div>
                )}
              </div>
            </div>
            {q.kind === 'count' && q.target ? (
              <>
                <div className="qbar"><i style={{ width: `${Math.min(100, ((q.progress ?? 0) / q.target) * 100)}%` }} /></div>
                <div className="qfoot"><span>{q.progress ?? 0} of {q.target}</span><span>{Math.round(Math.min(100, ((q.progress ?? 0) / q.target) * 100))}%</span></div>
              </>
            ) : (
              <div className="qcheck">
                {(q.items ?? []).map((it) => (
                  <div className={`row ${it.completed_at ? 'done' : ''}`} key={it.id}>
                    <div className="dot" style={{ background: it.completed_at ? 'var(--plum)' : 'var(--kraft-light)', border: it.completed_at ? 'none' : '1.5px solid var(--line)' }}>
                      {it.completed_at && <CheckIcon />}
                    </div>
                    {it.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {complete.length > 0 && <div className="kicker" style={{ marginTop: 2 }}>Complete · {complete.length}</div>}
        {complete.map((q) => (
          <div className="qcard done-card" key={q.id}>
            <div className="ribbon">DONE</div>
            <div className="check-badge"><CheckIcon /></div>
            <div className="name">{q.title}</div>
            {q.completed_at && <div className="meta" style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 3 }}>completed {new Date(q.completed_at).toLocaleDateString()}</div>}
          </div>
        ))}
      </div>

      <TabBar active="quests" />
    </div>
  )
}
