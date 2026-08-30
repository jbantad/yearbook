import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { BlockWithJoins } from './BlockCard'
import { TrashIcon, StarIcon } from './icons'
import type { Json } from '../lib/database.types'
import { hashRotation } from '../lib/hash'
import { RotationField } from './RotationField'
import { todayISO } from '../lib/pages'
import { useBodyScrollLock } from '../lib/useBodyScrollLock'

export function EditMovieSheet({
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
  useBodyScrollLock()
  const { user } = useAuth()
  const data = (block.data ?? {}) as Record<string, unknown>
  const layout = (block.layout ?? {}) as { x?: number; y?: number; r?: number }
  const [title, setTitle] = useState(block.movie?.title ?? '')
  const [rating, setRating] = useState(block.movie?.rating ?? 0)
  const [showTitle, setShowTitle] = useState(data.show_title !== false)
  const [color] = useState(data.color as string | undefined)
  const [rotation, setRotation] = useState(typeof layout.r === 'number' ? layout.r : hashRotation(block.id))
  const [dateWatched, setDateWatched] = useState(block.captured_at.slice(0, 10))
  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(block.movie?.poster_path ?? null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function pickPoster(file: File | undefined) {
    if (!file) return
    setPosterFile(file)
    setPreview((prev) => {
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !block.movie_id) return
    setBusy(true)
    setError(null)
    try {
      const movieUpdate: { title: string; rating: number | null; poster_path?: string } = { title: title.trim(), rating: rating > 0 ? rating : null }
      if (posterFile) {
        const ext = posterFile.name.split('.').pop()?.toLowerCase() || 'jpg'
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`
        const { error: uploadErr } = await supabase.storage.from('photos').upload(path, posterFile, { contentType: posterFile.type || undefined })
        if (uploadErr) throw uploadErr
        const { data: pub } = supabase.storage.from('photos').getPublicUrl(path)
        movieUpdate.poster_path = pub.publicUrl
      }
      const { error: movieErr } = await supabase.from('movies').update(movieUpdate).eq('id', block.movie_id)
      if (movieErr) throw movieErr

      const nextData = { ...data, show_title: showTitle, color }
      const nextLayout = { ...layout, r: rotation }
      const captured_at = new Date(dateWatched + 'T12:00:00').toISOString()
      const { error: updateErr } = await supabase
        .from('blocks')
        .update({ data: nextData as unknown as Json, layout: nextLayout as unknown as Json, captured_at })
        .eq('id', block.id)
      if (updateErr) throw updateErr
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this movie')
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
        <h2>Edit movie</h2>
        <div className="sub">change the title, poster, rating, or date watched</div>

        <form onSubmit={save}>
          <div className="field" style={{ display: 'flex', gap: 14 }}>
            <label
              style={{
                flexShrink: 0, width: 90, aspectRatio: '2 / 3', borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
                background: preview ? `url(${preview}) center/cover no-repeat` : 'var(--paper-alt)',
                border: preview ? 'none' : '1.5px dashed var(--line)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
              }}
            >
              {!preview && (
                <span style={{ fontSize: 11.5, color: 'var(--ink-soft)', fontStyle: 'italic', padding: '0 6px', textTransform: 'none', letterSpacing: 'normal' }}>tap for poster</span>
              )}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => pickPoster(e.target.files?.[0])} />
            </label>
            <div style={{ flex: 1 }}>
              <label>Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required />
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

          <div className="field">
            <label>Rotation</label>
            <RotationField value={rotation} onChange={setRotation} />
          </div>

          {error && <div className="auth-error">{error}</div>}
          <button className="cta" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
          <button className="cancel" style={{ width: 'auto', marginTop: 0, borderTop: 'none', padding: 0 }} onClick={onClose}>Cancel</button>
          <button
            className="delete-block-btn"
            onClick={remove}
            disabled={busy}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--rose)', fontSize: 13.5, fontWeight: 600 }}
          >
            <TrashIcon /> Delete
          </button>
        </div>
      </div>
    </div>
  )
}
