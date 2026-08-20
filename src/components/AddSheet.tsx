import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { BLOCK_ICONS, BLOCK_LABELS, BLOCK_COLORS } from './icons'
import type { Enums, Json } from '../lib/database.types'

type BlockType = Enums<'block_type'>
const TYPES: BlockType[] = ['photo', 'note', 'place', 'meal', 'movie', 'person', 'gratitude']

export function AddSheet({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { user } = useAuth()
  const [type, setType] = useState<BlockType | null>(null)
  const [text, setText] = useState('')
  const [secondary, setSecondary] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function pickPhoto(file: File | undefined) {
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!type || !user) return
    setBusy(true)
    setError(null)
    try {
      let data: Record<string, unknown> = {}
      let place_id: string | null = null
      let movie_id: string | null = null

      if (type === 'photo') {
        data = { caption: text }
        if (photoFile) {
          const ext = photoFile.name.split('.').pop()?.toLowerCase() || 'jpg'
          const path = `${user.id}/${crypto.randomUUID()}.${ext}`
          const { error: uploadErr } = await supabase.storage.from('photos').upload(path, photoFile, {
            contentType: photoFile.type || undefined,
          })
          if (uploadErr) throw uploadErr
          const { data: pub } = supabase.storage.from('photos').getPublicUrl(path)
          data.photo_url = pub.publicUrl
        }
      }
      if (type === 'note') data = { text }
      if (type === 'meal') data = { dish: text, description: secondary }
      if (type === 'gratitude') data = { items: text.split('\n').map((s) => s.trim()).filter(Boolean) }

      if (type === 'place') {
        const { data: existing } = await supabase
          .from('places')
          .select('id')
          .eq('user_id', user.id)
          .ilike('name', text)
          .limit(1)
          .maybeSingle()
        if (existing) {
          place_id = existing.id
        } else {
          const { data: created, error: placeErr } = await supabase
            .from('places')
            .insert({ user_id: user.id, name: text })
            .select('id')
            .single()
          if (placeErr) throw placeErr
          place_id = created.id
        }
      }

      if (type === 'movie') {
        const { data: created, error: movieErr } = await supabase
          .from('movies')
          .insert({ title: text })
          .select('id')
          .single()
        if (movieErr) throw movieErr
        movie_id = created.id
      }

      let personId: string | null = null
      if (type === 'person') {
        const { data: existing } = await supabase
          .from('people')
          .select('id')
          .eq('user_id', user.id)
          .ilike('display_name', text)
          .limit(1)
          .maybeSingle()
        if (existing) {
          personId = existing.id
        } else {
          const { data: created, error: personErr } = await supabase
            .from('people')
            .insert({ user_id: user.id, display_name: text, relationship: secondary || null })
            .select('id')
            .single()
          if (personErr) throw personErr
          personId = created.id
        }
      }

      const { data: block, error: blockErr } = await supabase
        .from('blocks')
        .insert({ user_id: user.id, type, data: data as unknown as Json, place_id, movie_id })
        .select('id')
        .single()
      if (blockErr) throw blockErr

      if (type === 'person' && personId && block) {
        await supabase.from('block_people').insert({ block_id: block.id, person_id: personId })
      }

      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="handle" />
        {!type ? (
          <>
            <h2>Add a moment</h2>
            <div className="sub">What are you capturing?</div>
            <div className="opt-grid">
              {TYPES.map((t) => {
                const Icon = BLOCK_ICONS[t]
                const colors = BLOCK_COLORS[t]
                return (
                  <button key={t} className="opt" onClick={() => setType(t)}>
                    <div className="ico" style={{ background: colors.soft, color: colors.fg }}>
                      <Icon />
                    </div>
                    <span>{BLOCK_LABELS[t]}</span>
                  </button>
                )
              })}
            </div>
            <button className="cancel" onClick={onClose}>Cancel</button>
          </>
        ) : (
          <form onSubmit={submit}>
            <h2>{BLOCK_LABELS[type]}</h2>
            <div className="sub">captured now, ready to file to a page</div>

            {type === 'photo' && (
              <>
                <div className="field">
                  <label>Photo</label>
                  <label
                    style={{
                      width: '100%', height: 150, borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
                      background: photoPreview ? `url(${photoPreview}) center/cover no-repeat` : 'var(--paper-alt)',
                      border: photoPreview ? 'none' : '1.5px dashed var(--line)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {!photoPreview && (
                      <span style={{ fontSize: 13, color: 'var(--ink-soft)', fontStyle: 'italic' }}>tap to add a photo</span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => pickPhoto(e.target.files?.[0])}
                    />
                  </label>
                </div>
                <div className="field">
                  <label>Caption</label>
                  <input value={text} onChange={(e) => setText(e.target.value)} placeholder="made it right as the sky went pink" />
                </div>
              </>
            )}
            {type === 'note' && (
              <div className="field">
                <label>Note</label>
                <textarea value={text} onChange={(e) => setText(e.target.value)} required autoFocus />
              </div>
            )}
            {type === 'place' && (
              <div className="field">
                <label>Place name</label>
                <input value={text} onChange={(e) => setText(e.target.value)} required autoFocus />
              </div>
            )}
            {type === 'meal' && (
              <>
                <div className="field">
                  <label>What did you have</label>
                  <input value={text} onChange={(e) => setText(e.target.value)} required autoFocus />
                </div>
                <div className="field">
                  <label>Notes (optional)</label>
                  <input value={secondary} onChange={(e) => setSecondary(e.target.value)} />
                </div>
              </>
            )}
            {type === 'movie' && (
              <div className="field">
                <label>Title</label>
                <input value={text} onChange={(e) => setText(e.target.value)} required autoFocus />
              </div>
            )}
            {type === 'person' && (
              <>
                <div className="field">
                  <label>Name</label>
                  <input value={text} onChange={(e) => setText(e.target.value)} required autoFocus />
                </div>
                <div className="field">
                  <label>Relationship (optional)</label>
                  <input value={secondary} onChange={(e) => setSecondary(e.target.value)} placeholder="sister, friend…" />
                </div>
              </>
            )}
            {type === 'gratitude' && (
              <div className="field">
                <label>Grateful for (one per line)</label>
                <textarea value={text} onChange={(e) => setText(e.target.value)} required autoFocus rows={4} />
              </div>
            )}

            {error && <div className="auth-error">{error}</div>}
            <button className="cta" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Add to pile'}</button>
            <button type="button" className="cancel" onClick={() => setType(null)}>Back</button>
          </form>
        )}
      </div>
    </div>
  )
}
