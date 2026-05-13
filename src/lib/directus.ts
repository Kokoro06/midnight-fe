import { createDirectus, rest, readItems } from '@directus/sdk'
import { movieDB } from '../data/movieDB'
import { loadSeen, markSeen, seenPenalty } from './seen'

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
  weight: number
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
  weight: number | null
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
      weight: 1.0,
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
        fields: ['id', 'title', 'original_title', 'year', 'poster', 'poster_url', 'weight',
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
      weight: m.weight ?? 1.0,
      tags: m.tags.map((t) => ({ ...t.tags_id, weight: t.weight ?? 1.0 })),
      festival_awards: m.festival_awards ?? [],
    }))

    if (movies.length > 0) {
      // 與 Result 共用 seen 記憶：最近看過的排後面，其餘隨機 × movie weight
      const seen = loadSeen()
      const now = Date.now()
      const sorted = movies
        .map((m) => ({ m, key: -seenPenalty(seen.get(m.id), now) + Math.random() * m.weight }))
        .sort((a, b) => b.key - a.key)
        .map((x) => x.m)
      markSeen(sorted.slice(0, 5).map((m) => m.id))
      return sorted
    }
  } catch {
    // Directus 不可用，使用本地資料
  }

  return localFallback(tagNames)
}

export type MovieWithScore = Movie & { score: number }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickFromPool<T>(sorted: T[], poolSize: number, count: number): T[] {
  return shuffle(sorted.slice(0, Math.min(poolSize, sorted.length))).slice(0, count)
}

// 3 得獎 + 2 非得獎，不足時互補
// score 乘 movie weight（admin 可調，預設 1.0）；jitter 0–1.0 打破同分；近期看過扣 penalty 最高 3.0、7 天後恢復
function mixedSelect(scored: MovieWithScore[], awardCount = 3, plainCount = 2): MovieWithScore[] {
  const seen = loadSeen()
  const now = Date.now()
  const sortKey = new Map<MovieWithScore, number>()
  for (const m of scored) {
    const penalty = seenPenalty(seen.get(m.id), now)
    sortKey.set(m, m.score * m.weight + Math.random() * 1.0 - penalty)
  }

  const hasWon = (m: MovieWithScore) => m.festival_awards.some((a) => a.result === 'won')
  const byTagScore = (a: MovieWithScore, b: MovieWithScore) => sortKey.get(b)! - sortKey.get(a)!

  const awardPool = [...scored.filter(hasWon)].sort(byTagScore)
  const plainPool = [...scored.filter((m) => !hasWon(m))].sort(byTagScore)

  let award = pickFromPool(awardPool, 50, awardCount)
  let plain = pickFromPool(plainPool, 50, plainCount)

  // 不足時從另一桶補齊
  const total = awardCount + plainCount
  if (award.length + plain.length < total) {
    const picked = new Set([...award, ...plain])
    const fallback = shuffle([...awardPool, ...plainPool].filter((m) => !picked.has(m)))
    const need = total - award.length - plain.length
    if (award.length < awardCount) award = [...award, ...fallback.slice(0, need)]
    else plain = [...plain, ...fallback.slice(0, need)]
  }

  return shuffle([...award, ...plain])
}

export async function getMoviesByMultipleTags(tagNames: string[]): Promise<MovieWithScore[]> {
  if (tagNames.length === 0) return []

  try {
    const result = (await directus.request(
      readItems('movies', {
        filter: { tags: { tags_id: { name: { _in: tagNames } } } },
        fields: ['id', 'title', 'original_title', 'year', 'poster', 'poster_url', 'weight',
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
      return {
        id: m.id, title: m.title, original_title: m.original_title,
        year: m.year, poster: m.poster, poster_url: m.poster_url,
        weight: m.weight ?? 1.0,
        tags, festival_awards,
        score: tagScore,
      }
    })

    const picks = mixedSelect(scored)
    markSeen(picks.map((m) => m.id))
    return picks
  } catch {
    const fallback = localFallback(tagNames)
    const scored = fallback.map((m) => ({
      ...m,
      score: m.tags.filter((t) => tagNames.includes(t.name)).reduce((s, t) => s + t.weight, 0),
      festival_awards: [] as FestivalAward[],
    }))
    const picks = mixedSelect(scored)
    markSeen(picks.map((m) => m.id))
    return picks
  }
}

export function posterUrl(movie: Pick<Movie, 'poster' | 'poster_url'>): string {
  if (movie.poster_url) return movie.poster_url
  if (!movie.poster) return 'img/poster1.jpg'
  if (movie.poster.startsWith('img/')) return movie.poster
  return `${DIRECTUS_URL}/assets/${movie.poster}?width=320&quality=80&format=webp`
}
