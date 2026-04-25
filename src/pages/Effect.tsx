import { useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { movieDB, Movie } from '../data/movieDB'
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
            src={movie.img}
            alt={movie.title}
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x450/111/444?text=Movie+Visual' }}
          />
        </div>
        <div className="info-wrap">
          <span className="movie-num">0{index + 1}</span>
          <h2 className="movie-name">{movie.title}</h2>
          <p className="movie-tags">{movie.tags.join(' / ')}</p>
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

  const filtered = movieDB.filter((movie) =>
    keywords.length === 0 || keywords.some((key) => movie.tags.includes(key))
  )

  return (
    <div className="effect-page">
      <button className="back-home" onClick={() => navigate('/')}>
        <div className="btn-marquee">
          <span>BACK TO HOME</span>
          <span className="arrow">→</span>
          <span>BACK TO HOME</span>
        </div>
      </button>

      <section className="header-section">
        <h1 className="main-title">
          <span className="search-term">{userMood ? `#${userMood}` : '#RECOM'}</span>
          <div className="cinematic-title">
            <span className="text-line focus-1">關盞燈，</span>
            <span className="text-line focus-2">開始看電影。</span>
          </div>
        </h1>
      </section>

      <div className="project-list">
        {filtered.map((movie, i) => (
          <MovieItem key={movie.title + i} movie={movie} index={i} />
        ))}
      </div>
    </div>
  )
}
