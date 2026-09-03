import polaroidClassic from '../assets/polaroid-frame.png'
import polaroidTall from '../assets/polaroid-frame-tall.png'
import polaroidSquare from '../assets/polaroid-frame-square.png'
import polaroidTriptych from '../assets/polaroid-frame-triptych.png'

// `h` is the frame's natural height at that width — the reference the PNG's
// own art and FRAME_WINDOWS below are measured against. `visibleH`, when
// set, crops the rendered card down to something shorter than `h` (see
// frameCapBottomPercent) instead of squeezing the whole thing to fit —
// stretching a shorter box via background-size would shrink the photo
// window right along with the border, not just trim the empty margin below
// the caption.
export const FRAME_SIZES: Record<string, { w: number; h: number; visibleH?: number; src: string }> = {
  classic: { w: 323, h: 255, src: polaroidClassic },
  tall: { w: 132, h: 186, src: polaroidTall },
  square: { w: 130, h: 154, src: polaroidSquare },
  triptych: { w: 140, h: 433, src: polaroidTriptych },
  // Shown to users as "Lrg. Square" — the same square-polaroid artwork, at
  // 2x its own w/h, just cropped shorter (see visibleH) so the resulting
  // ~70px caption margin isn't mostly empty space. The photo window and
  // border are otherwise identical to "square", just twice the size.
  white: { w: 260, h: 308, visibleH: 273, src: polaroidSquare },
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
  // Same artwork as "square", so the same window — cropping (see visibleH
  // above) doesn't move where the window is, only how much of the margin
  // below it stays visible.
  white: { left: 7.5, right: 7.3, top: 6.4, bottom: 22.8 },
}

// A cropped frame's caption sits within whatever margin is left below the
// window once visibleH clips the rest away, not the frame's full bottom
// margin — measured against the *cropped* height, not FRAME_WINDOWS.bottom
// (which is measured against the full, uncropped `h`). Uncropped frames get
// their plain FRAME_WINDOWS.bottom back unchanged.
export function frameCapBottomPercent(key: string): number {
  const frame = FRAME_SIZES[key] ?? FRAME_SIZES.classic
  const win = FRAME_WINDOWS[key] ?? FRAME_WINDOWS.classic
  const visibleH = frame.visibleH ?? frame.h
  if (visibleH === frame.h) return win.bottom
  const windowBottomFromTop = (1 - win.bottom / 100) * frame.h
  return ((visibleH - windowBottomFromTop) / visibleH) * 100
}

// The triptych frame has three separate photo windows stacked in one strip,
// so it needs a window rect per slot instead of the single one above.
export const TRIPTYCH_WINDOWS: { left: number; right: number; top: number; bottom: number }[] = [
  { left: 6.1, right: 6.9, top: 1.5, bottom: 68.3 },
  { left: 6.1, right: 6.9, top: 32.0, bottom: 37.9 },
  { left: 6.1, right: 6.9, top: 62.7, bottom: 7.2 },
]
