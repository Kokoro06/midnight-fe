import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import TopNav from '../components/TopNav'
import { getMoviesByTags, posterUrl, type Movie } from '../lib/directus'
import './Effect.css'

interface MovieItemProps {
  movie: Movie
  index: number
}

function MovieItem({ movie, index }: MovieItemProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) el.classList.add('visible')
    }, { threshold: 0.2 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div className="movie-item" ref={ref}>
      <div className="movie-content">
        <div className="img-wrap">
          <img
            src={posterUrl(movie.poster)}
            alt={movie.title}
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x450/111/444?text=Movie+Visual' }}
          />
        </div>
        <div className="info-wrap">
          <span className="movie-num">0{index + 1}</span>
          <h2 className="movie-name">{movie.title}</h2>
          <p className="movie-tags">{movie.tags.map(t => t.name).join(' / ')}</p>
        </div>
      </div>
    </div>
  )
}

export default function Effect() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const userMood = params.get('mood') ?? ''
  const keywords = userMood.split(/\s+/).filter((k) => k.length > 0)

  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    document.title = '為你推薦 | Midnight Moodvie'
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    getMoviesByTags(keywords)
      .then((result) => {
        if (cancelled) return
        setMovies(result)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setError(true)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [userMood, reloadKey])

  const contextLine = !loading && !error && movies.length > 0 && keywords.length > 0
    ? `為你選了 ${movies.length} 部 ${keywords.map(k => `#${k}`).join(' ')} 的電影`
    : ''

  return (
    <div className="effect-page">
      <TopNav />

      <section className="header-section">
        <h1 className="main-title">
          <span className="search-term">{userMood ? `#${userMood}` : '#RECOM'}</span>
          <div className="cinematic-title">
            <span className="text-line focus-1">關盞燈，</span>
            <span className="text-line focus-2">開始看電影。</span>
          </div>
          {contextLine && <span className="context-line">{contextLine}</span>}
        </h1>
      </section>

      <div className="project-list">
        {loading && <div className="effect-loading">尋找今晚的電影⋯</div>}
        {!loading && error && (
          <div className="effect-empty">
            <p>無法連線，請稍後再試</p>
            <button className="effect-retry-btn" onClick={() => setReloadKey(k => k + 1)}>重試</button>
          </div>
        )}
        {!loading && !error && movies.length === 0 && keywords.length > 0 && (
          <div className="effect-empty">
            <p>找不到符合 {keywords.map(k => `#${k}`).join(' ')} 的電影</p>
            <button className="effect-retry-btn" onClick={() => navigate('/')}>換個關鍵字</button>
          </div>
        )}
        {!loading && !error && movies.map((movie, i) => (
          <MovieItem key={movie.id} movie={movie} index={i} />
        ))}
      </div>
    </div>
  )
}
