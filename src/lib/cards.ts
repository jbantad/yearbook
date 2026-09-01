import nightSky from '../assets/cards/night-sky-star-border.jpg'
import ripPaper from '../assets/cards/rip-paper-stars.png'

export type CardInset = { top: number; right: number; bottom: number; left: number }

// A "card" is a decorative background for a note/journal block — unlike a
// sticker (placed as its own free-floating block), a card sits behind the
// block's text. It's always rendered at its own natural aspect ratio (never
// stretched), so the block's box height is derived from its chosen width
// and the card's w/h ratio. `light` marks a dark card whose text needs to
// render in a light color to stay legible. `inset` (percent per side) is
// the safe zone the text is kept within — each card's decoration sits in a
// different place (rip-paper's big star eats the whole top-left corner, so
// it needs a much bigger top inset than a card with even, edge-hugging
// decoration like night-sky), so this is per-card rather than one constant.
export const CARDS: { key: string; src: string; w: number; h: number; light: boolean; inset: CardInset }[] = [
  { key: 'night-sky', src: nightSky, w: 394, h: 700, light: true, inset: { top: 16, right: 14, bottom: 16, left: 14 } },
  { key: 'rip-paper', src: ripPaper, w: 452, h: 700, light: false, inset: { top: 22, right: 9, bottom: 20, left: 9 } },
]

export const CARD_BY_KEY: Record<string, { src: string; w: number; h: number; light: boolean; inset: CardInset }> =
  Object.fromEntries(CARDS.map((c) => [c.key, c]))
