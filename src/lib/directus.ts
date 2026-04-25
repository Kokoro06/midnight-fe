import { createDirectus, rest, readItems } from '@directus/sdk'

const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL ?? 'http://localhost:8055'

export const directus = createDirectus(DIRECTUS_URL).with(rest())

export interface Tag {
  id: string
  name: string
  category: string
}

export interface Movie {
  id: string
  title: string
  original_title: string
  year: number
  poster: string | null
  tags: Tag[]
}

type DirectusMovie = {
  id: string
  title: string
  original_title: string
  year: number
  poster: string | null
  tags: Array<{ tags_id: Tag }>
}

export async function getMoviesByTags(tagNames: string[]): Promise<Movie[]> {
  const result = (await directus.request(
    readItems('movies', {
      filter: { tags: { tags_id: { name: { _in: tagNames } } } },
      fields: ['id', 'title', 'original_title', 'year', 'poster',
        'tags.tags_id.id', 'tags.tags_id.name', 'tags.tags_id.category'],
      limit: 50,
    })
  )) as DirectusMovie[]

  const movies: Movie[] = result.map((m) => ({
    id: m.id,
    title: m.title,
    original_title: m.original_title,
    year: m.year,
    poster: m.poster,
    tags: m.tags.map((t) => t.tags_id),
  }))

  // 隨機排序，每次推薦不同的電影
  return movies.sort(() => Math.random() - 0.5)
}

export function posterUrl(uuid: string | null): string {
  if (!uuid) return 'img/poster1.jpg'
  return `${DIRECTUS_URL}/assets/${uuid}?width=320&quality=80&format=webp`
}
