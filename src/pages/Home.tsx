import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useGSAP } from '@gsap/react'
import { useLenis } from 'lenis/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import GrainCanvas from '../components/GrainCanvas'
import TopNav from '../components/TopNav'
import './Home.css'

gsap.registerPlugin(useGSAP, ScrollTrigger)

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
          <button className="btn-slot" onClick={onMore}>
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
  const [searchParams] = useSearchParams()
  const [mood, setMood] = useState<string>(() => searchParams.get('tag') ?? '')
  const [showOverlay, setShowOverlay] = useState<boolean>(true)
  const hoverZoneRef = useRef<HTMLDivElement>(null)
  const scrollCursorRef = useRef<HTMLDivElement>(null)
  const lenis = useLenis()

  useEffect(() => {
    document.title = 'Midnight Moodvie — 今晚想看什麼？'
    const t = setTimeout(() => setShowOverlay(false), 1700)
    return () => clearTimeout(t)
  }, [])

  // ── GSAP scroll animations ──────────────────────────────────────────────
  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // 每個 favorites section 整體淡入 + 上移
    gsap.utils.toArray<HTMLElement>('.favorites').forEach((section) => {
      gsap.from(section, {
        opacity: 0,
        y: 60,
        duration: 0.9,
        ease: 'power2.out',
        scrollTrigger: { trigger: section, start: 'top 85%' },
      })
    })

    // year 數字浮現
    gsap.utils.toArray<HTMLElement>('.favorites-year').forEach((el) => {
      gsap.from(el, {
        opacity: 0,
        y: 26,
        duration: 1.2,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 85%' },
      })
    })

    // 卡片延遲淡入
    gsap.utils.toArray<HTMLElement>('.favorites-card').forEach((card) => {
      gsap.from(card, {
        opacity: 0,
        y: 24,
        duration: 0.9,
        ease: 'power2.out',
        delay: 0.3,
        scrollTrigger: { trigger: card, start: 'top 82%' },
      })
    })

    // typing text — GSAP counter 取代 setInterval
    gsap.utils.toArray<HTMLElement>('.favorites-sub').forEach((sub) => {
      const span = sub.querySelector<HTMLElement>('.typing-text')
      if (!span) return
      const fullText = span.getAttribute('data-text') ?? ''
      let tween: gsap.core.Tween | null = null

      ScrollTrigger.create({
        trigger: sub,
        start: 'top 85%',
        once: true,
        onEnter() {
          tween?.kill()
          span.textContent = ''
          const obj = { n: 0 }
          tween = gsap.to(obj, {
            n: fullText.length,
            duration: fullText.length * 0.08,
            ease: 'none',
            onUpdate() { span.textContent = fullText.slice(0, Math.round(obj.n)) },
          })
        },
      })
    })
  })

  // ── Scroll cursor ───────────────────────────────────────────────────────
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
    const onClick = () => {
      if (lenis) {
        lenis.scrollTo(window.innerHeight, { duration: 1.2 })
      } else {
        window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })
      }
    }

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
  }, [lenis])

  const addTag = (tag: string) => {
    setMood((prev) => prev ? prev + ' ' + tag : tag)
  }

  const goResult = () => {
    const trimmed = mood.trim()
    if (!trimmed) return
    navigate(`/recommend?mood=${encodeURIComponent(trimmed)}`)
  }

  return (
    <>
      {showOverlay && (
        <div className="intro-logo-overlay">
          <img src="/img/mm-logo-w.svg" alt="Midnight Moodvie" />
        </div>
      )}

      <TopNav hideUntilMs={1700} />

      <div className="hero">
        <video className="hero-bg" src="2.1.mp4" autoPlay muted loop playsInline />
        <div className="hero-overlay" />

        <main className="mood-search">
          <h1 className="site-title">
            <img src="/img/mm-logo-w.svg" alt="FEEL REEL" />
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
              <button className="clear-btn" aria-label="清除輸入" onClick={() => setMood('')}>✕</button>
            </div>
            <button id="search-btn" onClick={goResult}>送出</button>
          </div>
          <p className="search-hint">輸入心情關鍵字或點選下方標籤，快速找到今晚的電影</p>

          <div className="mood-tags">
            {MOOD_TAGS.map((tag, i) => (
              <button
                key={tag}
                className="tag"
                style={{ animationDelay: `${i * 0.1}s` }}
                onClick={() => addTag(tag)}
              >{tag}</button>
            ))}
          </div>
        </main>

        <div
          className="scroll-hover-zone"
          ref={hoverZoneRef}
          role="button"
          tabIndex={0}
          aria-label="向下捲動"
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lenis ? lenis.scrollTo(window.innerHeight, { duration: 1.2 }) : window.scrollTo({ top: window.innerHeight, behavior: 'smooth' }) } }}
        />
      </div>

      <section id="festival" className="block favorites favorites-festival">
        <div className="favorites-inner">
          <div className="favorites-text">
            <p className="favorites-year">2025</p>
            <h2 className="favorites-title">
              <span className="title-dot">影展推薦</span>
            </h2>
            <p className="favorites-sub">
              <span className="typing-text" data-text="FESTIVAL PICKS">FESTIVAL PICKS</span>
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
              <span className="typing-text" data-text="BEST OF 2025">BEST OF 2025</span>
            </p>
          </div>
          <FavoritesCard
            films={YEARLY_FILMS}
            posterId="yearly-poster"
            onMore={() => navigate('/month')}
          />
        </div>
      </section>

      <div className="scroll-cursor" ref={scrollCursorRef} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <polyline points="19 12 12 19 5 12" />
        </svg>
      </div>
    </>
  )
}
