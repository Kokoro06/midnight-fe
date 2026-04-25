import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import GrainCanvas from '../components/GrainCanvas'
import './Home.css'

interface Film {
  title: string
  poster: string
}

interface FavoritesCardProps {
  films: Film[]
  posterId: string
  onMore: () => void
}

const MOOD_TAGS: string[] = [
  '愛情', '快樂', '平靜', '療癒', '溫馨', '驚悚', '懸疑', '喜劇',
  '科幻', '動作', 'LGBTQ', '犯罪', '諷刺', '文藝', '憂鬱', '燒腦',
  '寂寞', '奇幻', '末日', '戰爭', '浪漫', '無聊', '放鬆', '青春',
  '劇情', '公路電影', '紀錄片', '邪典',
]

const FESTIVAL_FILMS: Film[] = [
  { title: '《末路相縫》 Sew Torn', poster: 'img/poster5.jpg' },
  { title: '《太空百合戰鬥姬》 Lesbian Space Princess', poster: 'img/poster8.jpg' },
  { title: '《錄影帶謀殺案》 Videodrome', poster: 'img/poster7.jpg' },
  { title: '《輕鬆生活》 Easy Living', poster: 'img/poster6.jpg' },
]

const YEARLY_FILMS: Film[] = [
  { title: '《青春末世物語》 Happyend', poster: 'img/poster1.jpg' },
  { title: '《一百公尺》 100 Meters', poster: 'img/poster2.jpg' },
  { title: '《長椅小情歌》 At the Bench', poster: 'img/poster4.jpg' },
  { title: '《我家的事》 Family Matters', poster: 'img/poster3.jpg' },
]

function FavoritesCard({ films, posterId, onMore }: FavoritesCardProps) {
  const posterRef = useRef<HTMLDivElement>(null)

  const handleEnter = (poster: string) => {
    const el = posterRef.current
    if (!el) return
    el.style.backgroundImage = `url(${poster})`
    el.classList.add('has-image')
  }

  const handleLeave = () => {
    const el = posterRef.current
    if (!el) return
    el.classList.remove('has-image')
    el.style.backgroundImage = ''
  }

  return (
    <div className="favorites-card">
      <div className="fav-smoke" />
      <GrainCanvas className="fav-grain" />
      <div className="favorites-list">
        <ul onMouseLeave={handleLeave}>
          {films.map((f) => (
            <li
              key={f.title}
              data-poster={f.poster}
              onMouseEnter={() => handleEnter(f.poster)}
            >
              {f.title}
            </li>
          ))}
        </ul>
        <div className="more-btn-wrap">
          <button className="more-btn" onClick={onMore}>
            <div className="btn-marquee">
              <span>MORE</span>
              <span className="arrow">→</span>
              <span>MORE</span>
            </div>
          </button>
        </div>
      </div>
      <div className="favorites-poster-float" id={posterId} ref={posterRef} />
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const [mood, setMood] = useState<string>('')
  const hoverZoneRef = useRef<HTMLDivElement>(null)
  const scrollCursorRef = useRef<HTMLDivElement>(null)

  const goResult = () => {
    const trimmed = mood.trim()
    if (!trimmed) return
    navigate(`/effect?mood=${encodeURIComponent(trimmed)}`)
  }

  useEffect(() => {
    const favSubs = document.querySelectorAll('.favorites-sub')
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        e.target.classList.toggle('is-visible', e.isIntersecting)
      })
    }, { threshold: 0.4 })
    favSubs.forEach((el) => obs.observe(el))

    const years = document.querySelectorAll('.favorites-year')
    const yearObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        e.target.classList.toggle('animate-in', e.isIntersecting)
      })
    }, { threshold: 0.5 })
    years.forEach((el) => yearObs.observe(el))

    const cards = document.querySelectorAll('.favorites-card')
    const cardObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        e.target.classList.toggle('animate-in', e.isIntersecting)
      })
    }, { threshold: 0.45 })
    cards.forEach((el) => cardObs.observe(el))

    const typingEls = document.querySelectorAll('.favorites-sub .typing-text')
    function typeText(el: Element) {
      const fullText = el.getAttribute('data-text') ?? ''
      let index = 0
      el.textContent = ''
      el.classList.remove('done')
      const timer = setInterval(() => {
        if (index < fullText.length) {
          el.textContent += fullText.charAt(index)
          index++
        } else {
          clearInterval(timer)
          el.classList.add('done')
        }
      }, 80)
    }
    const typingObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const span = entry.target.querySelector('.typing-text')
        if (!span) return
        if (entry.isIntersecting) {
          typeText(span)
        } else {
          span.textContent = ''
          span.classList.remove('done')
        }
      })
    }, { threshold: 0.4 })
    typingEls.forEach((span) => {
      const parent = span.closest('.favorites-sub')
      if (parent) typingObs.observe(parent)
    })

    const revealSections = document.querySelectorAll('.favorites')
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('section-visible')
          revealObserver.unobserve(entry.target)
        }
      })
    }, { threshold: 0.25 })
    revealSections.forEach((section) => revealObserver.observe(section))

    return () => {
      obs.disconnect()
      yearObs.disconnect()
      cardObs.disconnect()
      typingObs.disconnect()
      revealObserver.disconnect()
    }
  }, [])

  useEffect(() => {
    const hoverZone = hoverZoneRef.current
    const scrollCursor = scrollCursorRef.current
    if (!hoverZone || !scrollCursor) return

    const onMove = (e: MouseEvent) => {
      scrollCursor.style.left = e.clientX + 'px'
      scrollCursor.style.top = e.clientY + 'px'
    }
    const onEnter = () => scrollCursor.classList.add('is-active')
    const onLeave = () => scrollCursor.classList.remove('is-active')
    const onClick = () => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })

    hoverZone.addEventListener('mousemove', onMove)
    hoverZone.addEventListener('mouseenter', onEnter)
    hoverZone.addEventListener('mouseleave', onLeave)
    hoverZone.addEventListener('click', onClick)

    return () => {
      hoverZone.removeEventListener('mousemove', onMove)
      hoverZone.removeEventListener('mouseenter', onEnter)
      hoverZone.removeEventListener('mouseleave', onLeave)
      hoverZone.removeEventListener('click', onClick)
    }
  }, [])

  const addTag = (tag: string) => {
    setMood((prev) => prev ? prev + ' ' + tag : tag)
  }

  return (
    <>
      <div className="intro-logo-overlay">
        <img src="img/mm-logo-w.svg" alt="Midnight Moodvie" />
      </div>

      <div className="hero">
        <video className="hero-bg" src="2.1.mp4" autoPlay muted loop playsInline />
        <div className="hero-overlay" />

        <header className="top-nav">
          <Link to="/" className="logo">
            <img src="img/mm-logo-w.svg" alt="FEEL REEL" />
          </Link>
          <nav className="top-links">
            <Link to="/festival">影展資訊</Link>
            <Link to="/month">月份推薦</Link>
          </nav>
        </header>

        <main className="mood-search">
          <h1 className="site-title">
            <img src="img/mm-logo-w.svg" alt="FEEL REEL" />
          </h1>

          <div className="search-bar">
            <div className="search-input-wrap">
              <input
                id="mood-input"
                type="text"
                placeholder="今天的心情如何？"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && goResult()}
              />
              <button className="clear-btn" onClick={() => setMood('')}>✕</button>
            </div>
            <button id="search-btn" onClick={goResult}>送出</button>
          </div>

          <div className="mood-tags">
            {MOOD_TAGS.map((tag) => (
              <button key={tag} className="tag" onClick={() => addTag(tag)}>{tag}</button>
            ))}
          </div>
        </main>

        <div className="scroll-hover-zone" ref={hoverZoneRef} />
      </div>

      <section id="festival" className="block favorites favorites-festival">
        <div className="favorites-inner">
          <div className="favorites-text">
            <p className="favorites-year">2025</p>
            <h2 className="favorites-title">
              <span className="title-dot">影展推薦</span>
            </h2>
            <p className="favorites-sub">
              <span className="typing-text" data-text="FAVORITES 4" />
            </p>
          </div>
          <FavoritesCard
            films={FESTIVAL_FILMS}
            posterId="festival-poster"
            onMore={() => navigate('/festival')}
          />
        </div>
      </section>

      <section id="yearly" className="block favorites favorites-yearly">
        <div className="favorites-inner">
          <div className="favorites-text">
            <p className="favorites-year">2025</p>
            <h2 className="favorites-title">
              <span className="title-dot">年度推薦</span>
            </h2>
            <p className="favorites-sub">
              <span className="typing-text" data-text="FAVORITES 4" />
            </p>
          </div>
          <FavoritesCard
            films={YEARLY_FILMS}
            posterId="yearly-poster"
            onMore={() => navigate('/month')}
          />
        </div>
      </section>

      <div className="scroll-cursor" ref={scrollCursorRef}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <polyline points="19 12 12 19 5 12" />
        </svg>
      </div>
    </>
  )
}
