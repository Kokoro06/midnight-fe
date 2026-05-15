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
  overview: string | null
  justwatch_url: string | null
  tmdb_id: number | null
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
  overview: string | null
  justwatch_url: string | null
  tmdb_id: number | null
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
      overview: null,
      justwatch_url: null,
      tmdb_id: null,
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
          'overview', 'justwatch_url', 'tmdb_id',
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
      overview: m.overview ?? null,
      justwatch_url: m.justwatch_url ?? null,
      tmdb_id: m.tmdb_id ?? null,
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

// Efraimidis–Spirakis 加權隨機排序：每項以 log(U)/w 為 key，DESC 排序 → 大 weight 越往前。
// w 必須 > 0；≤ 0 落 fallback 0.01 避免 NaN。對全池做一次即得加權隨機排列，slice 即為 weighted sample
function weightedShuffle<T>(items: T[], weightOf: (t: T) => number): T[] {
  return items
    .map((item) => {
      const w = Math.max(0.01, weightOf(item))
      return { item, key: Math.log(Math.random()) / w }
    })
    .sort((a, b) => b.key - a.key)
    .map((x) => x.item)
}

// 3 得獎 + 2 非得獎，不足時互補。
// 設計權衡：
//   - 先取 top 50（按 sampleWeight）→ 過濾掉低 tag-match 的雜訊，保留品質
//   - 池內 weighted sampling（非均勻 shuffle）→ weight 高的更常被抽中
//   - 最終位置也 weighted shuffle → weight 高的更易在 position 0（QR 主推薦）
//   - seenFactor 把最近看過的乘以 0.2-1.0，7 天後恢復
function mixedSelect(scored: MovieWithScore[], awardCount = 3, plainCount = 2): MovieWithScore[] {
  const seen = loadSeen()
  const now = Date.now()
  // 抽樣權重：score × movie.weight × seenFactor
  const sampleWeight = (m: MovieWithScore) => {
    const penalty = seenPenalty(seen.get(m.id), now) // 0–3
    const seenFactor = Math.max(0.2, 1 - penalty / 3) // 0.2–1.0
    return m.score * m.weight * seenFactor
  }
  const byWeightDesc = (a: MovieWithScore, b: MovieWithScore) => sampleWeight(b) - sampleWeight(a)

  const hasWon = (m: MovieWithScore) => m.festival_awards.some((a) => a.result === 'won')
  // Top 50 by sampleWeight，再在池內 weighted shuffle 取 N
  const awardPool = [...scored.filter(hasWon)].sort(byWeightDesc).slice(0, 50)
  const plainPool = [...scored.filter((m) => !hasWon(m))].sort(byWeightDesc).slice(0, 50)

  let award = weightedShuffle(awardPool, sampleWeight).slice(0, awardCount)
  let plain = weightedShuffle(plainPool, sampleWeight).slice(0, plainCount)

  // 不足時從另一桶補齊（不限 top 50，因為原池不夠）
  const total = awardCount + plainCount
  if (award.length + plain.length < total) {
    const picked = new Set([...award, ...plain])
    const fallback = weightedShuffle(
      [...scored].filter((m) => !picked.has(m)),
      sampleWeight,
    )
    const need = total - award.length - plain.length
    if (award.length < awardCount) award = [...award, ...fallback.slice(0, need)]
    else plain = [...plain, ...fallback.slice(0, need)]
  }

  // 最終排序也用 weighted shuffle，讓高 weight 更容易進 position 0（QuizResult 主推薦）
  return weightedShuffle([...award, ...plain], sampleWeight)
}

export async function getMoviesByMultipleTags(tagNames: string[]): Promise<MovieWithScore[]> {
  if (tagNames.length === 0) return []

  try {
    const result = (await directus.request(
      readItems('movies', {
        filter: { tags: { tags_id: { name: { _in: tagNames } } } },
        fields: ['id', 'title', 'original_title', 'year', 'poster', 'poster_url', 'weight',
          'overview', 'justwatch_url', 'tmdb_id',
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
        overview: m.overview ?? null,
        justwatch_url: m.justwatch_url ?? null,
        tmdb_id: m.tmdb_id ?? null,
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
