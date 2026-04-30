import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useGSAP } from '@gsap/react'
import { useLenis } from 'lenis/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import GrainCanvas from '../components/GrainCanvas'
import GravityTags from '../components/GravityTags'
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
  '想談戀愛', '靜靜看就好', '需要被療癒', '暖暖的就好', '驚悚', '懸疑', '喜劇',
  '科幻', '動作', '酷兒', '犯罪', '這世界很荒謬', '文藝', '好想哭', '越燒越好',
  '有點寂寞', '奇幻', '世界毀了也無所謂', '戰爭', '心動的感覺', '躺著看就好', '想念那時候',
  '劇情', '公路電影', '紀錄片', '想看點怪的',
]

const MOOD_TAG_MAP: Record<string, string[]> = {
  '想談戀愛':       ['愛情', '浪漫'],
  '靜靜看就好':     ['放鬆', '平靜'],
  '需要被療癒':     ['療癒', '溫馨'],
  '暖暖的就好':     ['溫馨', '放鬆'],
  '驚悚':           ['驚悚'],
  '懸疑':           ['懸疑', '燒腦'],
  '喜劇':           ['喜劇', '放鬆'],
  '科幻':           ['科幻'],
  '動作':           ['動作'],
  '酷兒':           ['LGBTQ'],
  '犯罪':           ['犯罪'],
  '這世界很荒謬':   ['諷刺', '喜劇'],
  '文藝':           ['文藝', '劇情'],
  '好想哭':         ['憂鬱', '劇情'],
  '越燒越好':       ['燒腦', '懸疑'],
  '有點寂寞':       ['寂寞'],
  '奇幻':           ['奇幻'],
  '世界毀了也無所謂': ['末日', '科幻'],
  '戰爭':           ['戰爭'],
  '心動的感覺':     ['浪漫', '愛情'],
  '躺著看就好':     ['放鬆', '療癒'],
  '想念那時候':     ['寂寞', '憂鬱'],
  '劇情':           ['劇情'],
  '公路電影':       ['公路電影'],
  '紀錄片':         ['紀錄片'],
  '想看點怪的':     ['邪典', '驚悚'],
}

// 反向對應：Directus tag → 找出最能代表它的 MOOD_TAGS
function mapToMoodTags(directusTags: string[]): string[] {
  const scores: Record<string, number> = {}
  for (const dt of directusTags) {
    for (const [moodTag, dts] of Object.entries(MOOD_TAG_MAP)) {
      if (dts.includes(dt)) scores[moodTag] = (scores[moodTag] ?? 0) + 1
    }
  }
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag]) => tag)
}

const MOOD_MAPPER_URL = import.meta.env.VITE_MOOD_MAPPER_URL ?? 'http://localhost:3001'

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

function PosterShowcase({ films, variant }: { films: Film[]; variant: 'festival' | 'yearly' }) {
  return (
    <div className={`poster-showcase poster-showcase--${variant}`}>
      <div className="fav-smoke" />
      <GrainCanvas className="fav-grain" />
      <div className="festival-posters">
        {films.map((f, i) => (
          <div key={f.title} className={`fp-item fp-item--${i}`}>
            <div className="fp-img" style={{ backgroundImage: `url(${f.poster})` }} />
            <p className="fp-title">{f.title}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

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
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>(MOOD_TAGS)
  const [tagsFromDirectus, setTagsFromDirectus] = useState(false)
  const [mappingLoading, setMappingLoading] = useState(false)
  const [mappingError, setMappingError] = useState<string | null>(null)
  const [pendingMood, setPendingMood] = useState<string>('')
  const [pendingDirectusTags, setPendingDirectusTags] = useState<string[]>([])
  const [reducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [showOverlay, setShowOverlay] = useState<boolean>(true)
  const scrollHintRef = useRef<HTMLDivElement>(null)
  const lenis = useLenis()

  useLenis(({ scroll }) => {
    const hint = scrollHintRef.current
    if (!hint) return
    if (scroll > 80) hint.classList.add('is-hidden')
    else hint.classList.remove('is-hidden')
  })

  useEffect(() => {
    document.title = 'Midnight Moodvie — 今晚想看什麼？'
    const t = setTimeout(() => setShowOverlay(false), 1700)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const directusUrl = import.meta.env.VITE_DIRECTUS_URL ?? 'http://localhost:8055'
    fetch(`${directusUrl}/items/tags?limit=-1&fields=name&sort=name`)
      .then(r => r.json())
      .then(({ data }) => {
        const names: string[] = (data ?? []).map((t: { name: string }) => t.name).filter(Boolean)
        if (names.length > 0) {
          setAvailableTags(names)
          setTagsFromDirectus(true)
        }
      })
      .catch(() => {}) // Directus 不可用時保留 MOOD_TAGS fallback
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
    gsap.utils.toArray<HTMLElement>('.poster-showcase').forEach((card) => {
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


  const addTag = (tag: string) => {
    // 使用者手動點選 → 清除 mood-mapper 的暫存結果
    setPendingDirectusTags([])
    setPendingMood('')
    setMappingError(null)
    setSelectedTags((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag)
      if (prev.length >= 3) return prev
      return [...prev, tag]
    })
  }

  const goResult = async () => {
    const trimmed = mood.trim()
    if (!trimmed || mappingLoading) return
    setMappingLoading(true)
    setMappingError(null)
    try {
      const res = await fetch(MOOD_MAPPER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood: trimmed }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? '分析失敗')
      }
      const { tags } = await res.json()
      if (!Array.isArray(tags) || tags.length === 0) throw new Error('無法識別心情標籤')
      setPendingDirectusTags(tags)
      setPendingMood(trimmed)
      // 若 UI 顯示 Directus tags，直接高亮；否則反向 mapping 回 MOOD_TAGS
      if (tagsFromDirectus) {
        setSelectedTags(tags.filter((t: string) => availableTags.includes(t)).slice(0, 3))
      } else {
        setSelectedTags(mapToMoodTags(tags))
      }
    } catch {
      setMappingError('無法分析心情，請試試直接選 tag')
    } finally {
      setMappingLoading(false)
    }
  }

  const goTagResult = () => {
    let directusTags: string[]
    let moodParam = ''

    if (pendingDirectusTags.length > 0) {
      directusTags = pendingDirectusTags
      moodParam = `&mood=${encodeURIComponent(pendingMood)}`
    } else if (tagsFromDirectus) {
      directusTags = selectedTags
    } else {
      directusTags = [...new Set(selectedTags.flatMap((t) => MOOD_TAG_MAP[t] ?? []))]
    }

    if (directusTags.length === 0) return
    navigate(`/result?tags=${directusTags.map(encodeURIComponent).join(',')}${moodParam}`)
  }

  const MARQUEE_TEXT = '今晚的你適合看什麼電影？　·　今晚的你適合看什麼電影？　·　今晚的你適合看什麼電影？　·　今晚的你適合看什麼電影？　·　今晚的你適合看什麼電影？　·　'

  return (
    <>
      <div className="marquee-bar" aria-hidden="true">
        <div className="marquee-track">
          <span>{MARQUEE_TEXT}</span>
          <span>{MARQUEE_TEXT}</span>
        </div>
      </div>

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
              {selectedTags.map((tag) => (
                <button key={tag} className="input-tag-pill" onClick={() => addTag(tag)}>
                  {tag} <span aria-hidden="true">×</span>
                </button>
              ))}
              <input
                id="mood-input"
                type="text"
                placeholder={selectedTags.length > 0 ? '' : '今天的心情如何？'}
                value={mood}
                onChange={(e) => { setMood(e.target.value); setMappingError(null) }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') selectedTags.length > 0 ? goTagResult() : goResult()
                }}
                disabled={mappingLoading}
              />
              <button
                className="clear-btn"
                aria-label="清除輸入"
                onClick={() => {
                  setMood('')
                  setMappingError(null)
                  setSelectedTags([])
                  setPendingDirectusTags([])
                  setPendingMood('')
                }}
              >✕</button>
            </div>
            <button
              id="search-btn"
              onClick={selectedTags.length > 0 ? goTagResult : goResult}
              disabled={mappingLoading || (selectedTags.length === 0 && !mood.trim())}
              className={[mappingLoading ? 'is-loading' : '', selectedTags.length > 0 ? 'is-tag-mode' : ''].filter(Boolean).join(' ')}
            >
              {mappingLoading ? <span className="btn-spinner" aria-hidden="true" /> : selectedTags.length > 0 ? '看電影推薦 →' : '送出'}
            </button>
          </div>
          {mappingError && <p className="mood-error">{mappingError}</p>}
          {!mappingError && <p className="search-hint">輸入心情關鍵字或點選下方標籤，快速找到今晚的電影</p>}

          {reducedMotion ? (
            <div className="mood-tags">
              {availableTags.map((tag, i) => (
                <button
                  key={tag}
                  className={`tag${selectedTags.includes(tag) ? ' tag--selected' : ''}${selectedTags.length >= 3 && !selectedTags.includes(tag) ? ' tag--dimmed' : ''}`}
                  style={{ animationDelay: `${i * 0.1}s` }}
                  onClick={() => addTag(tag)}
                >{tag}</button>
              ))}
            </div>
          ) : (
            <GravityTags tags={availableTags} onTagClick={addTag} selectedTags={selectedTags} maxTags={3} />
          )}

        </main>

        <div className="scroll-down-hint" ref={scrollHintRef} aria-hidden="true">
          <span className="scroll-down-hint__label">SCROLL</span>
          <div className="scroll-down-hint__track">
            <div className="scroll-down-hint__pearl" />
          </div>
        </div>

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
            <div className="more-btn-wrap text-more">
              <button className="btn-slot" onClick={() => navigate('/festival')}>
                <div className="btn-marquee">
                  <span>MORE</span>
                  <span className="arrow">→</span>
                  <span>MORE</span>
                </div>
              </button>
            </div>
          </div>
          <PosterShowcase films={FESTIVAL_FILMS} variant="festival" />
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
            <div className="more-btn-wrap text-more">
              <button className="btn-slot" onClick={() => navigate('/month')}>
                <div className="btn-marquee">
                  <span>MORE</span>
                  <span className="arrow">→</span>
                  <span>MORE</span>
                </div>
              </button>
            </div>
          </div>
          <PosterShowcase films={YEARLY_FILMS} variant="yearly" />
        </div>
      </section>

    </>
  )
}
