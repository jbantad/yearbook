import { hashRotation } from '../lib/hash'
import { PlaceIcon, BLOCK_COLORS, EditIcon } from './icons'
import type { Tables } from '../lib/database.types'

export type BlockWithJoins = Tables<'blocks'> & {
  place?: { name: string } | null
  movie?: { title: string; poster_path: string | null } | null
  people?: { display_name: string }[]
}

function EditButton({ onEdit }: { onEdit: () => void }) {
  return (
    <button
      className="block-edit"
      onClick={(e) => { e.stopPropagation(); onEdit() }}
      onPointerDown={(e) => e.stopPropagation()}
      aria-label="Edit"
    >
      <EditIcon />
    </button>
  )
}

export function BlockCard({ block, onClick, onEdit }: { block: BlockWithJoins; onClick?: () => void; onEdit?: () => void }) {
  const rot = hashRotation(block.id)
  const data = (block.data ?? {}) as Record<string, unknown>

  if (block.type === 'photo') {
    const caption = (data.caption as string) || 'a moment'
    const photoUrl = data.photo_url as string | undefined
    return (
      <div
        className="card polaroid"
        style={{ width: 168, height: 132, transform: `rotate(${rot}deg)`, cursor: onClick ? 'pointer' : 'default' }}
        onClick={onClick}
      >
        <div className="frame-img" />
        <div
          className="photo-art"
          style={photoUrl
            ? { backgroundImage: `url(${photoUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: `linear-gradient(160deg, oklch(60% 0.1 ${(hashRotation(block.id, 360) + 180).toFixed(0)}), oklch(30% 0.06 ${(hashRotation(block.id + '2', 360) + 180).toFixed(0)}))` }}
        />
        <div className="cap">{caption}</div>
        {onEdit && <EditButton onEdit={onEdit} />}
      </div>
    )
  }

  if (block.type === 'note') {
    return (
      <button
        className="card scrap"
        style={{ width: 168, background: BLOCK_COLORS.note.soft, transform: `rotate(${rot}deg)`, borderRadius: 6, border: 'none', textAlign: 'left', cursor: onClick ? 'pointer' : 'default' }}
        onClick={onClick}
      >
        <div className="badge" style={{ background: BLOCK_COLORS.note.fg }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="oklch(99% 0.01 85)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4.5 19 9l-9.5 9.5-5 1 1-5Z" /></svg>
        </div>
        <div className="cap">{(data.text as string) || ''}</div>
      </button>
    )
  }

  if (block.type === 'place') {
    return (
      <button className="place" style={{ transform: `rotate(${rot}deg)`, background: 'none', border: 'none', cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
        <PlaceIcon />
        <div className="place-name">{block.place?.name ?? 'a place'}</div>
      </button>
    )
  }

  if (block.type === 'meal') {
    return (
      <button
        className="card ticket"
        style={{ width: 150, transform: `rotate(${rot}deg)`, borderRadius: 4, border: 'none', textAlign: 'left', cursor: onClick ? 'pointer' : 'default' }}
        onClick={onClick}
      >
        <div className="badge" style={{ background: BLOCK_COLORS.meal.fg }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="oklch(99% 0.01 85)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 3v7a2 2 0 0 0 2 2v9M7 3v6M9 3v6M11 3v7M17 3c-1.7 0-3 2-3 5s1.3 5 3 5v8" /></svg>
        </div>
        <div className="cap">{(data.dish as string) || (data.description as string) || 'a meal'}</div>
      </button>
    )
  }

  if (block.type === 'gratitude') {
    const items = Array.isArray(data.items) ? (data.items as string[]) : []
    return (
      <button
        className="card scrap"
        style={{ width: 170, background: BLOCK_COLORS.gratitude.soft, transform: `rotate(${rot}deg)`, borderRadius: 6, border: 'none', textAlign: 'left', cursor: onClick ? 'pointer' : 'default' }}
        onClick={onClick}
      >
        <div className="badge" style={{ background: BLOCK_COLORS.gratitude.fg }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="oklch(99% 0.01 85)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.5S3.5 15.4 3.5 9.4A4.9 4.9 0 0 1 12 6a4.9 4.9 0 0 1 8.5 3.4c0 6-8.5 11.1-8.5 11.1Z" /></svg>
        </div>
        <div className="glabel">grateful for</div>
        {items.length === 0 && <div className="gitem"><i />today</div>}
        {items.map((it, i) => <div className="gitem" key={i}><i />{it}</div>)}
      </button>
    )
  }

  if (block.type === 'movie') {
    const poster = block.movie?.poster_path
    return (
      <button
        className="card scrap"
        style={{
          width: 168, transform: `rotate(${rot}deg)`, borderRadius: 6, border: 'none', textAlign: 'left', cursor: onClick ? 'pointer' : 'default',
          background: poster ? 'none' : BLOCK_COLORS.movie.soft, padding: poster ? 0 : undefined, overflow: poster ? 'hidden' : undefined,
        }}
        onClick={onClick}
      >
        {poster ? (
          <>
            <div style={{ width: '100%', aspectRatio: '2 / 3', backgroundImage: `url(${poster})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            <div className="cap" style={{ padding: '8px 10px' }}>{block.movie?.title ?? 'a movie'}</div>
          </>
        ) : (
          <>
            <div className="badge" style={{ background: BLOCK_COLORS.movie.fg }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="oklch(99% 0.01 85)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8.5 5 4h3l-1.6 4.5M9 8.5 10.6 4h3l-1.6 4.5M15.6 8.5 17.2 4H20l-2 4.5M3 8.5h18v9.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /></svg>
            </div>
            <div className="cap">{block.movie?.title ?? 'a movie'}</div>
          </>
        )}
      </button>
    )
  }

  if (block.type === 'person') {
    const names = block.people?.map((p) => p.display_name).join(', ') || 'someone'
    return (
      <button className="tag" style={{ transform: `rotate(${rot}deg)`, border: 'none', cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
        <div className="av">{names[0]?.toUpperCase()}</div>
        <span>with {names}</span>
      </button>
    )
  }

  return (
    <button
      className="card scrap"
      style={{ width: 160, transform: `rotate(${rot}deg)`, borderRadius: 6, border: 'none', textAlign: 'left', cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <div className="cap">{(data.transcript as string) || 'a moment'}</div>
    </button>
  )
}
