import polaroidClassic from '../assets/polaroid-frame.png'
import polaroidTall from '../assets/polaroid-frame-tall.png'
import polaroidSquare from '../assets/polaroid-frame-square.png'
import polaroidTriptych from '../assets/polaroid-frame-triptych.png'

export const FRAME_SIZES: Record<string, { w: number; h: number; src: string }> = {
  classic: { w: 323, h: 255, src: polaroidClassic },
  tall: { w: 132, h: 186, src: polaroidTall },
  square: { w: 130, h: 154, src: polaroidSquare },
  triptych: { w: 140, h: 433, src: polaroidTriptych },
  // Shown to users as "Lrg. Square" — the same square-polaroid artwork,
  // just rendered bigger (2x its w/h), not a distinct frame design.
  white: { w: 260, h: 308, src: polaroidSquare },
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
  // Same artwork as "square", so the same window.
  white: { left: 7.5, right: 7.3, top: 6.4, bottom: 22.8 },
}

// The triptych frame has three separate photo windows stacked in one strip,
// so it needs a window rect per slot instead of the single one above.
export const TRIPTYCH_WINDOWS: { left: number; right: number; top: number; bottom: number }[] = [
  { left: 6.1, right: 6.9, top: 1.5, bottom: 68.3 },
  { left: 6.1, right: 6.9, top: 32.0, bottom: 37.9 },
  { left: 6.1, right: 6.9, top: 62.7, bottom: 7.2 },
]
