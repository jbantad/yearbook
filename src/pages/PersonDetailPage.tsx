import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { TabBar } from '../components/TabBar'
import { BackIcon, NoteIcon, PhotoIcon } from '../components/icons'
import type { Tables } from '../lib/database.types'

type Person = Tables<'people'>
type Block = Tables<'blocks'>

export function PersonDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [person, setPerson] = useState<Person | null>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    ;(async () => {
      const { data: p } = await supabase.from('people').select('*').eq('id', id).maybeSingle()
      setPerson(p)
      const { data: links } = await supabase.from('block_people').select('block_id').eq('person_id', id)
      const blockIds = (links ?? []).map((l) => l.block_id)
      if (blockIds.length) {
        const { data: bs } = await supabase.from('blocks').select('*').in('id', blockIds).order('captured_at', { ascending: false })
        setBlocks(bs ?? [])
      } else {
        setBlocks([])
      }
      setLoading(false)
    })()
  }, [id])

  if (loading) return <div className="screen"><div className="empty-state">loading…</div></div>
  if (!person) return <div className="screen"><div className="empty-state">Person not found.</div></div>

  return (
    <div className="screen">
      <div className="nav">
        <button onClick={() => navigate(-1)}><BackIcon /></button>
      </div>

      <div className="hero">
        <div className="av">{person.display_name[0]?.toUpperCase()}</div>
        <h1>{person.display_name}</h1>
        {person.relationship && <div className="rel">{person.relationship}</div>}
        <div className="stat">{blocks.length} moment{blocks.length === 1 ? '' : 's'} together</div>
      </div>

      <div className="shelf-grid">
        {blocks.map((b) => {
          const data = (b.data ?? {}) as Record<string, unknown>
          const hue = Math.abs(b.id.charCodeAt(0) * 7) % 360
          const title = (data.caption as string) || (data.text as string) || (data.dish as string) || 'a moment'
          const dateStr = new Date(b.captured_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
          return (
            <div className="mcard" key={b.id}>
              <div className="art" style={{ background: `linear-gradient(160deg, oklch(58% 0.1 ${hue}), oklch(30% 0.06 ${hue}))` }}>
                {b.type === 'photo' ? <PhotoIcon /> : <NoteIcon />}
              </div>
              <div className="stub">
                <div className="t">{title}</div>
                <div className="d">{dateStr}</div>
              </div>
            </div>
          )
        })}
      </div>

      <TabBar active="profile" />
    </div>
  )
}
