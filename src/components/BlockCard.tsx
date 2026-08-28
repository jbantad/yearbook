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

// Each frame PNG cuts its photo window at a different spot, so the
// photo-art layer's inset must match that frame's own art, not a
// one-size-fits-all box.
const FRAME_WINDOWS: Record<string, { left: number; right: number; top: number; bottom: number }> = {
  classic: { left: 4.9, right: 4.3, top: 8.7, bottom: 19.1 },
  tall: { left: 9.6, right: 9.6, top: 5.7, bottom: 14.7 },
  square: { left: 9.2, right: 9.0, top: 8.4, bottom: 23.9 },
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
    const frameKey = (data.frame as string) || 'classic'
    const frame = FRAME_SIZES[frameKey] ?? FRAME_SIZES.classic
    const win = FRAME_WINDOWS[frameKey] ?? FRAME_WINDOWS.classic
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
          style={{
            left: `${win.left}%`, right: `${win.right}%`, top: `${win.top}%`, bottom: `${win.bottom}%`,
            ...(!photoUrl ? { background: `linear-gradient(160deg, oklch(60% 0.1 ${(hashRotation(block.id, 360) + 180).toFixed(0)}), oklch(30% 0.06 ${(hashRotation(block.id + '2', 360) + 180).toFixed(0)}))` } : {}),
          }}
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
