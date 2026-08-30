import { useEffect, useState } from 'react'

// Typing a value directly beats clicking +/-1° dozens of times to reach
// something like 90°. Keeps its own text buffer so a mid-edit blank or
// bare "-" isn't stomped by the controlled value on every keystroke — only
// synced back from the outside (a +/-1 click, or a prop change) or on blur.
export function RotationField({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [text, setText] = useState(String(Math.round(value)))

  useEffect(() => {
    setText(String(Math.round(value)))
  }, [value])

  function handleChange(raw: string) {
    setText(raw)
    const n = parseFloat(raw)
    if (!Number.isNaN(n)) onChange(n)
  }

  return (
    <div className="rotate-row">
      <button type="button" onClick={() => onChange(value - 1)} aria-label="Rotate left">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12a8 8 0 0 1 14-5.3M4 4v4h4" /></svg>
      </button>
      <div className="rotate-input-wrap">
        <input
          type="number"
          className="rotate-input"
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={() => setText(String(Math.round(value)))}
          aria-label="Rotation in degrees"
        />
        <span>°</span>
      </div>
      <button type="button" onClick={() => onChange(value + 1)} aria-label="Rotate right">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12a8 8 0 0 1-14 5.3M20 20v-4h-4" /></svg>
      </button>
    </div>
  )
}
