import { createDirectus, rest, readItems } from '@directus/sdk'
import { movieDB } from '../data/movieDB'

const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL ?? 'http://localhost:8055'

export const directus = createDirectus(DIRECTUS_URL).with(rest())

export interface Tag {
  id: string
  name: string
  category: string
}

export interface MovieTag extends Tag {
  weight: number
}

export interface FestivalAward {
  id: string
  festival: string
  year: number
  edition: number | null
  award_category: string
  result: 'won' | 'nominated'
}

export interface Movie {
  id: string
  title: string
  original_title: string
  year: number
  poster: string | null
  poster_url: string | null
  tags: MovieTag[]
  festival_awards: FestivalAward[]
}

type DirectusMovie = {
  id: string
  title: string
  original_title: string
  year: number
  poster: string | null
  poster_url: string | null
  tags: Array<{ tags_id: Tag; weight: number }>
  festival_awards: FestivalAward[]
}

function localFallback(tagNames: string[]): Movie[] {
  const filtered = tagNames.length > 0
    ? movieDB.filter((m) => m.tags.some((t) => tagNames.includes(t)))
    : movieDB
  return filtered
    .sort(() => Math.random() - 0.5)
    .map((m, i) => ({
      id: String(i),
      title: m.title,
      original_title: '',
      year: 0,
      poster: m.img,
      poster_url: null,
      tags: m.tags.map((name, j) => ({ id: String(j), name, category: '', weight: 1.0 })),
      festival_awards: [],
    }))
}

export async function getMoviesByTags(tagNames: string[]): Promise<Movie[]> {
  try {
    const query = tagNames.length > 0
      ? { filter: { tags: { tags_id: { name: { _in: tagNames } } } } }
      : {}

    const result = (await directus.request(
      readItems('movies', {
        ...query,
        fields: ['id', 'title', 'original_title', 'year', 'poster', 'poster_url',
          'tags.tags_id.id', 'tags.tags_id.name', 'tags.tags_id.category', 'tags.weight',
          'festival_awards.id', 'festival_awards.festival', 'festival_awards.year',
          'festival_awards.edition', 'festival_awards.award_category', 'festival_awards.result'],
        limit: 50,
      })
    )) as DirectusMovie[]

    const movies: Movie[] = result.map((m) => ({
      id: m.id,
      title: m.title,
      original_title: m.original_title,
      year: m.year,
      poster: m.poster,
      poster_url: m.poster_url,
      tags: m.tags.map((t) => ({ ...t.tags_id, weight: t.weight ?? 1.0 })),
      festival_awards: m.festival_awards ?? [],
    }))

    if (movies.length > 0) return movies.sort(() => Math.random() - 0.5)
  } catch {
    // Directus 不可用，使用本地資料
  }

  return localFallback(tagNames)
}

export type MovieWithScore = Movie & { score: number }

function shuffleByScore(movies: MovieWithScore[]): MovieWithScore[] {
  const sorted = [...movies].sort((a, b) => b.score - a.score)
  const poolSize = Math.min(sorted.length, 10)
  const pool = sorted.slice(0, poolSize)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return [...pool, ...sorted.slice(poolSize)]
}

export async function getMoviesByMultipleTags(tagNames: string[]): Promise<MovieWithScore[]> {
  if (tagNames.length === 0) return []

  try {
    const result = (await directus.request(
      readItems('movies', {
        filter: { tags: { tags_id: { name: { _in: tagNames } } } },
        fields: ['id', 'title', 'original_title', 'year', 'poster', 'poster_url',
          'tags.tags_id.id', 'tags.tags_id.name', 'tags.tags_id.category', 'tags.weight',
          'festival_awards.id', 'festival_awards.festival', 'festival_awards.year',
          'festival_awards.edition', 'festival_awards.award_category', 'festival_awards.result'],
        limit: -1,
      })
    )) as DirectusMovie[]

    if (result.length === 0) return []

    const scored = result.map((m) => {
      const tags = m.tags.map((t) => ({ ...t.tags_id, weight: t.weight ?? 1.0 }))
      const festival_awards = m.festival_awards ?? []
      const tagScore = tags
        .filter((t) => tagNames.includes(t.name))
        .reduce((sum, t) => sum + t.weight, 0)
      const festivalScore = festival_awards.reduce(
        (sum, a) => sum + (a.result === 'won' ? 2 : 1), 0
      )
      return {
        id: m.id, title: m.title, original_title: m.original_title,
        year: m.year, poster: m.poster, poster_url: m.poster_url,
        tags, festival_awards,
        score: tagScore + festivalScore,
      }
    })

    return shuffleByScore(scored)
  } catch {
    const fallback = localFallback(tagNames)
    const scored = fallback.map((m) => ({
      ...m,
      score: m.tags.filter((t) => tagNames.includes(t.name)).reduce((s, t) => s + t.weight, 0),
      festival_awards: [] as FestivalAward[],
    }))
    return shuffleByScore(scored)
  }
}

export function posterUrl(movie: Pick<Movie, 'poster' | 'poster_url'>): string {
  if (movie.poster_url) return movie.poster_url
  if (!movie.poster) return 'img/poster1.jpg'
  if (movie.poster.startsWith('img/')) return movie.poster
  return `${DIRECTUS_URL}/assets/${movie.poster}?width=320&quality=80&format=webp`
}
