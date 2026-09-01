import { CARDS } from '../lib/cards'

export function CardPicker({ value, onChange }: { value?: string; onChange: (key: string | undefined) => void }) {
  return (
    <div className="card-swatches">
      <button
        type="button"
        className={`card-swatch card-swatch-none${!value ? ' sel' : ''}`}
        onClick={() => onChange(undefined)}
      >
        None
      </button>
      {CARDS.map((c) => (
        <button
          type="button"
          key={c.key}
          className={`card-swatch${value === c.key ? ' sel' : ''}`}
          style={{ backgroundImage: `url(${c.src})` }}
          onClick={() => onChange(c.key)}
          aria-label={c.key}
        />
      ))}
    </div>
  )
}
