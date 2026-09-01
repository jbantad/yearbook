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
    // top/left here are just normal breathing room from the torn edge —
    // clearing the star itself is entirely the corner-float's job below,
    // not the inset's. The bottom-right cluster is small enough that a
    // plain bottom margin clears it without wasting the rest of the width
    // the way a full top margin would have.
    inset: { top: 10, right: 11, bottom: 20, left: 15 },
    // Percentages are relative to the text box (recalculated whenever the
    // inset above changes, since the box's own width/height changes too),
    // sized to reach the star's actual right/bottom edge — measured via a
    // pixel-coordinate grid overlaid directly on the source image (not
    // eyeballed) at ~42%/30% of the *card's* own width/height, plus a
    // buffer since a star's point is thin and easy to clip by a pixel or two.
    cornerFloat: { width: 39, height: 33, margin: 4 },
  },
]

export const CARD_BY_KEY: Record<string, Card> = Object.fromEntries(CARDS.map((c) => [c.key, c]))
