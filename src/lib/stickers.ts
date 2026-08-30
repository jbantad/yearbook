import arrow1 from '../assets/stickers/arrow-1.png'
import arrow2 from '../assets/stickers/arrow-2.png'
import arrow3 from '../assets/stickers/arrow-3.png'
import arrow4 from '../assets/stickers/arrow-4.png'
import arrow5 from '../assets/stickers/arrow-5.png'
import arrow6 from '../assets/stickers/arrow-6.png'
import arrow7 from '../assets/stickers/arrow-7.png'

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
]

export const STICKER_BY_KEY: Record<string, { src: string; w: number; h: number }> =
  Object.fromEntries(STICKERS.map((s) => [s.key, s]))
