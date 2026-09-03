import { useEffect } from 'react'

// Used by every bottom sheet. overflow:hidden on body alone doesn't stop
// iOS Safari from still scrolling/rubber-banding the page behind a
// fixed-position overlay — pinning body in place with position:fixed and a
// negative top offset (then restoring the exact scroll position on close)
// is the reliable cross-browser way to lock background scroll while a
// sheet is open.
//
// Reference-counted at module scope rather than each hook instance saving
// and restoring its own snapshot: if two sheets were ever mounted at once
// (even briefly, e.g. one opening before the other's close animation/state
// update settles) and the outer one's cleanup ran first, it would restore
// body.style to its pre-lock snapshot while the inner sheet was still open
// — then the inner sheet's own cleanup would restore ITS snapshot (captured
// while already locked), permanently re-pinning body at position:fixed with
// a stale top offset, since nothing would ever run to undo that. Only the
// outermost lock/unlock actually touches body.style now, so the body can
// never be left stuck mid-stack.
let lockCount = 0
let savedScrollY = 0
let savedStyle: { position: string; top: string; width: string; overflow: string } | null = null

export function useBodyScrollLock() {
  useEffect(() => {
    if (lockCount === 0) {
      const { style } = document.body
      savedScrollY = window.scrollY
      savedStyle = { position: style.position, top: style.top, width: style.width, overflow: style.overflow }
      style.position = 'fixed'
      style.top = `-${savedScrollY}px`
      style.width = '100%'
      style.overflow = 'hidden'
    }
    lockCount++
    return () => {
      lockCount--
      if (lockCount === 0 && savedStyle) {
        const { style } = document.body
        style.position = savedStyle.position
        style.top = savedStyle.top
        style.width = savedStyle.width
        style.overflow = savedStyle.overflow
        window.scrollTo(0, savedScrollY)
        savedStyle = null
      }
    }
  }, [])
}
