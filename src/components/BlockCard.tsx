import { hashRotation } from '../lib/hash'
import { PlaceIcon, BLOCK_COLORS, EditIcon, StarIcon } from './icons'
import { resolveColor } from '../lib/colorPresets'
import type { Tables } from '../lib/database.types'
import polaroidClassic from '../assets/polaroid-frame.png'
import polaroidTall from '../assets/polaroid-frame-tall.png'
import polaroidSquare from '../assets/polaroid-frame-square.png'

const FRAME_SIZES: Record<string, { w: number; h: number; src: string }> = {
  classic: { w: 168, h: 132, src: polaroidClassic },
  tall: { w: 132, h: 186, src: polaroidTall },
  square: { w: 150, h: 164, src: polaroidSquare },
}

export type BlockWithJoins = Tables<'blocks'> & {
  place?: { name: string } | null
  movie?: { title: string; poster_path: string | null; rating: number | null } | null
  people?: { id: string; display_name: string }[]
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
  const layout = (block.layout ?? {}) as { r?: number }
  const rot = typeof layout.r === 'number' ? layout.r : hashRotation(block.id)
  const data = (block.data ?? {}) as Record<string, unknown>

  if (block.type === 'photo') {
    const caption = (data.caption as string) || 'a moment'
    const photoUrl = data.photo_url as string | undefined
    const frame = FRAME_SIZES[(data.frame as string) || 'classic'] ?? FRAME_SIZES.classic
    const zoom = typeof data.photo_zoom === 'number' ? data.photo_zoom : 1
    const px = typeof data.photo_x === 'number' ? data.photo_x : 0
    const py = typeof data.photo_y === 'number' ? data.photo_y : 0
    return (
      <div
        className="card polaroid"
        style={{ width: frame.w, height: frame.h, transform: `rotate(${rot}deg)`, cursor: onClick ? 'pointer' : 'default' }}
        onClick={onClick}
      >
        <div className="frame-img" style={{ backgroundImage: `url(${frame.src})` }} />
        <div
          className="photo-art"
          style={!photoUrl ? { background: `linear-gradient(160deg, oklch(60% 0.1 ${(hashRotation(block.id, 360) + 180).toFixed(0)}), oklch(30% 0.06 ${(hashRotation(block.id + '2', 360) + 180).toFixed(0)}))` } : undefined}
        >
          {photoUrl && (
            <img
              src={photoUrl}
              alt=""
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                transform: `translate(${px}%, ${py}%) scale(${zoom})`,
              }}
            />
          )}
        </div>
        <div className="cap">{caption}</div>
        {onEdit && <EditButton onEdit={onEdit} />}
      </div>
    )
  }

  if (block.type === 'note') {
    const noteColor = resolveColor(data.color as string | undefined, BLOCK_COLORS.note)
    const noteFont = (data.font as string) === 'mono'
      ? { fontFamily: 'var(--font-body)', fontStyle: 'italic' as const, fontSize: 10, letterSpacing: '-0.03em', wordSpacing: '-0.15em' }
      : undefined
    return (
      <button
        className="card scrap"
        style={{ width: 168, background: noteColor.soft, transform: `rotate(${rot}deg)`, borderRadius: 6, border: 'none', textAlign: 'left', cursor: onClick ? 'pointer' : 'default' }}
        onClick={onClick}
      >
        <div className="badge" style={{ background: noteColor.fg }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="oklch(99% 0.01 85)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4.5 19 9l-9.5 9.5-5 1 1-5Z" /></svg>
        </div>
        <div className="cap" style={noteFont}>{(data.text as string) || ''}</div>
      </button>
    )
  }

  if (block.type === 'place') {
    const placeColor = resolveColor(data.color as string | undefined, BLOCK_COLORS.place)
    return (
      <button className="place" style={{ transform: `rotate(${rot}deg)`, background: 'none', border: 'none', cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
        <PlaceIcon color={placeColor.fg} />
        <div className="place-name">{block.place?.name ?? 'a place'}</div>
      </button>
    )
  }

  if (block.type === 'meal') {
    const mealPhoto = data.photo_url as string | undefined
    const mealColor = resolveColor(data.color as string | undefined, BLOCK_COLORS.meal)
    return (
      <button
        className="card ticket"
        style={{
          width: 150, background: mealPhoto ? undefined : mealColor.soft, transform: `rotate(${rot}deg)`, borderRadius: 4, border: 'none', textAlign: 'left', cursor: onClick ? 'pointer' : 'default',
          padding: mealPhoto ? 0 : undefined, overflow: mealPhoto ? 'hidden' : undefined,
        }}
        onClick={onClick}
      >
        {mealPhoto && (
          <div style={{ width: '100%', aspectRatio: '4 / 3', backgroundImage: `url(${mealPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        )}
        <div className="badge" style={{ background: mealColor.fg }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="oklch(99% 0.01 85)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 3v7a2 2 0 0 0 2 2v9M7 3v6M9 3v6M11 3v7M17 3c-1.7 0-3 2-3 5s1.3 5 3 5v8" /></svg>
        </div>
        <div className="cap" style={{ padding: mealPhoto ? '10px 14px 12px' : undefined, color: mealPhoto ? undefined : mealColor.fg }}>{(data.dish as string) || (data.description as string) || 'a meal'}</div>
      </button>
    )
  }

  if (block.type === 'gratitude') {
    const items = Array.isArray(data.items) ? (data.items as string[]) : []
    const gratColor = resolveColor(data.color as string | undefined, BLOCK_COLORS.gratitude)
    return (
      <button
        className="card scrap"
        style={{ width: 170, background: gratColor.soft, transform: `rotate(${rot}deg)`, borderRadius: 6, border: 'none', textAlign: 'left', cursor: onClick ? 'pointer' : 'default' }}
        onClick={onClick}
      >
        <div className="badge" style={{ background: gratColor.fg }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="oklch(99% 0.01 85)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.5S3.5 15.4 3.5 9.4A4.9 4.9 0 0 1 12 6a4.9 4.9 0 0 1 8.5 3.4c0 6-8.5 11.1-8.5 11.1Z" /></svg>
        </div>
        <div className="glabel">grateful for</div>
        {items.length === 0 && <div className="gitem"><i style={{ background: gratColor.fg }} />today</div>}
        {items.map((it, i) => <div className="gitem" key={i}><i style={{ background: gratColor.fg }} />{it}</div>)}
      </button>
    )
  }

  if (block.type === 'movie') {
    const poster = block.movie?.poster_path
    const rating = block.movie?.rating
    const showTitle = data.show_title !== false
    const movieColor = resolveColor(data.color as string | undefined, BLOCK_COLORS.movie)
    return (
      <button
        className="card scrap"
        style={{
          width: 168, transform: `rotate(${rot}deg)`, borderRadius: 6, border: 'none', textAlign: 'left', cursor: onClick ? 'pointer' : 'default',
          background: poster ? 'none' : movieColor.soft, padding: poster ? 0 : undefined, overflow: poster ? 'hidden' : undefined,
        }}
        onClick={onClick}
      >
        {poster ? (
          <>
            <div style={{ width: '100%', aspectRatio: '2 / 3', backgroundImage: `url(${poster})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            {showTitle && <div className="cap" style={{ padding: '8px 10px 0' }}>{block.movie?.title ?? 'a movie'}</div>}
            {rating != null && (
              <div className="stars" style={{ padding: showTitle ? '5px 10px 8px' : '8px 10px' }}>
                {[1, 2, 3, 4, 5].map((n) => <StarIcon key={n} filled={n <= rating} />)}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="badge" style={{ background: movieColor.fg }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="oklch(99% 0.01 85)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8.5 5 4h3l-1.6 4.5M9 8.5 10.6 4h3l-1.6 4.5M15.6 8.5 17.2 4H20l-2 4.5M3 8.5h18v9.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /></svg>
            </div>
            <div className="cap">{block.movie?.title ?? 'a movie'}</div>
            {rating != null && (
              <div className="stars">
                {[1, 2, 3, 4, 5].map((n) => <StarIcon key={n} filled={n <= rating} />)}
              </div>
            )}
          </>
        )}
      </button>
    )
  }

  if (block.type === 'text') {
    const style = (data.style as string) || 'headline'
    const content = (data.content as string) || (style === 'label' ? 'LABEL' : 'headline')
    return (
      <button
        className={style === 'label' ? 'label-el' : 'headline-el'}
        style={{ transform: `rotate(${rot}deg)`, background: 'none', border: 'none', cursor: onClick ? 'pointer' : 'default' }}
        onClick={onClick}
      >
        {content}
      </button>
    )
  }

  if (block.type === 'person') {
    const names = block.people?.map((p) => p.display_name).join(', ') || 'someone'
    const personColor = resolveColor(data.color as string | undefined, BLOCK_COLORS.person)
    return (
      <button className="tag" style={{ transform: `rotate(${rot}deg)`, border: 'none', cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
        <div className="av" style={{ background: personColor.soft, color: personColor.fg }}>{names[0]?.toUpperCase()}</div>
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
