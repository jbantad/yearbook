import { useRef } from 'react'

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  onDoubleTap,
  ignoreSelector,
}: {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onDoubleTap?: () => void
  ignoreSelector?: string
}) {
  const gestureRef = useRef<{ startX: number; startY: number } | null>(null)
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null)

  function onPointerDown(e: React.PointerEvent) {
    if (ignoreSelector && (e.target as HTMLElement).closest(ignoreSelector)) return
    gestureRef.current = { startX: e.clientX, startY: e.clientY }
  }

  function onPointerUp(e: React.PointerEvent) {
    const start = gestureRef.current
    gestureRef.current = null
    if (!start) return
    const dx = e.clientX - start.startX
    const dy = e.clientY - start.startY
    const dist = Math.hypot(dx, dy)

    if (dist < 10) {
      const now = Date.now()
      const last = lastTapRef.current
      if (last && now - last.time < 350 && Math.hypot(e.clientX - last.x, e.clientY - last.y) < 30) {
        lastTapRef.current = null
        onDoubleTap?.()
        return
      }
      lastTapRef.current = { time: now, x: e.clientX, y: e.clientY }
      return
    }

    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) onSwipeLeft?.()
      else onSwipeRight?.()
    }
  }

  return { onPointerDown, onPointerUp }
}
