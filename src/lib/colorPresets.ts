export type ColorPreset = { name: string; fg: string; soft: string }

export const COLOR_PRESETS: ColorPreset[] = [
  { name: 'amber', fg: 'oklch(62% 0.13 55)', soft: 'oklch(92% 0.045 60)' },
  { name: 'sage', fg: 'oklch(58% 0.1 150)', soft: 'oklch(91% 0.035 150)' },
  { name: 'dusk', fg: 'oklch(55% 0.09 265)', soft: 'oklch(91% 0.03 265)' },
  { name: 'rose', fg: 'oklch(60% 0.13 20)', soft: 'oklch(92% 0.045 20)' },
  { name: 'plum', fg: 'oklch(52% 0.13 322)', soft: 'oklch(90% 0.035 322)' },
  { name: 'teal', fg: 'oklch(56% 0.09 195)', soft: 'oklch(90% 0.03 195)' },
  { name: 'blush', fg: 'oklch(60% 0.12 350)', soft: 'oklch(91% 0.04 350)' },
  { name: 'gold', fg: 'oklch(63% 0.12 85)', soft: 'oklch(91% 0.04 85)' },
]

export function resolveColor(name: string | undefined, fallback: { fg: string; soft: string }): { fg: string; soft: string } {
  const preset = COLOR_PRESETS.find((p) => p.name === name)
  return preset ? { fg: preset.fg, soft: preset.soft } : fallback
}
