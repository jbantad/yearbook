export const BLOCK_TYPES = ['photo', 'note', 'place', 'meal', 'movie', 'person', 'gratitude'] as const
export type BlockTypeKey = (typeof BLOCK_TYPES)[number]

export type ColorPair = { fg: string; soft: string }

export const COLOR_PRESETS: { name: string; fg: string; soft: string }[] = [
  { name: 'amber', fg: 'oklch(62% 0.13 55)', soft: 'oklch(92% 0.045 60)' },
  { name: 'sage', fg: 'oklch(58% 0.1 150)', soft: 'oklch(91% 0.035 150)' },
  { name: 'dusk', fg: 'oklch(55% 0.09 265)', soft: 'oklch(91% 0.03 265)' },
  { name: 'rose', fg: 'oklch(60% 0.13 20)', soft: 'oklch(92% 0.045 20)' },
  { name: 'plum', fg: 'oklch(52% 0.13 322)', soft: 'oklch(90% 0.035 322)' },
  { name: 'teal', fg: 'oklch(56% 0.09 195)', soft: 'oklch(90% 0.03 195)' },
  { name: 'blush', fg: 'oklch(60% 0.12 350)', soft: 'oklch(91% 0.04 350)' },
  { name: 'gold', fg: 'oklch(63% 0.12 85)', soft: 'oklch(91% 0.04 85)' },
]

const DEFAULTS: Record<BlockTypeKey, ColorPair> = {
  photo: COLOR_PRESETS[0],
  note: COLOR_PRESETS[1],
  place: COLOR_PRESETS[2],
  meal: COLOR_PRESETS[3],
  movie: COLOR_PRESETS[4],
  person: COLOR_PRESETS[5],
  gratitude: COLOR_PRESETS[6],
}

const STORAGE_KEY = 'yearbook.blockColors'

export function loadBlockColorOverrides(): Partial<Record<BlockTypeKey, ColorPair>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function getBlockColor(type: BlockTypeKey): ColorPair {
  return loadBlockColorOverrides()[type] ?? DEFAULTS[type]
}

export function applyBlockColors(overrides: Partial<Record<BlockTypeKey, ColorPair>> = loadBlockColorOverrides()) {
  const root = document.documentElement
  for (const type of BLOCK_TYPES) {
    const c = overrides[type] ?? DEFAULTS[type]
    root.style.setProperty(`--block-${type}`, c.fg)
    root.style.setProperty(`--block-${type}-soft`, c.soft)
  }
}

export function saveBlockColor(type: BlockTypeKey, color: ColorPair) {
  const current = loadBlockColorOverrides()
  current[type] = color
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
  applyBlockColors(current)
}
