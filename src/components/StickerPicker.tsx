import { useEffect, useRef, useState } from 'react'
import { STICKERS, type StickerSelection } from '../lib/stickers'
import { searchGiphy, giphyConfigured, type GiphyResult } from '../lib/giphy'

// Shared by AddSheet (creating a sticker) and EditStickerSheet (swapping
// one) — a plain grid of the app's own bundled stickers, plus a GIPHY
// search tab for animated stickers/GIFs pulled in live. Both tabs hand
// back the same StickerSelection shape (see lib/stickers.ts) so neither
// caller needs to know which kind of pick this was.
export function StickerPicker({ value, onChange }: { value: StickerSelection | null; onChange: (v: StickerSelection) => void }) {
  const [tab, setTab] = useState<'mine' | 'search'>('mine')
  const [kind, setKind] = useState<'stickers' | 'gifs'>('stickers')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GiphyResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<number | null>(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    if (tab !== 'search') return
    if (!giphyConfigured()) {
      setError('GIF search isn’t set up yet.')
      return
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    const requestId = ++requestIdRef.current
    debounceRef.current = window.setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        // GIPHY's search wants an actual query — an empty box falls back to
        // "sticker"/"gif" so the grid isn't just blank before you type.
        const r = await searchGiphy(kind, query.trim() || kind.slice(0, -1))
        if (requestId !== requestIdRef.current) return
        setResults(r)
      } catch (err) {
        if (requestId !== requestIdRef.current) return
        setError(err instanceof Error ? err.message : 'Search failed')
      } finally {
        if (requestId === requestIdRef.current) setLoading(false)
      }
    }, 400)
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current) }
  }, [tab, kind, query])

  return (
    <div className="field">
      <label>Sticker</label>
      <div className="segmented" style={{ marginBottom: 10 }}>
        <button type="button" className={`seg${tab === 'mine' ? ' sel' : ''}`} onClick={() => setTab('mine')}>My stickers</button>
        <button type="button" className={`seg${tab === 'search' ? ' sel' : ''}`} onClick={() => setTab('search')}>Search GIFs</button>
      </div>

      {tab === 'mine' ? (
        <div className="sticker-grid">
          {STICKERS.map((s) => (
            <button
              type="button"
              key={s.key}
              className={`sticker-opt${value?.kind === 'local' && value.key === s.key ? ' sel' : ''}`}
              onClick={() => onChange({ kind: 'local', key: s.key })}
            >
              <img src={s.src} alt="" />
            </button>
          ))}
        </div>
      ) : (
        <div>
          <div className="segmented" style={{ marginBottom: 10 }}>
            <button type="button" className={`seg${kind === 'stickers' ? ' sel' : ''}`} onClick={() => setKind('stickers')}>Stickers</button>
            <button type="button" className={`seg${kind === 'gifs' ? ' sel' : ''}`} onClick={() => setKind('gifs')}>GIFs</button>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`search ${kind}…`}
            style={{ marginBottom: 10 }}
          />
          {error && <div className="sub" style={{ color: 'var(--rose)', marginBottom: 8 }}>{error}</div>}
          {loading && <div className="sub" style={{ marginBottom: 8 }}>searching…</div>}
          {!loading && !error && results.length === 0 && (
            <div className="sub" style={{ marginBottom: 8 }}>no results yet</div>
          )}
          <div className="sticker-grid">
            {results.map((r) => (
              <button
                type="button"
                key={r.id}
                className={`sticker-opt${value?.kind === 'remote' && value.url === r.url ? ' sel' : ''}`}
                onClick={() => onChange({ kind: 'remote', url: r.url, w: r.width, h: r.height })}
              >
                <img src={r.url} alt={r.title} loading="lazy" />
              </button>
            ))}
          </div>
          <div style={{ textAlign: 'right', fontSize: 10.5, color: 'var(--ink-faint)', marginTop: 8, fontStyle: 'italic' }}>
            Powered by GIPHY
          </div>
        </div>
      )}
    </div>
  )
}
