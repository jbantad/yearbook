import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { BLOCK_ICONS, BLOCK_LABELS, BLOCK_COLORS, StarIcon } from './icons'
import { PhotoFields } from './PhotoFields'
import type { Enums, Json } from '../lib/database.types'

type BlockType = Enums<'block_type'>
type Selection = BlockType | 'headline' | 'label'
const TYPES: Selection[] = ['photo', 'note', 'place', 'meal', 'movie', 'person', 'gratitude', 'headline', 'label']

export function AddSheet({ onClose, onCreated, pageId }: { onClose: () => void; onCreated: () => void; pageId?: string | null }) {
  const { user } = useAuth()
  const [type, setType] = useState<Selection | null>(null)
  const [text, setText] = useState('')
  const [secondary, setSecondary] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFrame, setPhotoFrame] = useState('classic')
  const [photoZoom, setPhotoZoom] = useState(1)
  const [photoOffsetX, setPhotoOffsetX] = useState(0)
  const [photoOffsetY, setPhotoOffsetY] = useState(0)
  const [photoRotation, setPhotoRotation] = useState(0)
  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [posterPreview, setPosterPreview] = useState<string | null>(null)
  const [rating, setRating] = useState(0)
  const [showTitle, setShowTitle] = useState(true)
  const [mealPhotoFile, setMealPhotoFile] = useState<File | null>(null)
  const [mealPhotoPreview, setMealPhotoPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function pickPhoto(file: File | undefined) {
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
    setPhotoZoom(1)
    setPhotoOffsetX(0)
    setPhotoOffsetY(0)
  }

  function pickPoster(file: File | undefined) {
    if (!file) return
    setPosterFile(file)
    setPosterPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
  }

  function pickMealPhoto(file: File | undefined) {
    if (!file) return
    setMealPhotoFile(file)
    setMealPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
  }

  async function uploadToPhotos(file: File): Promise<string> {
    if (!user) throw new Error('not signed in')
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`
    const { error: uploadErr } = await supabase.storage.from('photos').upload(path, file, { contentType: file.type || undefined })
    if (uploadErr) throw uploadErr
    const { data: pub } = supabase.storage.from('photos').getPublicUrl(path)
    return pub.publicUrl
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!type || !user) return
    setBusy(true)
    setError(null)
    try {
      let data: Record<string, unknown> = {}
      let layout: Record<string, unknown> = {}
      let place_id: string | null = null
      let movie_id: string | null = null

      if (type === 'photo') {
        data = { caption: text, frame: photoFrame, photo_zoom: photoZoom, photo_x: photoOffsetX, photo_y: photoOffsetY }
        layout = { r: photoRotation }
        if (photoFile) data.photo_url = await uploadToPhotos(photoFile)
      }
      if (type === 'note') data = { text }
      if (type === 'headline' || type === 'label') data = { style: type, content: text }
      if (type === 'meal') {
        data = { dish: text, description: secondary }
        if (mealPhotoFile) data.photo_url = await uploadToPhotos(mealPhotoFile)
      }
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
        const poster_path = posterFile ? await uploadToPhotos(posterFile) : null
        const { data: created, error: movieErr } = await supabase
          .from('movies')
          .insert({ title: text, poster_path, rating: rating > 0 ? rating : null })
          .select('id')
          .single()
        if (movieErr) throw movieErr
        movie_id = created.id
        data = { show_title: showTitle }
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

      const blockType: BlockType = type === 'headline' || type === 'label' ? 'text' : type
      const { data: block, error: blockErr } = await supabase
        .from('blocks')
        .insert({ user_id: user.id, type: blockType, data: data as unknown as Json, layout: layout as unknown as Json, place_id, movie_id, page_id: pageId ?? null })
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
            <div className="sub">{pageId ? 'added straight to this page' : 'captured now, ready to file to a page'}</div>

            {type === 'photo' && (
              <PhotoFields
                preview={photoPreview}
                onPickPhoto={pickPhoto}
                caption={text}
                onCaptionChange={setText}
                frame={photoFrame}
                onFrameChange={setPhotoFrame}
                zoom={photoZoom}
                onZoomChange={setPhotoZoom}
                offsetX={photoOffsetX}
                offsetY={photoOffsetY}
                onOffsetChange={(x, y) => { setPhotoOffsetX(x); setPhotoOffsetY(y) }}
                rotation={photoRotation}
                onRotationChange={setPhotoRotation}
              />
            )}
            {type === 'note' && (
              <div className="field">
                <label>Note</label>
                <textarea value={text} onChange={(e) => setText(e.target.value)} required />
              </div>
            )}
            {type === 'place' && (
              <div className="field">
                <label>Place name</label>
                <input value={text} onChange={(e) => setText(e.target.value)} required />
              </div>
            )}
            {type === 'meal' && (
              <>
                <div className="field">
                  <label>What did you have</label>
                  <input value={text} onChange={(e) => setText(e.target.value)} required />
                </div>
                <div className="field">
                  <label>Notes (optional)</label>
                  <input value={secondary} onChange={(e) => setSecondary(e.target.value)} />
                </div>
                <div className="field">
                  <label>Photo (optional)</label>
                  <label
                    style={{
                      display: 'flex', width: '100%', height: 120, borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
                      background: mealPhotoPreview ? `url(${mealPhotoPreview}) center/cover no-repeat` : 'var(--paper-alt)',
                      border: mealPhotoPreview ? 'none' : '1.5px dashed var(--line)',
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {!mealPhotoPreview && (
                      <span style={{ fontSize: 13, color: 'var(--ink-soft)', fontStyle: 'italic' }}>tap to add a photo</span>
                    )}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => pickMealPhoto(e.target.files?.[0])} />
                  </label>
                </div>
              </>
            )}
            {type === 'movie' && (
              <>
                <div className="field" style={{ display: 'flex', gap: 14 }}>
                  <label
                    style={{
                      flexShrink: 0, width: 90, aspectRatio: '2 / 3', borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
                      background: posterPreview ? `url(${posterPreview}) center/cover no-repeat` : 'var(--paper-alt)',
                      border: posterPreview ? 'none' : '1.5px dashed var(--line)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                    }}
                  >
                    {!posterPreview && (
                      <span style={{ fontSize: 11.5, color: 'var(--ink-soft)', fontStyle: 'italic', padding: '0 6px', textTransform: 'none', letterSpacing: 'normal' }}>tap for poster</span>
                    )}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => pickPoster(e.target.files?.[0])} />
                  </label>
                  <div style={{ flex: 1 }}>
                    <label>Title</label>
                    <input value={text} onChange={(e) => setText(e.target.value)} required />
                    <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 6, fontStyle: 'italic' }}>poster is optional — fixed 2:3, same shape as a real one</div>
                  </div>
                </div>
                <div className="field">
                  <label>Your rating</label>
                  <div className="stars-row">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button type="button" key={n} onClick={() => setRating((r) => (r === n ? 0 : n))} aria-label={`${n} stars`}>
                        <StarIcon filled={n <= rating} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="toggle-row">
                  <div>
                    <div className="lbl">Show title on poster</div>
                    <div className="hint">overlay the title text on the block</div>
                  </div>
                  <button type="button" className={`switch${showTitle ? ' on' : ''}`} onClick={() => setShowTitle((s) => !s)} aria-label="Toggle title visibility">
                    <div className="knob" />
                  </button>
                </div>
              </>
            )}
            {type === 'person' && (
              <>
                <div className="field">
                  <label>Name</label>
                  <input value={text} onChange={(e) => setText(e.target.value)} required />
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
                <textarea value={text} onChange={(e) => setText(e.target.value)} required rows={4} />
              </div>
            )}
            {(type === 'headline' || type === 'label') && (
              <div className="field">
                <label>Text</label>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={type === 'label' ? 'CAMPFIRE NIGHT' : 'Lake Weekend'}
                  required
                />
                <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 6, fontStyle: 'italic' }}>
                  {type === 'label' ? 'short — shows as label-maker tiles' : 'a title for this page'}
                </div>
              </div>
            )}

            {error && <div className="auth-error">{error}</div>}
            <button className="cta" type="submit" disabled={busy}>{busy ? 'Saving…' : pageId ? 'Add to page' : 'Add to pile'}</button>
            <button type="button" className="cancel" onClick={() => setType(null)}>Back</button>
          </form>
        )}
      </div>
    </div>
  )
}
