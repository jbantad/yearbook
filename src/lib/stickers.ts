import arrow1 from '../assets/stickers/arrow-1.png'
import arrow2 from '../assets/stickers/arrow-2.png'
import arrow3 from '../assets/stickers/arrow-3.png'
import arrow4 from '../assets/stickers/arrow-4.png'
import arrow5 from '../assets/stickers/arrow-5.png'
import arrow6 from '../assets/stickers/arrow-6.png'
import arrow7 from '../assets/stickers/arrow-7.png'
import speech1 from '../assets/stickers/speech-1.png'
import plumbobPurple from '../assets/stickers/plumbob-purple.png'
import plumbobOrange from '../assets/stickers/plumbob-orange.png'
import plumbobGreen from '../assets/stickers/plumbob-green.png'
import yellowOrangeBlock from '../assets/stickers/yellow-orange-block.png'
import thoughtBubble from '../assets/stickers/thought-bubble.png'
import starScatter from '../assets/stickers/star-scatter.png'
import partyHat from '../assets/stickers/party-hat.png'
import cucumber from '../assets/stickers/cucumber.png'
import monopolyMoney from '../assets/stickers/monopoly-money.png'
import eggSoup from '../assets/stickers/egg-soup.png'
import washiTapePurple from '../assets/stickers/washi-tape-purple.png'
import purpleStars from '../assets/stickers/purple-stars.png'
import lavenderStarField from '../assets/stickers/lavender-star-field.png'

// On-canvas width at card_scale 1 — each sticker's own aspect ratio (w/h,
// captured from the source crop) then determines its rendered height.
export const STICKER_BASE_WIDTH = 110

export const STICKERS: { key: string; src: string; w: number; h: number }[] = [
  { key: 'arrow-1', src: arrow1, w: 500, h: 287 },
  { key: 'arrow-2', src: arrow2, w: 408, h: 500 },
  { key: 'arrow-3', src: arrow3, w: 500, h: 300 },
  { key: 'arrow-4', src: arrow4, w: 303, h: 500 },
  { key: 'arrow-5', src: arrow5, w: 500, h: 278 },
  { key: 'arrow-6', src: arrow6, w: 500, h: 214 },
  { key: 'arrow-7', src: arrow7, w: 500, h: 285 },
  { key: 'speech-1', src: speech1, w: 500, h: 377 },
  { key: 'plumbob-purple', src: plumbobPurple, w: 250, h: 500 },
  { key: 'plumbob-orange', src: plumbobOrange, w: 249, h: 500 },
  { key: 'plumbob-green', src: plumbobGreen, w: 248, h: 500 },
  { key: 'yellow-orange-block', src: yellowOrangeBlock, w: 500, h: 349 },
  { key: 'thought-bubble', src: thoughtBubble, w: 500, h: 271 },
  { key: 'star-scatter', src: starScatter, w: 378, h: 500 },
  { key: 'party-hat', src: partyHat, w: 316, h: 500 },
  { key: 'cucumber', src: cucumber, w: 500, h: 486 },
  { key: 'monopoly-money', src: monopolyMoney, w: 344, h: 333 },
  { key: 'egg-soup', src: eggSoup, w: 500, h: 459 },
  { key: 'washi-tape-purple', src: washiTapePurple, w: 457, h: 144 },
  { key: 'purple-stars', src: purpleStars, w: 324, h: 336 },
  { key: 'lavender-star-field', src: lavenderStarField, w: 500, h: 354 },
]

export const STICKER_BY_KEY: Record<string, { src: string; w: number; h: number }> =
  Object.fromEntries(STICKERS.map((s) => [s.key, s]))

// A sticker block's picture can come from this file's own bundled set
// (`local`) or from a GIPHY search result saved by url (`remote`) — the
// same StickerPicker UI hands back either shape, and both render through
// the same <img>, so nothing downstream needs to care which one it is.
export type StickerSelection = { kind: 'local'; key: string } | { kind: 'remote'; url: string; w: number; h: number }

export function stickerSelectionImage(sel: StickerSelection | null | undefined): { src: string; w: number; h: number } | null {
  if (!sel) return null
  if (sel.kind === 'local') {
    const s = STICKER_BY_KEY[sel.key]
    return s ? { src: s.src, w: s.w, h: s.h } : null
  }
  return { src: sel.url, w: sel.w, h: sel.h }
}

// A block's stored `data` only ever has one of `sticker` (a local key) or
// `sticker_url`/`sticker_w`/`sticker_h` (a remote pick) set at a time —
// this reads whichever is present back into the shared selection shape the
// picker and save logic both work with.
export function stickerSelectionFromData(data: { sticker?: unknown; sticker_url?: unknown; sticker_w?: unknown; sticker_h?: unknown }): StickerSelection | null {
  if (typeof data.sticker_url === 'string' && typeof data.sticker_w === 'number' && typeof data.sticker_h === 'number') {
    return { kind: 'remote', url: data.sticker_url, w: data.sticker_w, h: data.sticker_h }
  }
  if (typeof data.sticker === 'string') return { kind: 'local', key: data.sticker }
  return null
}

// The flip side of stickerSelectionFromData — spreads the right fields into
// a block's `data` for saving, and clears out whichever kind isn't
// selected so switching from one to the other doesn't leave a stale field
// behind (e.g. an old sticker_url still set after picking a local sticker).
export function stickerSelectionToData(sel: StickerSelection): { sticker?: string; sticker_url?: string; sticker_w?: number; sticker_h?: number } {
  if (sel.kind === 'local') return { sticker: sel.key, sticker_url: undefined, sticker_w: undefined, sticker_h: undefined }
  return { sticker: undefined, sticker_url: sel.url, sticker_w: sel.w, sticker_h: sel.h }
}
