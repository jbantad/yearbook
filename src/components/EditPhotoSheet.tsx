import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { BlockWithJoins } from './BlockCard'
import { TrashIcon } from './icons'
import type { Json } from '../lib/database.types'
import { hashRotation } from '../lib/hash'
import { PhotoFields } from './PhotoFields'

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
  const [zoom, setZoom] = useState(typeof data.photo_zoom === 'number' ? (data.photo_zoom as number) : 1)
  const [offsetX, setOffsetX] = useState(typeof data.photo_x === 'number' ? (data.photo_x as number) : 0)
  const [offsetY, setOffsetY] = useState(typeof data.photo_y === 'number' ? (data.photo_y as number) : 0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function pickPhoto(file: File | undefined) {
    if (!file) return
    setPhotoFile(file)
    setPreview((prev) => {
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
    setZoom(1)
    setOffsetX(0)
    setOffsetY(0)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setBusy(true)
    setError(null)
    try {
      const nextData: Record<string, unknown> = { ...data, caption, frame, photo_zoom: zoom, photo_x: offsetX, photo_y: offsetY }
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

        <form onSubmit={save}>
          <PhotoFields
            preview={preview}
            onPickPhoto={pickPhoto}
            caption={caption}
            onCaptionChange={setCaption}
            frame={frame}
            onFrameChange={setFrame}
            zoom={zoom}
            onZoomChange={setZoom}
            offsetX={offsetX}
            offsetY={offsetY}
            onOffsetChange={(x, y) => { setOffsetX(x); setOffsetY(y) }}
            rotation={rotation}
            onRotationChange={setRotation}
          />

          {error && <div className="auth-error">{error}</div>}
          <button className="cta" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
          <button className="cancel" style={{ width: 'auto', borderTop: 'none', padding: 0 }} onClick={onClose}>Cancel</button>
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
