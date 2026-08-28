import polaroidClassic from '../assets/polaroid-frame.png'
import polaroidTall from '../assets/polaroid-frame-tall.png'
import polaroidSquare from '../assets/polaroid-frame-square.png'

export const FRAME_SIZES: Record<string, { w: number; h: number; src: string }> = {
  classic: { w: 148, h: 112, src: polaroidClassic },
  tall: { w: 132, h: 186, src: polaroidTall },
  square: { w: 130, h: 154, src: polaroidSquare },
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
}
