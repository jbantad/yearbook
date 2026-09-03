import type { CSSProperties } from 'react'
import polaroidClassic from '../assets/polaroid-frame.png'
import polaroidTall from '../assets/polaroid-frame-tall.png'
import polaroidSquare from '../assets/polaroid-frame-square.png'
import polaroidTriptych from '../assets/polaroid-frame-triptych.png'

export const FRAME_SIZES: Record<string, { w: number; h: number; src: string }> = {
  classic: { w: 323, h: 255, src: polaroidClassic },
  tall: { w: 132, h: 186, src: polaroidTall },
  square: { w: 130, h: 154, src: polaroidSquare },
  triptych: { w: 140, h: 433, src: polaroidTriptych },
  // No illustrated PNG — "white" (shown to users as "Lrg. Square") is a
  // plain mat, painted by frameChromeStyle below instead of an image asset.
  // Same proportions as the "square" polaroid, just bigger — 2x its w/h.
  white: { w: 260, h: 308, src: '' },
}

// Each frame PNG cuts its photo window at a different spot, so the
// photo-art layer's inset must match that frame's own art, not a
// one-size-fits-all box. Measured from each PNG's soft (antialiased)
// window edge with a small extra margin subtracted so the photo layer
// always bleeds slightly under the opaque frame border — undersizing
// it left a sliver of the page background peeking through the window.
export const FRAME_WINDOWS: Record<string, { left: number; right: number; top: number; bottom: number }> = {
  classic: { left: 4.0, right: 3.4, top: 7.9, bottom: 18.2 },
  tall: { left: 8.5, right: 8.9, top: 4.8, bottom: 13.8 },
  square: { left: 7.5, right: 7.3, top: 6.4, bottom: 22.8 },
  // Same window as "square" — same shape, just plain and bigger.
  white: { left: 7.5, right: 7.3, top: 6.4, bottom: 22.8 },
}

// For a standalone preview with no photo underneath it (the frame-picker
// swatches) — an illustrated thumbnail for the PNG frames, a plain white
// swatch for "white". Not safe to reuse where an actual photo is layered
// underneath; see frameOverlayStyle below for why.
export function frameChromeStyle(key: string): CSSProperties {
  if (key === 'white') {
    return {
      backgroundImage: 'none',
      backgroundColor: '#fdfdfc',
      boxShadow: 'inset 0 0 0 1px oklch(90% 0.01 50)',
    }
  }
  const frame = FRAME_SIZES[key] ?? FRAME_SIZES.classic
  return { backgroundImage: `url(${frame.src})`, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat' }
}

// The illustrated frames draw their border as an overlay div stacked ON TOP
// of the actual photo (z-index above photo-art) — that only works because
// each PNG has a transparent cutout exactly at the photo window, so the
// photo shows through despite technically sitting "underneath". A plain
// white mat has no artwork and thus no cutout: painting a solid color here
// would just hide the whole photo behind it. So this overlay stays fully
// inert for "white", and the mat itself is painted by frameContainerStyle
// on the card BEHIND the photo instead, where the photo-art layer (which
// is already inset by the window margin, not full-bleed) naturally paints
// over it and leaves only the border showing.
export function frameOverlayStyle(key: string): CSSProperties {
  if (key === 'white') return { backgroundImage: 'none' }
  const frame = FRAME_SIZES[key] ?? FRAME_SIZES.classic
  return { backgroundImage: `url(${frame.src})`, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat' }
}

// The card's own background, painted behind everything. Irrelevant for the
// illustrated frames (their PNG overlay supplies the entire visible border),
// but for "white" this — not the overlay above — is what actually paints
// the mat.
export function frameContainerStyle(key: string): CSSProperties {
  if (key === 'white') {
    return { background: '#fdfdfc', boxShadow: '0 6px 14px oklch(30% 0.03 50 / 0.2), 0 1px 3px oklch(30% 0.03 50 / 0.14)' }
  }
  return {}
}

// The triptych frame has three separate photo windows stacked in one strip,
// so it needs a window rect per slot instead of the single one above.
export const TRIPTYCH_WINDOWS: { left: number; right: number; top: number; bottom: number }[] = [
  { left: 6.1, right: 6.9, top: 1.5, bottom: 68.3 },
  { left: 6.1, right: 6.9, top: 32.0, bottom: 37.9 },
  { left: 6.1, right: 6.9, top: 62.7, bottom: 7.2 },
]
