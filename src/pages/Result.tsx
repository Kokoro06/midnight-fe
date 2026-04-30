import { useEffect, useState } from 'react'
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import GrainCanvas from '../components/GrainCanvas'
import TopNav from '../components/TopNav'
import { getMoviesByTags, getMoviesByMultipleTags, posterUrl, type Movie, type MovieWithScore, type FestivalAward } from '../lib/directus'
import './Result.css'

const POSTER_FALLBACK = 'img/poster1.jpg'

// 最高獎項優先順序（越前面越優先）
const TOP_AWARD_PRIORITY = [
  '金棕櫚獎', '金熊獎', '金獅獎',
  '最佳劇情長片', '最佳影片',
  '評審團大獎', '銀熊獎-評審團大獎', '銀獅獎-評審團大獎',
  '評審團獎', '銀熊獎-最佳導演', '銀獅獎-最佳導演',
  '最佳導演',
]

function topAward(awards: FestivalAward[]): FestivalAward | null {
  if (!awards || awards.length === 0) return null
  const won = awards.filter((a) => a.result === 'won')
  const pool = won.length > 0 ? won : awards
  return pool.slice().sort((a, b) => {
    const pa = TOP_AWARD_PRIORITY.indexOf(a.award_category)
    const pb = TOP_AWARD_PRIORITY.indexOf(b.award_category)
    const priorityA = pa === -1 ? 999 : pa
    const priorityB = pb === -1 ? 999 : pb
    if (priorityA !== priorityB) return priorityA - priorityB
    return b.year - a.year
  })[0]
}

const FestivalBadge = ({ award }: { award: FestivalAward }) => (
  <span className={`festival-badge festival-badge--${award.result}`}>
    {award.result === 'won' ? '★' : '◎'} {award.festival} {award.award_category}
  </span>
)

interface CardData {
  title: string
  sub: string
  text: string
  tags: string[]
  desc: string
}

type ResultType = 'healing' | 'cult' | 'thrill'

const CARDS: Record<ResultType, CardData> = {
  healing: {
    title: '療癒放映師',
    sub: '你擅長在黑暗裡，替別人開一盞小燈。',
    text: '你看電影時，最在意的是人與人之間細膩的情緒與和解。你喜歡那種不急著說完、卻會慢慢在心裡發酵的故事。適合你的，是溫柔卻不幼稚的文藝片、家庭片和青春成長故事。',
    tags: ['想談戀愛', '需要被療癒', '文藝', '想念那時候'],
    desc: '建議你今晚讓自己慢下來，選一部可以好好陪伴自己的故事。從首頁的「想談戀愛／需要被療癒／文藝／想念那時候」這幾個心情標籤開始逛逛，會很容易找到你想要的氛圍。',
  },
  cult: {
    title: '邪典探險家',
    sub: '你喜歡在銀幕邊緣，發現別人不敢看的風景。',
    text: '你被大膽又有點怪的作品吸引，享受和導演一起「瘋」的感覺。你不怕尷尬、不怕獵奇，反而期待被作品狠狠驚嚇或逗笑。適合你的，是帶點黑色幽默、Cult 風格、類型混搭的小眾電影。',
    tags: ['想看點怪的', '驚悚', '這世界很荒謬', '酷兒'],
    desc: '今晚不如選一部你朋友可能會看不下去、但你會愛到不行的怪片吧。從首頁的「想看點怪的／驚悚／這世界很荒謬／酷兒」標籤點進去，很容易挖到你喜歡的寶。',
  },
  thrill: {
    title: '燒腦追光者',
    sub: '你習慣在故事深處，追那一道最後才出現的光。',
    text: '你喜歡跟著劇情一起解謎，享受反轉、伏筆與細節的快感。你願意花力氣盯線索，也願意被結局狠狠翻盤。適合你的，是懸疑推理、科幻、犯罪與節奏緊湊的公路或末日電影。',
    tags: ['懸疑', '科幻', '犯罪', '越燒越好'],
    desc: '可以從首頁的「懸疑／科幻／犯罪／越燒越好」標籤開始，挑一部需要你全程專心的作品，讓整個人沉到故事裡，再帶著一點後勁回到現實。',
  },
}

export default function Result() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { key: locationKey } = useLocation()

  const tagsParam = params.get('tags')
  const moodParam = params.get('mood') ?? ''
  const tagNames = tagsParam ? tagsParam.split(',').filter(Boolean) : []
  const isTagMode = tagNames.length > 0

  const type = (params.get('type') ?? 'healing') as ResultType
  const data = CARDS[type] ?? CARDS.healing

  const [movie, setMovie] = useState<Movie | null>(null)
  const [movies, setMovies] = useState<MovieWithScore[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    document.title = isTagMode ? '心情推薦 | Midnight Moodvie' : `${data.title} | Midnight Moodvie`
  }, [data.title, isTagMode])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    const names = tagsParam ? tagsParam.split(',').filter(Boolean) : []
    const promise = names.length > 0
      ? getMoviesByMultipleTags(names).then((ms) => {
          if (!cancelled) { setMovies(ms); setLoading(false) }
        })
      : getMoviesByTags(data.tags).then((ms) => {
          if (!cancelled) { setMovie(ms[0] ?? null); setLoading(false) }
        })
    promise.catch((e) => {
      if (!cancelled) { setError(e?.message ?? '載入失敗'); setLoading(false) }
    })
    return () => { cancelled = true }
  }, [tagsParam, type, reloadKey, locationKey])

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement
    if (!img.src.endsWith(POSTER_FALLBACK)) img.src = POSTER_FALLBACK
  }

  const SkeletonCard = () => (
    <div className="featured-movie featured-skeleton" aria-hidden>
      <div className="featured-poster skeleton-block" />
      <div className="featured-info">
        <span className="skeleton-line skeleton-line-sm" />
        <span className="skeleton-line skeleton-line-lg" />
        <span className="skeleton-line skeleton-line-sm" />
      </div>
    </div>
  )

  const MovieCard = ({ m }: { m: Movie }) => (
    <motion.div
      className="featured-movie"
      whileHover={{ y: -4, boxShadow: '0 20px 48px rgba(0,0,0,0.75)' }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <img className="featured-poster" src={posterUrl(m)} alt={m.title} onError={handleImgError} />
      <div className="featured-info">
        <span className="featured-label">TONIGHT&apos;S FILM</span>
        <h3 className="featured-title">{m.title}</h3>
        <span className="featured-year">{m.year}</span>
      </div>
    </motion.div>
  )

  const PrimaryMovieCard = ({ m }: { m: Movie }) => {
    const award = topAward(m.festival_awards)
    return (
      <motion.div
        className="primary-movie-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
      >
        <img className="primary-poster" src={posterUrl(m)} alt={m.title} onError={handleImgError} />
        <div className="primary-info">
          <span className="primary-badge">今晚最推薦</span>
          {award && <FestivalBadge award={award} />}
          <h3 className="primary-title">{m.title}</h3>
          {m.original_title && m.original_title !== m.title && (
            <p className="primary-original">{m.original_title}</p>
          )}
          {m.year > 0 && <span className="primary-year">{m.year}</span>}
        </div>
      </motion.div>
    )
  }

  const SecondaryMovieCard = ({ m, index }: { m: Movie; index: number }) => {
    const award = topAward(m.festival_awards)
    return (
      <motion.div
        className="secondary-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 + index * 0.07 }}
        whileHover={{ y: -5 }}
      >
        <div className="secondary-poster-wrap">
          <img className="secondary-poster" src={posterUrl(m)} alt={m.title} onError={handleImgError} />
        </div>
        <p className="secondary-title">{m.title}</p>
        {award && <FestivalBadge award={award} />}
        {m.year > 0 && <span className="secondary-year">{m.year}</span>}
      </motion.div>
    )
  }

  return (
    <div className="result-page">
      <video className="result-bg-video" src="ir.mp4" autoPlay muted loop playsInline />

      <TopNav />

      <div className="result-wrap">
        <div>
          <article className="card">
            <div className="card-bg" />
            <div className="card-smoke" />
            <GrainCanvas />
            <div className="card-inner">
              <div className="card-label">{isTagMode ? "Today's Mood" : 'Moodie Card'}</div>
              <h2 className="card-title">{isTagMode ? '心情配電影' : data.title}</h2>
              <p className="card-sub">{isTagMode ? '根據你選擇的心情，為你找到今晚的電影' : data.sub}</p>
              {!isTagMode && <p className="card-text">{data.text}</p>}

              <div className="card-bottom">
                <div className="card-tags">
                  {isTagMode
                    ? tagNames.map((t) => <span key={t}>#{t}</span>)
                    : data.tags.map((t) => <Link key={t} to={`/?tag=${encodeURIComponent(t)}`}>{t}</Link>)
                  }
                </div>
                {!isTagMode && movie && (
                  <div className="card-recommendation">
                    <span className="rec-label">今晚推薦放映</span>
                    <span className="rec-movie">{movie.title}</span>
                  </div>
                )}
                {isTagMode && !loading && movies.length > 0 && (
                  <div className="card-recommendation">
                    <span className="rec-label">共找到</span>
                    <span className="rec-movie">{movies.length} 部</span>
                  </div>
                )}
              </div>
            </div>
          </article>
        </div>

        <div className="result-side">
          <h3 className="result-heading">
            {isTagMode
              ? `根據你的心情：${tagNames.map((t) => `#${t}`).join(' ')}`
              : '今晚適合怎麼看電影？'
            }
          </h3>
          {moodParam && isTagMode && (
            <p className="mood-source">
              你說：「{moodParam}」<br />→ 我理解為{' '}
              {tagNames.map((t) => <span key={t} className="mood-source-tag">#{t}</span>)}
            </p>
          )}
          <p className="result-desc">
            {isTagMode
              ? (!loading && !error && movies.length > 0
                  ? `為你推薦 ${movies.length} 部電影，依照符合程度排序。`
                  : '正在為你搜尋最合適的電影...')
              : data.desc
            }
          </p>
          <div className="result-actions">
            <motion.button
              className="btn-primary"
              onClick={() => navigate('/')}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15 }}
            >
              {isTagMode ? '重新選擇' : '前往首頁推薦'}
            </motion.button>
            <motion.button
              className="more-btn"
              onClick={() => navigate('/quiz')}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15 }}
            >
              {isTagMode ? '心情測驗' : '再測一次'}
            </motion.button>
          </div>
        </div>
      </div>

      <section className="recommendations">
        {loading && (isTagMode ? [0, 1, 2].map((i) => <SkeletonCard key={i} />) : <SkeletonCard />)}
        {!loading && error && (
          <div className="rec-error">
            <p>無法載入今晚的推薦</p>
            <button className="more-btn" onClick={() => setReloadKey((k) => k + 1)}>重試</button>
          </div>
        )}
        {!loading && !error && isTagMode && movies.length === 0 && (
          <div className="rec-error">
            <p>找不到符合的電影，試試其他心情標籤吧</p>
          </div>
        )}
        {!loading && !error && isTagMode && movies.length > 0 && (
          <>
            <PrimaryMovieCard m={movies[0]} />
            {movies.length > 1 && (
              <div className="secondary-section">
                <p className="secondary-heading">你可能也喜歡</p>
                <div className="secondary-grid">
                  {movies.slice(1, 5).map((m, i) => (
                    <SecondaryMovieCard key={m.id} m={m} index={i} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        {!loading && !error && !isTagMode && movie && <MovieCard m={movie} />}
      </section>
    </div>
  )
}
