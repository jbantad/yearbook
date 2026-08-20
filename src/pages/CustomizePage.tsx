import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BackIcon, BLOCK_ICONS, BLOCK_LABELS } from '../components/icons'
import { BLOCK_TYPES, COLOR_PRESETS, getBlockColor, saveBlockColor, type BlockTypeKey, type ColorPair } from '../lib/blockColors'

export function CustomizePage() {
  const navigate = useNavigate()
  const [colors, setColors] = useState<Record<BlockTypeKey, ColorPair>>(() => {
    const initial = {} as Record<BlockTypeKey, ColorPair>
    for (const t of BLOCK_TYPES) initial[t] = getBlockColor(t)
    return initial
  })

  useEffect(() => {
    document.title = 'Customize'
  }, [])

  function pick(type: BlockTypeKey, color: ColorPair) {
    saveBlockColor(type, color)
    setColors((prev) => ({ ...prev, [type]: color }))
  }

  return (
    <div className="screen">
      <div className="nav">
        <button onClick={() => navigate(-1)}><BackIcon /></button>
        <div className="title"><h1>Customize</h1></div>
        <div style={{ width: 32 }} />
      </div>

      <div className="customize-body">
        <div className="label" style={{ fontSize: 11.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 6 }}>Block colors</div>
        <div className="sub" style={{ fontSize: 12, color: 'var(--ink-soft)', fontStyle: 'italic', marginBottom: 14 }}>tap a swatch to change a block type's color</div>

        <div className="type-card">
          {BLOCK_TYPES.map((type) => {
            const Icon = BLOCK_ICONS[type]
            const current = colors[type]
            return (
              <div className="type-row" key={type}>
                <div className="ic" style={{ background: current.soft, color: current.fg }}>
                  <Icon />
                </div>
                <div className="nm">{BLOCK_LABELS[type]}</div>
                <div className="swatches">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      className={`swatch${current.fg === preset.fg ? ' sel' : ''}`}
                      style={{ background: preset.fg }}
                      aria-label={preset.name}
                      onClick={() => pick(type, { fg: preset.fg, soft: preset.soft })}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
