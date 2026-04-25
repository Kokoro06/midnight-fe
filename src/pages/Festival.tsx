import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import './Festival.css'

type FestivalId = 'goldenHorse' | 'taipei' | 'kaohsiung'

interface SubFestival {
  title: string
  en: string
  img: string
  desc: string
}

interface FestivalEntry {
  themeColor: string
  bgWords: string[]
  panelTitle: string
  panelLogo: string
  panelDescs: string[]
  subFestivals: SubFestival[]
}

interface SubCardProps {
  sub: SubFestival
  themeColor: string
  delay: number
}

const festivalData: Record<FestivalId, FestivalEntry> = {
  goldenHorse: {
    themeColor: '#d4af37',
    bgWords: ['TAIPEI', 'GOLDEN', 'HORSE', 'FILM', 'FESTIVAL'],
    panelTitle: '台北\n金馬\n影展',
    panelLogo: 'TAIPEI\nGOLDEN\nHORSE FILM\nFESTIVAL',
    panelDescs: [
      '成立於 1962 年，以華語電影最高榮譽「金馬獎」為核心，是華語世界最具影響力的影展之一。',
      '金馬影展以「專業、自由、多元」為宗旨，結合競賽、放映、創投及教育功能，為華語影人與國際觀眾搭起交流平台。',
      '無論是亞洲電影的新聲音，還是國際名導的新作，都能在金馬影展中找到屬於電影藝術的深刻與自由。',
    ],
    subFestivals: [
      { title: '奇幻影展', en: 'GOLDEN HORSE FANTASTIC FILM FESTIVAL', img: 'img/gh-fantastic.jpg', desc: '與你一起跨越想像邊界，從恐怖到動畫、從武俠到cult片，在奇幻中看見影像的可能。' },
      { title: '經典影展', en: 'GOLDEN HORSE CLASSIC FILM FESTIVAL', img: 'img/gh-classic.jpg', desc: '回溯大銀幕上的經典，從默片到黃金時期喜劇，讓電影的時間厚度在當代重現。' },
      { title: '國際影展', en: 'GOLDEN HORSE INTERNATIONAL FILM FESTIVAL', img: 'img/gh-international.jpg', desc: '一年一度華語電影與國際視野的交匯平台，觀賞世界、理解台灣、擁抱影像的多元對話。' },
    ],
  },
  taipei: {
    themeColor: '#4ab0ff',
    bgWords: ['TAIPEI', 'FILM', 'FESTIVAL', 'TFF', 'INDEPENDENT'],
    panelTitle: '台北\n電影節',
    panelLogo: 'TAIPEI\nFILM\nFESTIVAL',
    panelDescs: [
      '創立於 1998 年，是台灣最具代表性的國際級影展之一，更是台灣電影創作者的搖籃。',
      '台北電影節以「百萬首獎」鼓勵具備突破與創新精神的台灣電影，同時引介國際獨立製片前衛之作。',
      '影展充滿年輕活力，透過夏日觀影狂歡，持續為台北這座城市注入豐沛的文化動能。',
    ],
    subFestivals: [
      { title: '國際新導演', en: 'INTERNATIONAL NEW TALENT', img: 'https://via.placeholder.com/600x600/111/4ab0ff?text=INT', desc: '挖掘全球具潛力的影像新銳，引領觀眾看見電影藝術的未來趨勢與大膽實驗。' },
      { title: '台北電影獎', en: 'TAIPEI FILM AWARDS', img: 'https://via.placeholder.com/600x600/111/4ab0ff?text=TFA', desc: '專屬台灣電影人的最高榮耀，涵蓋劇情長片、紀錄片、短片與動畫片，展現本土創作火力。' },
      { title: '焦點影人', en: 'FILMMAKER IN FOCUS', img: 'https://via.placeholder.com/600x600/111/4ab0ff?text=FOCUS', desc: '系統性回顧國際重量級或具啟發性導演的作品，深入剖析其獨特的作者美學。' },
    ],
  },
  kaohsiung: {
    themeColor: '#ff4d4d',
    bgWords: ['KAOHSIUNG', 'FILM', 'FESTIVAL', 'KFF', 'SHORTS', 'VR'],
    panelTitle: '高雄\n電影節',
    panelLogo: 'KAOHSIUNG\nFILM\nFESTIVAL',
    panelDescs: [
      '高雄電影節創立於 2001 年，以充滿活力與奇幻色彩的策展風格聞名，深耕南台灣影像文化。',
      '作為亞洲最重要的短片影展之一，「國際短片競賽」每年吸引全球數千件作品參賽。',
      '近年更積極推動 VR 虛擬實境與 XR 沉浸式體驗，成為台灣引領未來視覺科技的影展先驅。',
    ],
    subFestivals: [
      { title: '國際短片競賽', en: 'INTERNATIONAL SHORT FILM', img: 'https://via.placeholder.com/600x600/111/ff4d4d?text=SHORTS', desc: '在極短的篇幅內爆發最強大的敘事能量，匯聚全球最生猛、最創新的短片傑作。' },
      { title: 'XR 無限幻境', en: 'XR DREAMLAND', img: 'https://via.placeholder.com/600x600/111/ff4d4d?text=XR', desc: '打破螢幕邊界，透過 VR、AR 等沉浸式媒介，帶領觀眾進入前所未有的虛擬感官體驗。' },
      { title: '年度主題策展', en: 'ANNUAL THEME', img: 'https://via.placeholder.com/600x600/111/ff4d4d?text=THEME', desc: '每年針對特定社會議題或電影美學進行深度策展，展現高雄電影節獨特的生猛觀點。' },
    ],
  },
}

function SubCard({ sub, themeColor, delay }: SubCardProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) el.classList.add('visible')
    }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const fallback = `https://via.placeholder.com/600x600/2a2a2a/${themeColor.replace('#', '')}?text=Image`

  return (
    <div className="sub-card" ref={ref} style={{ transitionDelay: `${delay}s` }}>
      <div className="sub-card-title-wrap">
        <h3 className="sub-card-title">{sub.title}</h3>
        <p className="sub-card-en">{sub.en}</p>
      </div>
      <div className="sub-card-img">
        <img src={sub.img} onError={(e) => { (e.target as HTMLImageElement).src = fallback }} alt={sub.title} />
      </div>
      <p className="sub-card-desc">{sub.desc}</p>
    </div>
  )
}

export default function Festival() {
  const [activeId, setActiveId] = useState<FestivalId>('goldenHorse')
  const [fading, setFading] = useState<boolean>(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const data = festivalData[activeId]

  useEffect(() => {
    document.documentElement.style.setProperty('--accent-color', data.themeColor)
  }, [data.themeColor])

  const switchFestival = (id: FestivalId) => {
    if (id === activeId) return
    setFading(true)
    setTimeout(() => {
      setActiveId(id)
      setFading(false)
    }, 600)
  }

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const onMove = (e: MouseEvent) => {
      const rect = panel.getBoundingClientRect()
      const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2) * 12
      const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2) * 12
      panel.style.transition = 'transform 0.4s ease-out'
      panel.style.transform = `translate(${x}px, ${y}px)`
    }
    const onLeave = () => {
      panel.style.transition = 'transform 1.2s cubic-bezier(0.2, 1, 0.3, 1)'
      panel.style.transform = 'translate(0px, 0px)'
    }
    panel.addEventListener('mousemove', onMove)
    panel.addEventListener('mouseleave', onLeave)
    return () => {
      panel.removeEventListener('mousemove', onMove)
      panel.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <div className="festival-page">
      <nav className="top-nav">
        <Link to="/" className="logo-link">
          <div className="logo-mask">
            <img src="img/mm-logo-w.svg" alt="午夜心放映" className="logo-img" />
            <span className="logo-text">回首頁</span>
          </div>
        </Link>
        <div className="nav-links">
          {(Object.keys(festivalData) as FestivalId[]).map((id) => (
            <button
              key={id}
              className={`nav-btn${activeId === id ? ' active' : ''}`}
              onClick={() => switchFestival(id)}
            >
              {id === 'goldenHorse' ? '金馬影展' : id === 'taipei' ? '台北電影節' : '高雄電影節'}
            </button>
          ))}
        </div>
      </nav>

      <main id="content-wrapper" className={fading ? 'fade-out' : ''}>
        <section className="hero-section">
          <div className="bg-text-container">
            {data.bgWords.map((word, i) => (
              <span key={word + i} style={{ animationDelay: `${Math.random() * 1.5}s` }}>{word}</span>
            ))}
          </div>

          <div className="center-panel" ref={panelRef}>
            <h1 className="panel-title" style={{ whiteSpace: 'pre-line' }}>{data.panelTitle}</h1>
            <div className="panel-logo" style={{ whiteSpace: 'pre-line' }}>{data.panelLogo}</div>
            {data.panelDescs.map((desc, i) => (
              <p key={i} className="panel-desc">{desc}</p>
            ))}
          </div>
        </section>

        <section className="sub-festivals-section">
          <div className="sub-grid">
            {data.subFestivals.map((sub, i) => (
              <SubCard key={sub.title} sub={sub} themeColor={data.themeColor} delay={i * 0.2} />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
