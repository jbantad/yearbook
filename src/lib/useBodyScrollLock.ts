import { useEffect } from 'react'

// Used by every bottom sheet. overflow:hidden on body alone doesn't stop
// iOS Safari from still scrolling/rubber-banding the page behind a
// fixed-position overlay — pinning body in place with position:fixed and a
// negative top offset (then restoring the exact scroll position on close)
// is the reliable cross-browser way to lock background scroll while a
// sheet is open.
export function useBodyScrollLock() {
  useEffect(() => {
    const scrollY = window.scrollY
    const { style } = document.body
    const prev = { position: style.position, top: style.top, width: style.width, overflow: style.overflow }
    style.position = 'fixed'
    style.top = `-${scrollY}px`
    style.width = '100%'
    style.overflow = 'hidden'
    return () => {
      style.position = prev.position
      style.top = prev.top
      style.width = prev.width
      style.overflow = prev.overflow
      window.scrollTo(0, scrollY)
    }
  }, [])
}
