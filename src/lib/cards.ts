import nightSky from '../assets/cards/night-sky-star-border.jpg'
import ripPaper from '../assets/cards/rip-paper-stars.png'

// A "card" is a decorative background for a note/journal block — unlike a
// sticker (placed as its own free-floating block), a card sits behind the
// block's text. It's always rendered at its own natural aspect ratio (never
// stretched), so the block's box height is derived from its chosen width
// and the card's w/h ratio. `light` marks a dark card whose text needs to
// render in a light color to stay legible.
export const CARDS: { key: string; src: string; w: number; h: number; light: boolean }[] = [
  { key: 'night-sky', src: nightSky, w: 394, h: 700, light: true },
  { key: 'rip-paper', src: ripPaper, w: 452, h: 700, light: false },
]

export const CARD_BY_KEY: Record<string, { src: string; w: number; h: number; light: boolean }> =
  Object.fromEntries(CARDS.map((c) => [c.key, c]))
