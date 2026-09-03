// GIPHY is the only major GIF/sticker search API still around with a free
// tier — Tenor's was shut down by Google in 2026. The free "Beta" key is
// rate-limited (100 req/hour, 50 results/request) but otherwise free for
// personal use; see https://developers.giphy.com/docs/api/. Their terms
// require a "Powered by GIPHY" credit wherever results are shown (see the
// attribution line in StickerPicker), not a watermark on the media itself.
const API_KEY = import.meta.env.VITE_GIPHY_API_KEY as string | undefined

export function giphyConfigured(): boolean {
  return !!API_KEY
}

export type GiphyResult = { id: string; url: string; width: number; height: number; title: string }

type GiphyImageRendition = { url?: string; width?: string; height?: string }

// GIPHY returns a bundle of pre-rendered sizes per result. fixed_width is a
// consistent ~200px-wide render — small enough to search quickly and load a
// whole grid of results at once, still sharp enough once dropped on the
// page and resized a bit — falling back to the full "original" for the
// rare result missing it.
function pickRendition(images: Record<string, GiphyImageRendition>) {
  const r = images.fixed_width?.url ? images.fixed_width : images.original
  if (!r?.url) return null
  return { url: r.url, width: Number(r.width) || 200, height: Number(r.height) || 200 }
}

export async function searchGiphy(kind: 'stickers' | 'gifs', query: string, limit = 24): Promise<GiphyResult[]> {
  if (!API_KEY) throw new Error('GIF search isn’t set up yet (missing VITE_GIPHY_API_KEY).')
  const params = new URLSearchParams({ api_key: API_KEY, q: query, limit: String(limit), rating: 'pg-13' })
  const res = await fetch(`https://api.giphy.com/v1/${kind}/search?${params.toString()}`)
  if (!res.ok) {
    throw new Error(res.status === 429 ? 'Too many searches right now — try again in a bit.' : `GIPHY search failed (${res.status})`)
  }
  const json = (await res.json()) as {
    data?: Array<{ id: string; title?: string; images: Record<string, GiphyImageRendition> }>
  }
  const out: GiphyResult[] = []
  for (const item of json.data ?? []) {
    const rendition = pickRendition(item.images)
    if (!rendition) continue
    out.push({ id: item.id, url: rendition.url, width: rendition.width, height: rendition.height, title: item.title || '' })
  }
  return out
}
