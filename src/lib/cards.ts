import nightSky from '../assets/cards/night-sky-star-border.jpg'
import ripPaper from '../assets/cards/rip-paper-stars.png'

export type CardInset = { top: number; right: number; bottom: number; left: number }
// A rectangular spacer floated at the top-left of the text box (percentages
// of the text box's own width/height, same as a CSS float + shape-margin)
// so text wraps tighter around a specific corner decoration instead of the
// whole top margin dropping to clear it everywhere.
export type CardCornerFloat = { width: number; height: number; margin: number }

export type Card = { key: string; src: string; w: number; h: number; light: boolean; inset: CardInset; cornerFloat?: CardCornerFloat }

// A "card" is a decorative background for a note/journal block — unlike a
// sticker (placed as its own free-floating block), a card sits behind the
// block's text. It's always rendered at its own natural aspect ratio (never
// stretched), so the block's box height is derived from its chosen width
// and the card's w/h ratio. `light` marks a dark card whose text needs to
// render in a light color to stay legible. `inset` (percent per side) is
// the safe zone the text is kept within — each card's decoration sits in a
// different place, so this is per-card rather than one constant.
export const CARDS: Card[] = [
  { key: 'night-sky', src: nightSky, w: 394, h: 700, light: true, inset: { top: 16, right: 14, bottom: 16, left: 14 } },
  {
    key: 'rip-paper', src: ripPaper, w: 452, h: 700, light: false,
    // Only the top needs the corner-float treatment — the big star sits
    // right at the top-left, but the bottom-right cluster is small enough
    // that a plain bottom margin clears it without wasting the rest of the
    // width the way a full top margin would have.
    inset: { top: 8, right: 9, bottom: 20, left: 13 },
    cornerFloat: { width: 42, height: 22, margin: 4 },
  },
]

export const CARD_BY_KEY: Record<string, Card> = Object.fromEntries(CARDS.map((c) => [c.key, c]))
