import { useEffect, useState } from 'react'

// Keep in sync with .block-scale-wrap's transform in global.css — blocks
// are visually scaled up at the desktop breakpoint (transform, not a JS
// value), but the canvas-height calculation that sizes the scrollable page
// needs to know that factor too, or a page full of desktop-scaled blocks
// gets clipped by .screen's overflow:hidden instead of scrolling to fit.
const DESKTOP_BREAKPOINT = '(min-width: 1200px)'
const DESKTOP_SCALE = 1.5

export function useDesktopBlockScale(): number {
  const [scale, setScale] = useState(() => (typeof window !== 'undefined' && window.matchMedia(DESKTOP_BREAKPOINT).matches ? DESKTOP_SCALE : 1))

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_BREAKPOINT)
    const update = () => setScale(mq.matches ? DESKTOP_SCALE : 1)
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return scale
}
