import { COLOR_PRESETS } from '../lib/colorPresets'

export function ColorSwatchPicker({ value, onChange }: { value?: string; onChange: (name: string) => void }) {
  return (
    <div className="swatches">
      {COLOR_PRESETS.map((p) => (
        <button
          type="button"
          key={p.name}
          className={`swatch${value === p.name ? ' sel' : ''}`}
          style={{ background: p.fg }}
          aria-label={p.name}
          onClick={() => onChange(p.name)}
        />
      ))}
    </div>
  )
}
