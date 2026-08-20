export function hashRotation(id: string, spread = 6): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0
  }
  const norm = ((h % 1000) + 1000) % 1000 / 1000 // 0..1
  return (norm - 0.5) * spread
}
