import { useEffect, useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import GrainCanvas from '../components/GrainCanvas'
import TopNav from '../components/TopNav'
import { getMoviesByTags, posterUrl, type Movie } from '../lib/directus'
import './Result.css'

const POSTER_FALLBACK = 'img/poster1.jpg'

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
    tags: ['愛情', '療癒', '文藝', '青春'],
    desc: '建議你今晚讓自己慢下來，選一部可以好好陪伴自己的故事。從首頁的「愛情／療癒／文藝／青春」這幾個心情標籤開始逛逛，會很容易找到你想要的氛圍。',
  },
  cult: {
    title: '邪典探險家',
    sub: '你喜歡在銀幕邊緣，發現別人不敢看的風景。',
    text: '你被大膽又有點怪的作品吸引，享受和導演一起「瘋」的感覺。你不怕尷尬、不怕獵奇，反而期待被作品狠狠驚嚇或逗笑。適合你的，是帶點黑色幽默、Cult 風格、類型混搭的小眾電影。',
    tags: ['邪典', '驚悚', '諷刺', 'LGBTQ'],
    desc: '今晚不如選一部你朋友可能會看不下去、但你會愛到不行的怪片吧。從首頁的「邪典／驚悚／諷刺／LGBTQ」標籤點進去，很容易挖到你喜歡的寶。',
  },
  thrill: {
    title: '燒腦追光者',
    sub: '你習慣在故事深處，追那一道最後才出現的光。',
    text: '你喜歡跟著劇情一起解謎，享受反轉、伏筆與細節的快感。你願意花力氣盯線索，也願意被結局狠狠翻盤。適合你的，是懸疑推理、科幻、犯罪與節奏緊湊的公路或末日電影。',
    tags: ['懸疑', '科幻', '犯罪', '燒腦'],
    desc: '可以從首頁的「懸疑／科幻／犯罪／燒腦」標籤開始，挑一部需要你全程專心的作品，讓整個人沉到故事裡，再帶著一點後勁回到現實。',
  },
}

export default function Result() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const type = (params.get('type') ?? 'healing') as ResultType
  const data = CARDS[type] ?? CARDS.healing

  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => { document.title = `${data.title} | Midnight Moodvie` }, [data.title])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getMoviesByTags(data.tags)
      .then((movies) => {
        if (cancelled) return
        setMovie(movies[0] ?? null)
        setLoading(false)
      })
      .catch((e) => {
        if (cancelled) return
        setError(e?.message ?? '載入失敗')
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [type, reloadKey])

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
              <div className="card-label">Moodie Card</div>
              <h2 className="card-title">{data.title}</h2>
              <p className="card-sub">{data.sub}</p>
              <p className="card-text">{data.text}</p>

              <div className="card-bottom">
                <div className="card-tags">
                  {data.tags.map((t) => (
                    <Link key={t} to={`/?tag=${encodeURIComponent(t)}`}>{t}</Link>
                  ))}
                </div>
                {movie && (
                  <div className="card-recommendation">
                    <span className="rec-label">今晚推薦放映</span>
                    <span className="rec-movie">{movie.title}</span>
                  </div>
                )}
              </div>
            </div>
          </article>
        </div>

        <div className="result-side">
          <h3 className="result-heading">今晚適合怎麼看電影？</h3>
          <p className="result-desc">{data.desc}</p>
          <div className="result-actions">
            <motion.button
              className="btn-primary"
              onClick={() => navigate('/')}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15 }}
            >
              前往首頁推薦
            </motion.button>
            <motion.button
              className="more-btn"
              onClick={() => navigate('/quiz')}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15 }}
            >
              再測一次
            </motion.button>
          </div>
        </div>
      </div>

      <section className="recommendations">
        {loading && (
          <div className="featured-movie featured-skeleton" aria-hidden>
            <div className="featured-poster skeleton-block" />
            <div className="featured-info">
              <span className="skeleton-line skeleton-line-sm" />
              <span className="skeleton-line skeleton-line-lg" />
              <span className="skeleton-line skeleton-line-sm" />
            </div>
          </div>
        )}
        {!loading && error && (
          <div className="rec-error">
            <p>無法載入今晚的推薦</p>
            <button className="more-btn" onClick={() => setReloadKey((k) => k + 1)}>重試</button>
          </div>
        )}
        {!loading && !error && movie && (
          <motion.div
            className="featured-movie"
            whileHover={{ y: -4, boxShadow: '0 20px 48px rgba(0,0,0,0.75)' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <img
              className="featured-poster"
              src={posterUrl(movie.poster)}
              alt={movie.title}
              onError={(e) => {
                const img = e.target as HTMLImageElement
                if (img.src.endsWith(POSTER_FALLBACK)) return
                img.src = POSTER_FALLBACK
              }}
            />
            <div className="featured-info">
              <span className="featured-label">TONIGHT&apos;S FILM</span>
              <h3 className="featured-title">{movie.title}</h3>
              <span className="featured-year">{movie.year}</span>
            </div>
          </motion.div>
        )}
      </section>
    </div>
  )
}
