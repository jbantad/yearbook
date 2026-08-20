import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { BlockWithJoins } from './BlockCard'
import { TrashIcon } from './icons'
import type { Json } from '../lib/database.types'
import { hashRotation } from '../lib/hash'
import polaroidClassic from '../assets/polaroid-frame.png'
import polaroidTall from '../assets/polaroid-frame-tall.png'
import polaroidSquare from '../assets/polaroid-frame-square.png'

const FRAMES: { key: string; label: string; src: string }[] = [
  { key: 'classic', label: 'Classic', src: polaroidClassic },
  { key: 'tall', label: 'Tall', src: polaroidTall },
  { key: 'square', label: 'Square', src: polaroidSquare },
]

export function EditPhotoSheet({
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
  const { user } = useAuth()
  const data = (block.data ?? {}) as Record<string, unknown>
  const layout = (block.layout ?? {}) as { x?: number; y?: number; r?: number }
  const [caption, setCaption] = useState((data.caption as string) || '')
  const [frame, setFrame] = useState((data.frame as string) || 'classic')
  const [rotation, setRotation] = useState(typeof layout.r === 'number' ? layout.r : hashRotation(block.id))
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>((data.photo_url as string) || null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function pickPhoto(file: File | undefined) {
    if (!file) return
    setPhotoFile(file)
    setPreview((prev) => {
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setBusy(true)
    setError(null)
    try {
      const nextData: Record<string, unknown> = { ...data, caption, frame }
      if (photoFile) {
        const ext = photoFile.name.split('.').pop()?.toLowerCase() || 'jpg'
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`
        const { error: uploadErr } = await supabase.storage.from('photos').upload(path, photoFile, { contentType: photoFile.type || undefined })
        if (uploadErr) throw uploadErr
        const { data: pub } = supabase.storage.from('photos').getPublicUrl(path)
        nextData.photo_url = pub.publicUrl
      }
      const nextLayout = { ...layout, r: rotation }
      const { error: updateErr } = await supabase
        .from('blocks')
        .update({ data: nextData as unknown as Json, layout: nextLayout as unknown as Json })
        .eq('id', block.id)
      if (updateErr) throw updateErr
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this photo')
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
        <h2>Edit photo</h2>
        <div className="sub">change the picture or its caption</div>

        <form onSubmit={save}>
          <div className="field">
            <label>Photo</label>
            <label
              style={{
                display: 'flex', width: '100%', height: 150, borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
                background: preview ? `url(${preview}) center/cover no-repeat` : 'var(--paper-alt)',
                border: preview ? 'none' : '1.5px dashed var(--line)',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              {!preview && <span style={{ fontSize: 13, color: 'var(--ink-soft)', fontStyle: 'italic' }}>tap to add a photo</span>}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => pickPhoto(e.target.files?.[0])} />
            </label>
          </div>
          <div className="field">
            <label>Caption</label>
            <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="made it right as the sky went pink" />
          </div>

          <div className="field">
            <label>Frame</label>
            <div className="frame-picker">
              {FRAMES.map((f) => (
                <button
                  type="button"
                  key={f.key}
                  className={`frame-opt${frame === f.key ? ' sel' : ''}`}
                  onClick={() => setFrame(f.key)}
                >
                  <div className="sw" style={{ backgroundImage: `url(${f.src})` }} />
                  <span>{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Rotation</label>
            <div className="rotate-row">
              <button type="button" onClick={() => setRotation((r) => r - 4)} aria-label="Rotate left">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12a8 8 0 0 1 14-5.3M4 4v4h4" /></svg>
              </button>
              <span className="rotate-val">{Math.round(rotation)}°</span>
              <button type="button" onClick={() => setRotation((r) => r + 4)} aria-label="Rotate right">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12a8 8 0 0 1-14 5.3M20 20v-4h-4" /></svg>
              </button>
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}
          <button className="cta" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
          <button className="cancel" style={{ width: 'auto', borderTop: 'none', padding: 0 }} onClick={onClose}>Cancel</button>
          <button
            onClick={remove}
            disabled={busy}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--rose)', fontSize: 13.5, fontWeight: 600 }}
          >
            <TrashIcon /> Delete block
          </button>
        </div>
      </div>
    </div>
  )
}
