import polaroidClassic from '../assets/polaroid-frame.png'
import polaroidTall from '../assets/polaroid-frame-tall.png'
import polaroidSquare from '../assets/polaroid-frame-square.png'

export const FRAME_SIZES: Record<string, { w: number; h: number; src: string }> = {
  classic: { w: 168, h: 132, src: polaroidClassic },
  tall: { w: 132, h: 186, src: polaroidTall },
  square: { w: 150, h: 164, src: polaroidSquare },
}

// Each frame PNG cuts its photo window at a different spot, so the
// photo-art layer's inset must match that frame's own art, not a
// one-size-fits-all box.
export const FRAME_WINDOWS: Record<string, { left: number; right: number; top: number; bottom: number }> = {
  classic: { left: 4.9, right: 4.3, top: 8.7, bottom: 19.1 },
  tall: { left: 9.6, right: 9.6, top: 5.7, bottom: 14.7 },
  square: { left: 9.2, right: 9.0, top: 8.4, bottom: 23.9 },
}
