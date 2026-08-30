import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { BLOCK_ICONS, BLOCK_LABELS, BLOCK_COLORS, StarIcon } from './icons'
import { PhotoFields } from './PhotoFields'
import { PeopleTagFields } from './PeopleTagFields'
import { STICKERS } from '../lib/stickers'
import { todayISO } from '../lib/pages'
import type { Enums, Json } from '../lib/database.types'

type BlockType = Enums<'block_type'>
type Selection = BlockType | 'headline' | 'label'
const TYPES: Selection[] = ['photo', 'note', 'place', 'meal', 'movie', 'gratitude', 'sticker', 'headline', 'label']

type LibraryMovie = { id: string; title: string; poster_path: string | null; rating: number | null; capturedAt: string }

export function AddSheet({
  onClose,
  onCreated,
  pageId,
  initialType,
}: {
  onClose: () => void
  onCreated: () => void
  pageId?: string | null
  initialType?: Selection
}) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [type, setType] = useState<Selection | null>(initialType ?? null)
  const [dateWatched, setDateWatched] = useState(todayISO())
  const [movieLibrary, setMovieLibrary] = useState<LibraryMovie[]>([])
  const [movieLibraryLoading, setMovieLibraryLoading] = useState(false)
  const [movieSearch, setMovieSearch] = useState('')
  const [text, setText] = useState('')
  const [secondary, setSecondary] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFrame, setPhotoFrame] = useState('classic')
  const [photoZoom, setPhotoZoom] = useState(1)
  const [photoOffsetX, setPhotoOffsetX] = useState(0)
  const [photoOffsetY, setPhotoOffsetY] = useState(0)
  const [photoRotation, setPhotoRotation] = useState(0)
  const [triptychFiles, setTriptychFiles] = useState<(File | null)[]>([null, null, null])
  const [triptychPreviews, setTriptychPreviews] = useState<(string | null)[]>([null, null, null])
  const [triptychZooms, setTriptychZooms] = useState<number[]>([1, 1, 1])
  const [triptychOffsets, setTriptychOffsets] = useState<{ x: number; y: number }[]>([{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }])
  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [posterPreview, setPosterPreview] = useState<string | null>(null)
  const [rating, setRating] = useState(0)
  const [showTitle, setShowTitle] = useState(true)
  const [mealPhotoFile, setMealPhotoFile] = useState<File | null>(null)
  const [mealPhotoPreview, setMealPhotoPreview] = useState<string | null>(null)
  const [stickerKey, setStickerKey] = useState<string | null>(null)
  const [taggedPersonIds, setTaggedPersonIds] = useState<string[]>([])
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

  function pickTriptychPhoto(index: number, file: File | undefined) {
    if (!file) return
    setTriptychFiles((prev) => { const next = [...prev]; next[index] = file; return next })
    setTriptychPreviews((prev) => {
      const next = [...prev]
      if (next[index]) URL.revokeObjectURL(next[index] as string)
      next[index] = URL.createObjectURL(file)
      return next
    })
    setTriptychZooms((prev) => { const next = [...prev]; next[index] = 1; return next })
    setTriptychOffsets((prev) => { const next = [...prev]; next[index] = { x: 0, y: 0 }; return next })
  }

  function setTriptychZoom(index: number, v: number) {
    setTriptychZooms((prev) => { const next = [...prev]; next[index] = v; return next })
  }

  function setTriptychOffset(index: number, x: number, y: number) {
    setTriptychOffsets((prev) => { const next = [...prev]; next[index] = { x, y }; return next })
  }

  function pickPoster(file: File | undefined) {
    if (!file) return
    setPosterFile(file)
    setPosterPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
  }

  useEffect(() => {
    if (!user || type !== 'movie' || !pageId) return
    setMovieLibraryLoading(true)
    supabase
      .from('blocks')
      .select('movie_id, captured_at, movie:movies(id, title, poster_path, rating)')
      .eq('user_id', user.id)
      .eq('type', 'movie')
      .not('movie_id', 'is', null)
      .order('captured_at', { ascending: false })
      .then(({ data }) => {
        const seen = new Set<string>()
        const library: LibraryMovie[] = []
        for (const row of (data ?? []) as unknown as { movie_id: string; captured_at: string; movie: { id: string; title: string; poster_path: string | null; rating: number | null } | null }[]) {
          if (!row.movie || seen.has(row.movie.id)) continue
          seen.add(row.movie.id)
          library.push({ ...row.movie, capturedAt: row.captured_at })
        }
        setMovieLibrary(library)
        setMovieLibraryLoading(false)
      })
  }, [user, type, pageId])

  async function pickExistingMovie(movie: LibraryMovie) {
    if (!user || !pageId) return
    setBusy(true)
    setError(null)
    try {
      const { error: blockErr } = await supabase
        .from('blocks')
        .insert({
          user_id: user.id, type: 'movie', data: { show_title: true } as unknown as Json, layout: {} as unknown as Json,
          movie_id: movie.id, page_id: pageId, captured_at: movie.capturedAt,
        })
      if (blockErr) throw blockErr
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add this movie')
      setBusy(false)
    }
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
    if (type === 'sticker' && !stickerKey) return
    setBusy(true)
    setError(null)
    try {
      let data: Record<string, unknown> = {}
      let layout: Record<string, unknown> = {}
      let place_id: string | null = null
      let movie_id: string | null = null

      if (type === 'photo' && photoFrame === 'triptych') {
        const photo_urls = await Promise.all(triptychFiles.map((f) => (f ? uploadToPhotos(f) : Promise.resolve(null))))
        data = { caption: text, frame: photoFrame, photo_urls, photo_zooms: triptychZooms, photo_offsets: triptychOffsets }
        layout = { r: photoRotation }
      } else if (type === 'photo') {
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
      if (type === 'sticker') data = { sticker: stickerKey, card_scale: 1 }

      if (type === 'place') {
        const placeName = text.trim()
        const { data: existing } = await supabase
          .from('places')
          .select('id')
          .eq('user_id', user.id)
          .ilike('name', placeName)
          .limit(1)
          .maybeSingle()
        if (existing) {
          place_id = existing.id
        } else {
          const { data: created, error: placeErr } = await supabase
            .from('places')
            .insert({ user_id: user.id, name: placeName })
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

      const blockType: BlockType = type === 'headline' || type === 'label' ? 'text' : type
      const captured_at = type === 'movie' ? new Date(dateWatched + 'T12:00:00').toISOString() : undefined
      const { data: block, error: blockErr } = await supabase
        .from('blocks')
        .insert({
          user_id: user.id, type: blockType, data: data as unknown as Json, layout: layout as unknown as Json,
          place_id, movie_id, page_id: pageId ?? null, ...(captured_at ? { captured_at } : {}),
        })
        .select('id')
        .single()
      if (blockErr) throw blockErr

      if ((type === 'photo' || type === 'note') && taggedPersonIds.length > 0 && block) {
        await supabase.from('block_people').insert(taggedPersonIds.map((person_id) => ({ block_id: block.id, person_id })))
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
        ) : type === 'movie' && pageId ? (
          <>
            <h2>Add a movie</h2>
            <div className="sub">choose one from your shelf, or log a new one there first</div>
            <div className="search-row">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
              <input placeholder="search your movies…" value={movieSearch} onChange={(e) => setMovieSearch(e.target.value)} />
            </div>
            <div className="lib-scroll">
              {movieLibraryLoading && <div className="sub">loading…</div>}
              {!movieLibraryLoading && movieLibrary.length === 0 && (
                <div className="sub">nothing logged yet — log one on Shelves first</div>
              )}
              <div className="shelf-grid">
                {movieLibrary
                  .filter((m) => m.title.toLowerCase().includes(movieSearch.trim().toLowerCase()))
                  .map((m) => {
                    const hue = Math.abs(m.id.charCodeAt(0) * 7) % 360
                    return (
                      <div className="mcard" key={m.id} onClick={() => !busy && pickExistingMovie(m)} style={{ cursor: 'pointer' }}>
                        <div
                          className="art poster"
                          style={m.poster_path
                            ? { backgroundImage: `url(${m.poster_path})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                            : { background: `linear-gradient(160deg, oklch(58% 0.1 ${hue}), oklch(30% 0.06 ${hue}))` }}
                        />
                        <div className="stub">
                          <div className="t">{m.title}</div>
                          {m.rating != null && (
                            <div className="stars" style={{ marginTop: 4 }}>
                              {[1, 2, 3, 4, 5].map((n) => <StarIcon key={n} filled={n <= (m.rating ?? 0)} />)}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
            {error && <div className="auth-error">{error}</div>}
            <div className="new-log-row" onClick={() => { onClose(); navigate('/shelves') }}>
              <div className="plus-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg></div>
              <div className="txt">
                <div className="t1">Don't see it? Log it on Shelves</div>
                <div className="t2">poster, rating &amp; date watched live there now</div>
              </div>
            </div>
            <button type="button" className="cancel" onClick={() => setType(null)}>Back</button>
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
                triptychPreviews={triptychPreviews}
                onPickTriptychPhoto={pickTriptychPhoto}
                triptychZooms={triptychZooms}
                triptychOffsets={triptychOffsets}
                onTriptychZoomChange={setTriptychZoom}
                onTriptychOffsetChange={setTriptychOffset}
              />
            )}
            {type === 'photo' && <PeopleTagFields taggedIds={taggedPersonIds} onChange={setTaggedPersonIds} />}
            {type === 'note' && (
              <>
                <div className="field">
                  <label>Note</label>
                  <textarea value={text} onChange={(e) => setText(e.target.value)} required />
                </div>
                <PeopleTagFields taggedIds={taggedPersonIds} onChange={setTaggedPersonIds} />
              </>
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
                <div className="field">
                  <label>Date watched</label>
                  <input type="date" value={dateWatched} onChange={(e) => setDateWatched(e.target.value)} max={todayISO()} required />
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
            {type === 'gratitude' && (
              <div className="field">
                <label>Grateful for (one per line)</label>
                <textarea value={text} onChange={(e) => setText(e.target.value)} required rows={4} />
              </div>
            )}
            {type === 'sticker' && (
              <div className="field">
                <label>Choose a sticker</label>
                <div className="sticker-grid">
                  {STICKERS.map((s) => (
                    <button
                      type="button"
                      key={s.key}
                      className={`sticker-opt${stickerKey === s.key ? ' sel' : ''}`}
                      onClick={() => setStickerKey(s.key)}
                    >
                      <img src={s.src} alt="" />
                    </button>
                  ))}
                </div>
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
            <button className="cta" type="submit" disabled={busy || (type === 'sticker' && !stickerKey)}>{busy ? 'Saving…' : pageId ? 'Add to page' : 'Add to pile'}</button>
            <button type="button" className="cancel" onClick={() => setType(null)}>Back</button>
          </form>
        )}
      </div>
    </div>
  )
}
