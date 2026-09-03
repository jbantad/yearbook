import { useEffect, useRef, useState } from 'react'

// A fixed-position FAB sits at a constant spot on screen, so whatever
// content happens to scroll under that spot — the tail end of a long
// journal entry, say — gets covered by it while passing through. Hiding
// the button while the page is actively scrolling (and bringing it back
// once scrolling settles) keeps it out of the way of text moving past,
// which is when the overlap is most likely to be mid-read.
export function useHideOnScroll(idleDelay = 500) {
  const [visible, setVisible] = useState(true)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    function onScroll() {
      setVisible(false)
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
      timeoutRef.current = window.setTimeout(() => setVisible(true), idleDelay)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    }
  }, [idleDelay])

  return visible
}
