const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY as string | undefined
const TMDB_IMG = 'https://image.tmdb.org/t/p/w92'

// TEMP DEBUG — remove after diagnosis
if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.log('[tmdb-debug] VITE_TMDB_API_KEY:', TMDB_KEY ? `set (${TMDB_KEY.length} chars, starts ${TMDB_KEY.slice(0, 4)})` : 'MISSING / undefined')
}

export interface Provider {
  provider_id: number
  provider_name: string
  logo_path: string
  display_priority?: number
}

export interface WatchProviders {
  link: string | null
  flatrate: Provider[]
  rent: Provider[]
  buy: Provider[]
}

const cache = new Map<number, Promise<WatchProviders | null>>()

export function providerLogoUrl(p: Provider): string {
  return `${TMDB_IMG}${p.logo_path}`
}

export function hasTmdbKey(): boolean {
  return Boolean(TMDB_KEY)
}

function sortByPriority(list: Provider[] | undefined): Provider[] {
  if (!list) return []
  return [...list].sort((a, b) => (a.display_priority ?? 99) - (b.display_priority ?? 99))
}

export function getWatchProviders(tmdbId: number): Promise<WatchProviders | null> {
  if (!TMDB_KEY) return Promise.resolve(null)
  const cached = cache.get(tmdbId)
  if (cached) return cached
  const promise = fetch(`${TMDB_BASE}/movie/${tmdbId}/watch/providers?api_key=${TMDB_KEY}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      const tw = data?.results?.TW
      if (!tw) return null
      return {
        link: tw.link ?? null,
        flatrate: sortByPriority(tw.flatrate),
        rent: sortByPriority(tw.rent),
        buy: sortByPriority(tw.buy),
      } as WatchProviders
    })
    .catch(() => null)
  cache.set(tmdbId, promise)
  return promise
}
