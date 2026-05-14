import { describe, it, expect } from 'vitest'
import { posterUrl } from '../directus'

describe('posterUrl()', () => {
  it('poster_url 有值 → 直接回傳該 URL', () => {
    const movie = {
      poster: 'some-uuid',
      poster_url: 'https://image.tmdb.org/t/p/w500/abc.jpg',
    }
    expect(posterUrl(movie)).toBe('https://image.tmdb.org/t/p/w500/abc.jpg')
  })

  it('poster_url 有值（即使 poster 為 null）→ 仍回傳 poster_url', () => {
    const movie = {
      poster: null,
      poster_url: 'https://image.tmdb.org/t/p/w500/xyz.jpg',
    }
    expect(posterUrl(movie)).toBe('https://image.tmdb.org/t/p/w500/xyz.jpg')
  })

  it('poster_url = null、poster = "img/xxx.jpg" → 回傳該本地路徑（localFallback）', () => {
    const movie = {
      poster: 'img/poster3.jpg',
      poster_url: null,
    }
    expect(posterUrl(movie)).toBe('img/poster3.jpg')
  })

  it('poster_url = null、poster 是 UUID → 回傳 /assets/${uuid} 的 Directus URL（含 transform 參數）', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000'
    const movie = {
      poster: uuid,
      poster_url: null,
    }
    const url = posterUrl(movie)
    expect(url).toContain(`/assets/${uuid}`)
    expect(url).toContain('width=320')
    expect(url).toContain('quality=80')
    expect(url).toContain('format=webp')
  })

  it('poster_url 與 poster 都 null → 回傳 "img/poster1.jpg"（hard-coded 預設）', () => {
    const movie = {
      poster: null,
      poster_url: null,
    }
    expect(posterUrl(movie)).toBe('img/poster1.jpg')
  })
})
