import type { CSSProperties, ReactNode } from 'react'

export function Polaroid({
  style,
  art,
  caption,
  captionStyle,
  children,
}: {
  style: CSSProperties
  art: ReactNode
  caption: string
  captionStyle?: CSSProperties
  children?: ReactNode
}) {
  return (
    <div className="card polaroid" style={style}>
      <div className="frame-img" />
      <div className="photo-art">{art}</div>
      <div className="cap" style={captionStyle}>{caption}</div>
      {children}
    </div>
  )
}

export function SunsetArt() {
  return (
    <>
      <div className="sun" />
    </>
  )
}

export function FireArt() {
  return <div className="log" style={{ position: 'absolute', left: '20%', right: '20%', bottom: '18%', height: 8, borderRadius: 4, background: 'oklch(14% 0.02 40)' }} />
}
