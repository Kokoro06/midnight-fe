import { useEffect, useRef, useState } from 'react'
import TopNav from '../components/TopNav'
import './Month.css'

interface MonthData {
  title: string
  still: string
  meta: string
  tags: string
  synopsis: string
  poster: string
  label: string
}

const MONTHS: MonthData[] = [
  { title: '一月｜乖女孩 BABYGIRL', still: 'img/一月劇照.jpg', meta: '美國 USA｜ 2025 ｜115 min｜Halina Reijn', tags: '#禁忌慾望,#權力遊戲,#女性覺醒', synopsis: '一名位高權重的執行長（妮可基嫚 飾）與年輕實習生（哈里斯迪金森 飾）火熱外遇，將她的事業與家庭置於危險之中。《天黑請斃命》廣受矚目的荷蘭女導演哈琳娜瑞金，邀來奧斯卡、柏林影后妮可基嫚合作的，也讓她獲得威尼斯影后殊榮。', poster: 'img/一月.jpg', label: '01 / JANUARY' },
  { title: '二月｜納米比亞沙漠直播中', still: 'img/二月劇照.jpg', meta: '日本 Japan｜2024｜137 min｜山中陽子', tags: '#尋找自我,#青春迷惘,#寫實', synopsis: '【2024 坎城影展導演雙週費比西影評人獎】<br><br>21歲的卡娜有著一份說不上喜愛，但也談不上討厭的工作；交往對象稱不上優質，但也不算太差。對於未來的想像，他沒有太多強求，只希望能隨心所欲且自由。', poster: 'img/二月.jpg', label: '02 / FEBRUARY' },
  { title: '三月｜電影版孤獨的美食家', still: 'img/三月劇照.webP', meta: '日本 Japan｜2025｜90 min｜松重豐', tags: '#療癒,#美食,#內心獨白', synopsis: '改編自久住昌之原作、谷口治郎作畫的知名漫畫和長壽日劇系列。主角井之頭五郎（由松重豐飾演）是一名從事進口雜貨貿易的單身中年男子。', poster: 'img/三月.jpeg', label: '03 / MARCH' },
  { title: '四月｜被告汪星人 Dog on Trial', still: 'img/四月劇照.jpg', meta: '法國 France｜2024｜93 min｜Laetitia DOSCH', tags: '#溫情,#法庭辯護,#動物權益', synopsis: '故事發生在一個寧靜的法國小村莊，一隻名為「Kosar」的狗因為一連串的事件，最終被控告並將面臨安樂死的命運。', poster: 'img/四月.jpeg', label: '04 / APRIL' },
  { title: '五月｜關於愛的練習 Loveable', still: 'img/五月劇照.jpg', meta: '挪威Norway｜2024｜104min｜Lilja INGOLFSDOTTIR', tags: '#婚姻關係,#情感練習,#自我認同', synopsis: '瑪利亞在聚會裡遇見心儀對象迅速墜入情網，卻在結婚七年後，突然迎來丈夫的離婚宣告。面對愛情悄然逝去，不甘放手的她，強拉著丈夫進行婚姻諮商，試圖修復彼此之間的裂痕。', poster: 'img/五月.jpeg', label: '05 / MAY' },
  { title: '六月｜腓尼基計劃 THE PHOENICIAN SCHEME', still: 'img/六月劇照.jpg', meta: '日本 Japan ｜ 2025 ｜ 101min｜Wes Anderson', tags: '#黑色幽默,#家族企業,#華麗陣容', synopsis: '這是關於一個家族和一個家族企業的故事，班尼西歐戴托羅飾演商業大亨安納托"賈賈"寇達，歐洲最有錢的富豪之一。', poster: 'img/六月.jpg', label: '06 / JUNE' },
  { title: '七月｜長椅小情歌 At the bench', still: 'img/七月劇照.jpg', meta: '日本 Japan ｜ 2024 ｜ 86min｜奧山由之', tags: '#日常微光,#群像,#奇幻', synopsis: '一張孤獨的長椅，靜靜在河畔公園的草地上。一對掛念彼此的青梅竹馬在此久別重逢……', poster: 'img/七月.jpeg', label: '07 / JULY' },
  { title: '八月｜醜繼妹 the ugly stepsister', still: 'img/八月劇照.jpg', meta: '挪威Norweg｜2025｜109min｜Emilie Blichfeldt', tags: '#暗黑童話,#容貌焦慮,#顛覆', synopsis: '當變美成為被愛的唯一手段，她不惜一切代價……醜陋的艾薇拉一生的夢想就是嫁給王子。', poster: 'img/八月.jpeg', label: '08 / AUGUST' },
  { title: '九月｜我家的事 Family matters', still: 'img/九月劇照.jpg', meta: '台灣Taiwan｜2025｜99min｜潘客印', tags: '#家庭時光,#溫馨,#台灣日常', synopsis: '一個家就是一個四季，每個家都有不能說的祕密。追尋身世的姊姊、艱辛求子的媽媽……', poster: 'img/九月.jpg', label: '09 / SEPTEMBER' },
  { title: '十月｜九龍大眾浪漫', still: 'img/十月劇照.webP', meta: '日本 Japan｜2025｜117min｜池田千尋', tags: '#懸疑戀曲,#香港九龍,#懷舊', synopsis: '搖曳燈火、發霉後街還有流著汗的行人，曾經的香港九龍城寨魚龍混雜，卻也神秘魅惑。', poster: 'img/十月.jpg', label: '10 / OCTOBER' },
  { title: '十一月｜換乘真愛 Eternity', still: 'img/十一月劇照.jpeg', meta: '美國 USA｜2025｜113min｜David FREYNE', tags: '#奇幻愛情,#靈魂轉運,#抉擇', synopsis: '一個是等了你一輩子的人？一個是陪了你一輩子的人？', poster: 'img/十一月.png', label: '11 / NOVEMBER' },
  { title: '十二月｜旅與日子 Two season two strangers', still: 'img/十二月劇照.jpg', meta: '日本 Japan｜2025｜ 89min ｜三宅唱', tags: '#異境相遇,#心靈棲居,#靜謐', synopsis: '改編自漫畫家柘植義春的兩篇短篇漫畫，透過炎夏海濱與冬雪之境的雙重時空，描繪人在異境中尋找心靈棲居的故事。', poster: 'img/十二月.jpeg', label: '12 / DECEMBER' },
]

export default function Month() {
  const [current, setCurrent] = useState<MonthData>(MONTHS[0])
  const [detailed, setDetailed] = useState<boolean>(false)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const scrollWrapperRef = useRef<HTMLDivElement>(null)
  const autoScrollRef = useRef<boolean>(true)
  const isPausedRef = useRef<boolean>(false)
  const rafRef = useRef<number | null>(null)

  useEffect(() => { document.title = '月份推薦 | Midnight Moodvie' }, [])

  useEffect(() => {
    const scrollArea = scrollAreaRef.current
    const scrollWrapper = scrollWrapperRef.current
    if (!scrollArea || !scrollWrapper) return

    const scrollSpeed = 0.5
    function autoScroll() {
      if (autoScrollRef.current) {
        scrollArea!.scrollTop += scrollSpeed
        if (scrollArea!.scrollTop >= scrollWrapper!.scrollHeight / 2) {
          scrollArea!.scrollTop -= scrollWrapper!.scrollHeight / 2
        }
      }
      rafRef.current = requestAnimationFrame(autoScroll)
    }
    rafRef.current = requestAnimationFrame(autoScroll)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  useEffect(() => {
    const scrollArea = scrollAreaRef.current
    if (!scrollArea) return
    const cards = scrollArea.querySelectorAll('.month-card')
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && autoScrollRef.current) {
          const idx = parseInt((entry.target as HTMLElement).dataset.index ?? '0', 10)
          setCurrent(MONTHS[idx % MONTHS.length])
        }
      })
    }, { root: scrollArea, threshold: 0.6 })
    cards.forEach((card) => obs.observe(card))
    return () => obs.disconnect()
  }, [])

  const handleEnter = (m: MonthData) => {
    autoScrollRef.current = false
    setCurrent(m)
  }

  const handleLeave = () => {
    if (!isPausedRef.current) autoScrollRef.current = true
  }

  const handleClick = (m: MonthData) => {
    autoScrollRef.current = false
    setCurrent(m)
    setDetailed(true)
  }

  const togglePause = () => {
    const newPaused = !isPausedRef.current
    isPausedRef.current = newPaused
    autoScrollRef.current = !newPaused
    setIsPaused(newPaused)
  }

  const currentIdx = MONTHS.findIndex(m => m.title === current.title)

  const goPrev = () => {
    const idx = (currentIdx - 1 + MONTHS.length) % MONTHS.length
    setCurrent(MONTHS[idx])
  }

  const goNext = () => {
    const idx = (currentIdx + 1) % MONTHS.length
    setCurrent(MONTHS[idx])
  }

  const allCards = [...MONTHS, ...MONTHS]

  return (
    <div className={`month-page${detailed ? ' detailed-mode' : ''}`}>
      <TopNav />

      <div className="month-container">
        <div className="left-section">
          <img
            src={current.still}
            className="still-bg"
            alt="電影劇照"
            style={{ opacity: detailed ? 0.35 : 0.5 }}
          />

          <div className="floating-title">
            <h2>{current.title}</h2>
          </div>

          <div className="info-panel" style={{ right: detailed ? '40px' : '-60%', opacity: detailed ? 1 : 0 }}>
            <button className="close-btn" onClick={() => {
            setDetailed(false)
            if (!isPausedRef.current) autoScrollRef.current = true
          }}>×</button>
            <div className="info-nav">
              <button className="info-nav-btn" onClick={goPrev}>← 上一月</button>
              <button className="info-nav-btn" onClick={goNext}>下一月 →</button>
            </div>
            <p className="info-meta">{current.meta}</p>
            <div className="mood-tags">
              {current.tags.split(',').map((t) => <span key={t}>{t}</span>)}
            </div>
            <p className="info-synopsis" dangerouslySetInnerHTML={{ __html: current.synopsis }} />
          </div>
        </div>

        <div className="right-section" ref={scrollAreaRef}>
          <div className="scroll-wrapper" ref={scrollWrapperRef}>
            {allCards.map((m, i) => (
              <div
                key={i}
                className="month-card"
                data-index={i}
                onMouseEnter={() => handleEnter(m)}
                onMouseLeave={handleLeave}
                onClick={() => handleClick(m)}
              >
                <span className="month-label">{m.label}</span>
                <div className="poster-frame">
                  <img src={m.poster} alt={m.title} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button className="scroll-pause-btn" onClick={togglePause} aria-label={isPaused ? '繼續捲動' : '暫停捲動'}>
        {isPaused ? '▶' : '⏸'}
      </button>

      <div className="side-instruction">
        <div className="text-mask">
          <span>點擊海報可看介紹</span>
        </div>
      </div>
    </div>
  )
}
