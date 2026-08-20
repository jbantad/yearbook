export function hashRotation(id: string, spread = 6): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0
  }
  const norm = ((h % 1000) + 1000) % 1000 / 1000 // 0..1
  return (norm - 0.5) * spread
}

// Scattered starting spots for blocks that have never been dragged (layout.x/y unset),
// roughly matching the hand-placed look of the design mockup. Cycled by index, with a
// per-id hash jitter so blocks sharing a slot don't stack exactly on top of each other.
const DEFAULT_SLOTS: Array<{ x: number; y: number }> = [
  { x: 18, y: 16 },
  { x: 236, y: 40 },
  { x: 24, y: 240 },
  { x: 210, y: 210 },
  { x: 70, y: 380 },
  { x: 220, y: 350 },
  { x: 40, y: 480 },
]

export function defaultBlockPosition(id: string, index: number): { x: number; y: number } {
  const slot = DEFAULT_SLOTS[index % DEFAULT_SLOTS.length]
  return {
    x: Math.max(4, slot.x + hashRotation(id + ':x', 40)),
    y: Math.max(4, slot.y + hashRotation(id + ':y', 30)),
  }
}
