import { hashRotation } from '../lib/hash'
import { PlaceIcon, BLOCK_COLORS, EditIcon } from './icons'
import { resolveColor } from '../lib/colorPresets'
import { FRAME_SIZES, FRAME_WINDOWS, TRIPTYCH_WINDOWS } from '../lib/frames'
import { PHOTO_BASE_SCALE } from './PhotoFields'
import { STICKER_BASE_WIDTH, STICKER_BY_KEY } from '../lib/stickers'
import { CARD_BY_KEY } from '../lib/cards'
import pinPhoto from '../assets/pin-trimmed.png'
import starIcon from '../assets/star.png'
import type { Tables } from '../lib/database.types'
import type { CSSProperties } from 'react'

export type BlockWithJoins = Tables<'blocks'> & {
  place?: { name: string } | null
  movie?: { title: string; poster_path: string | null; rating: number | null } | null
  people?: { id: string; display_name: string }[]
}

// Removed features (gratitude, person) leave their old block rows in place
// rather than deleting them — BlockCard just renders nothing for them, same
// as any other type it doesn't recognize. Anything counting "does this page
// actually have visible content" needs to exclude these too, or a page whose
// only rows are leftover gratitude/person blocks reads as non-empty even
// though there's nothing on it to see.
export const HIDDEN_BLOCK_TYPES = new Set(['gratitude', 'person'])

function StarPng({ filled }: { filled: boolean }) {
  return <img src={starIcon} alt="" style={filled ? undefined : { filter: 'grayscale(1) opacity(0.35)' }} />
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

// Blocks are always draggable and always tappable-to-bring-to-front (handled
// by the wrapper in PageCanvas), but editing is a deliberate act via this
// small pencil button — a plain tap/drag release must never also pop the
// edit sheet open.
export function BlockCard({ block, onEdit, rotationOverride }: { block: BlockWithJoins; onEdit?: () => void; rotationOverride?: number }) {
  const layout = (block.layout ?? {}) as { r?: number }
  const rot = rotationOverride ?? (typeof layout.r === 'number' ? layout.r : hashRotation(block.id))
  const data = (block.data ?? {}) as Record<string, unknown>

  if (block.type === 'photo') {
    const caption = (data.caption as string) || ''
    const photoUrl = data.photo_url as string | undefined
    const frameKey = (data.frame as string) || 'classic'
    const frame = FRAME_SIZES[frameKey] ?? FRAME_SIZES.classic
    const cardScale = typeof data.card_scale === 'number' ? data.card_scale : 1

    if (frameKey === 'triptych') {
      const photoUrls = (Array.isArray(data.photo_urls) ? data.photo_urls : []) as (string | undefined)[]
      const photoZooms = (Array.isArray(data.photo_zooms) ? data.photo_zooms : []) as (number | undefined)[]
      const photoOffsets = (Array.isArray(data.photo_offsets) ? data.photo_offsets : []) as ({ x?: number; y?: number } | undefined)[]
      const capBottom = TRIPTYCH_WINDOWS[TRIPTYCH_WINDOWS.length - 1].bottom
      return (
        <div
          className="card polaroid polaroid-triptych"
          style={{ width: frame.w, height: frame.h, transform: `rotate(${rot}deg) scale(${cardScale})` }}
        >
          <div className="frame-img" style={{ backgroundImage: `url(${frame.src})` }} />
          {TRIPTYCH_WINDOWS.map((win, i) => {
            const url = photoUrls[i]
            const z = typeof photoZooms[i] === 'number' ? (photoZooms[i] as number) : 1
            const off = photoOffsets[i] ?? {}
            const px = typeof off.x === 'number' ? off.x : 0
            const py = typeof off.y === 'number' ? off.y : 0
            return (
              <div
                key={i}
                className="photo-art"
                style={{
                  left: `${win.left}%`, right: `${win.right}%`, top: `${win.top}%`, bottom: `${win.bottom}%`,
                  ...(!url ? { background: `linear-gradient(160deg, oklch(60% 0.1 ${(hashRotation(block.id + i, 360) + 180).toFixed(0)}), oklch(30% 0.06 ${(hashRotation(block.id + i + 'x', 360) + 180).toFixed(0)}))` } : {}),
                }}
              >
                {url && (
                  <img
                    src={url}
                    alt=""
                    draggable={false}
                    style={{
                      position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                      transform: `translate(${px}%, ${py}%) scale(${z * PHOTO_BASE_SCALE})`,
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </div>
            )
          })}
          {caption && <div className="cap" style={{ '--cap-bottom': `${capBottom}%` } as CSSProperties}>{caption}</div>}
        </div>
      )
    }

    const win = FRAME_WINDOWS[frameKey] ?? FRAME_WINDOWS.classic
    const zoom = typeof data.photo_zoom === 'number' ? data.photo_zoom : 1
    const px = typeof data.photo_x === 'number' ? data.photo_x : 0
    const py = typeof data.photo_y === 'number' ? data.photo_y : 0
    return (
      <div
        className={`card polaroid polaroid-${frameKey}`}
        style={{ width: frame.w, height: frame.h, transform: `rotate(${rot}deg) scale(${cardScale})` }}
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
              draggable={false}
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                transform: `translate(${px}%, ${py}%) scale(${zoom * PHOTO_BASE_SCALE})`,
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
        {caption && <div className="cap" style={{ '--cap-bottom': `${win.bottom}%` } as CSSProperties}>{caption}</div>}
      </div>
    )
  }

  if (block.type === 'note') {
    const noteColor = resolveColor(data.color as string | undefined, BLOCK_COLORS.note)
    const transparent = data.transparent === true
    const cardScale = typeof data.card_scale === 'number' ? data.card_scale : 1
    const align = data.align === 'center' ? 'center' : 'left'
    const noteFont = (data.font as string) === 'mono'
      ? { fontFamily: 'var(--font-body)', fontStyle: 'italic' as const, fontSize: 10, letterSpacing: '-0.03em', wordSpacing: '-0.15em' }
      : undefined
    const card = data.card ? CARD_BY_KEY[data.card as string] : undefined
    if (card) {
      const width = 168
      const height = width * (card.h / card.w)
      return (
        <div
          className="card-bg"
          style={{ width, height, backgroundImage: `url(${card.src})`, transform: `rotate(${rot}deg) scale(${cardScale})`, borderRadius: 6 }}
        >
          <div
            className="cap card-bg-text"
            style={{
              ...noteFont, textAlign: align, color: card.light ? 'oklch(97% 0.01 85)' : undefined,
              top: `${card.inset.top}%`, right: `${card.inset.right}%`, bottom: `${card.inset.bottom}%`, left: `${card.inset.left}%`,
            }}
            dangerouslySetInnerHTML={{ __html: (data.text as string) || '' }}
          />
        </div>
      )
    }
    return (
      <div
        className={`card scrap${transparent ? ' no-bg' : ''}`}
        style={{ width: 168, background: transparent ? 'none' : noteColor.soft, transform: `rotate(${rot}deg) scale(${cardScale})`, borderRadius: 6 }}
      >
        <div className="cap" style={{ ...noteFont, textAlign: align }} dangerouslySetInnerHTML={{ __html: (data.text as string) || '' }} />
      </div>
    )
  }

  if (block.type === 'journal') {
    const journalColor = resolveColor(data.color as string | undefined, BLOCK_COLORS.journal)
    const transparent = data.transparent === true
    const width = typeof data.width === 'number' ? data.width : 220
    const align = data.align === 'center' ? 'center' : 'left'
    const journalFont = (data.font as string) === 'mono'
      ? { fontFamily: 'var(--font-body)', fontStyle: 'italic' as const, fontSize: 13, lineHeight: 1.5 }
      : undefined
    const journalCard = data.card ? CARD_BY_KEY[data.card as string] : undefined
    if (journalCard) {
      const height = width * (journalCard.h / journalCard.w)
      return (
        <div
          className="card-bg"
          style={{ width, height, backgroundImage: `url(${journalCard.src})`, transform: `rotate(${rot}deg)`, borderRadius: 6 }}
        >
          <div
            className="cap card-bg-text"
            style={{
              ...journalFont, textAlign: align, color: journalCard.light ? 'oklch(97% 0.01 85)' : undefined,
              top: `${journalCard.inset.top}%`, right: `${journalCard.inset.right}%`, bottom: `${journalCard.inset.bottom}%`, left: `${journalCard.inset.left}%`,
            }}
            dangerouslySetInnerHTML={{ __html: (data.text as string) || '' }}
          />
        </div>
      )
    }
    return (
      <div
        className={`journal-card${transparent ? ' no-bg' : ''}`}
        style={{
          width, background: transparent ? 'none' : journalColor.soft, borderLeftColor: journalColor.fg,
          transform: `rotate(${rot}deg)`,
        }}
      >
        <div className="cap" style={{ ...journalFont, textAlign: align }} dangerouslySetInnerHTML={{ __html: (data.text as string) || '' }} />
      </div>
    )
  }

  if (block.type === 'place') {
    const placeColor = resolveColor(data.color as string | undefined, BLOCK_COLORS.place)
    const pinStyle = data.pin_style === 'pin' ? 'pin' : 'outline'
    const placeName = ` ${block.place?.name ?? 'a place'} `
    if (pinStyle === 'pin') {
      return (
        <div className="place place-pinned" style={{ transform: `rotate(${rot}deg) translateZ(0)` }}>
          <img src={pinPhoto} alt="" draggable={false} className="place-pin-img" />
          <div className="place-name">{placeName}</div>
          {onEdit && <EditButton onEdit={onEdit} />}
        </div>
      )
    }
    return (
      <div className="place" style={{ transform: `rotate(${rot}deg) translateZ(0)` }}>
        <PlaceIcon color={placeColor.fg} />
        <div className="place-name">{placeName}</div>
        {onEdit && <EditButton onEdit={onEdit} />}
      </div>
    )
  }

  if (block.type === 'meal') {
    const mealPhoto = data.photo_url as string | undefined
    const mealColor = resolveColor(data.color as string | undefined, BLOCK_COLORS.meal)
    return (
      <div
        className="card ticket"
        style={{
          width: 150, background: mealPhoto ? undefined : mealColor.soft, transform: `rotate(${rot}deg)`, borderRadius: 4,
          padding: mealPhoto ? 0 : undefined, overflow: mealPhoto ? 'hidden' : undefined,
        }}
      >
        {mealPhoto && (
          <div style={{ width: '100%', aspectRatio: '4 / 3', backgroundImage: `url(${mealPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        )}
        <div className="cap" style={{ padding: mealPhoto ? '10px 14px 12px' : undefined, color: mealPhoto ? undefined : mealColor.fg }}>{(data.dish as string) || (data.description as string) || 'a meal'}</div>
      </div>
    )
  }

  // Gratitude was removed as a feature — old blocks of this type simply
  // stop rendering, same treatment as the earlier person-block removal.
  if (block.type === 'gratitude') return null

  if (block.type === 'movie') {
    const poster = block.movie?.poster_path
    const rating = block.movie?.rating
    const showTitle = data.show_title !== false
    const movieColor = resolveColor(data.color as string | undefined, BLOCK_COLORS.movie)
    return (
      <div
        className="card scrap"
        style={{
          width: 168, transform: `rotate(${rot}deg)`, borderRadius: 6,
          background: poster ? 'var(--card)' : movieColor.soft, padding: poster ? 0 : undefined, overflow: poster ? 'hidden' : undefined,
        }}
      >
        {poster ? (
          <>
            <div style={{ width: '100%', aspectRatio: '2 / 3', backgroundImage: `url(${poster})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            {showTitle && <div className="cap" style={{ padding: '8px 10px 0' }}>{block.movie?.title ?? 'a movie'}</div>}
            {rating != null && (
              <div className="stars" style={{ padding: showTitle ? '5px 8px 8px' : '8px 8px' }}>
                {[1, 2, 3, 4, 5].map((n) => <StarPng key={n} filled={n <= rating} />)}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="cap">{block.movie?.title ?? 'a movie'}</div>
            {rating != null && (
              <div className="stars">
                {[1, 2, 3, 4, 5].map((n) => <StarPng key={n} filled={n <= rating} />)}
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  if (block.type === 'text') {
    const style = (data.style as string) || 'headline'
    const content = (data.content as string) || (style === 'label' ? 'LABEL' : 'headline')
    return (
      <div className={style === 'label' ? 'label-el' : 'headline-el'} style={{ transform: `rotate(${rot}deg) translateZ(0)`, position: 'relative' }}>
        {style === 'label' ? ` ${content} ` : content}
        {onEdit && <EditButton onEdit={onEdit} />}
      </div>
    )
  }

  if (block.type === 'sticker') {
    const key = data.sticker as string | undefined
    const sticker = key ? STICKER_BY_KEY[key] : undefined
    if (!sticker) return null
    const cardScale = typeof data.card_scale === 'number' ? data.card_scale : 1
    const height = STICKER_BASE_WIDTH * (sticker.h / sticker.w)
    return (
      <div
        className="sticker-block"
        style={{ width: STICKER_BASE_WIDTH, height, transform: `rotate(${rot}deg) scale(${cardScale})` }}
      >
        <img src={sticker.src} alt="" draggable={false} />
      </div>
    )
  }

  // Person tagging is now an attribute of the photo/note it's attached to
  // (see block_people), not a visible card of its own — a dedicated
  // `type === 'person'` block from before this change simply renders
  // nothing.
  if (block.type === 'person') return null

  return (
    <div className="card scrap" style={{ width: 160, transform: `rotate(${rot}deg)`, borderRadius: 6 }}>
      <div className="cap">{(data.transcript as string) || 'a moment'}</div>
      {onEdit && <EditButton onEdit={onEdit} />}
    </div>
  )
}
