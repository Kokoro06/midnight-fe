import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  { title: '一月｜乖女孩 BABYGIRL', still: 'img/一月劇照.jpg', meta: '美國 USA｜2025｜115 min｜Halina Reijn', tags: '#禁忌慾望,#權力遊戲,#女性覺醒', synopsis: '一名位高權重的執行長（妮可基嫚 飾）與年輕實習生（哈里斯迪金森 飾）火熱外遇，將她的事業與家庭置於危險之中。《天黑請斃命》廣受矚目的荷蘭女導演哈琳娜瑞金，邀來奧斯卡、柏林影后妮可基嫚合作的，也讓她獲得威尼斯影后殊榮。', poster: 'img/一月.jpg', label: '01 / JANUARY' },
  { title: '二月｜納米比亞沙漠直播中 Desert of Namibia', still: 'img/二月劇照.jpg', meta: '日本 Japan｜2024｜137 min｜山中陽子', tags: '#尋找自我,#青春迷惘,#寫實', synopsis: '【2024 坎城影展導演雙週費比西影評人獎】<br><br>21歲的卡娜有著一份說不上喜愛，但也談不上討厭的工作；交往對象稱不上優質，但也不算太差。對於未來的想像，他沒有太多強求，只希望能隨心所欲且自由。然而，若當成長意味著不能再無厘頭度日，必須學習世故的姿態、外交辭令般的語言，活成他所不嚮往的大人模樣，那麼，生活會不會終究是看著手機螢幕裡納米比亞沙漠裡的野生動物還比較令人期待？', poster: 'img/二月.jpg', label: '02 / FEBRUARY' },
  { title: '三月｜電影版孤獨的美食家 The Solitary Gourmet', still: 'img/三月劇照.webP', meta: '日本 Japan｜2025｜90 min｜松重豐', tags: '#療癒,#美食,#內心獨白', synopsis: '改編自久住昌之原作、谷口治郎作畫的知名漫畫和長壽日劇系列。主角井之頭五郎（由松重豐飾演）是一名從事進口雜貨貿易的單身中年男子。電影版將延續他獨自拜訪各處餐館，不受時間和他人打擾，自由享受美食的日常。故事將聚焦於他工作出差途中，探訪當地隱藏的特色料理，並透過他豐富的內心獨白，描繪他對食物的細膩觀察與熱愛。', poster: 'img/三月.jpeg', label: '03 / MARCH' },
  { title: '四月｜被告汪星人 Dog on Trial', still: 'img/四月劇照.jpg', meta: '法國 France｜2024｜93 min｜Laetitia DOSCH', tags: '#溫情,#法庭辯護,#動物權益', synopsis: '故事發生在一個寧靜的法國小村莊，一隻名為「Kosar」的狗因為一連串的事件，最終被控告並將面臨安樂死的命運。牠的飼主堅信 Kosar 是無辜的，決定聘請一位對動物保護充滿熱情的律師，為這隻「被告汪星人」進行一場充滿荒謬與人性的法庭辯護。這部電影以幽默且溫情的方式，探討動物權利、法律制度與人與寵物之間的情感羈絆。', poster: 'img/四月.jpeg', label: '04 / APRIL' },
  { title: '五月｜關於愛的練習 Loveable', still: 'img/五月劇照.jpg', meta: '挪威 Norway｜2024｜104 min｜Lilja INGOLFSDOTTIR', tags: '#婚姻關係,#情感練習,#自我認同', synopsis: '瑪利亞在聚會裡遇見心儀對象迅速墜入情網，卻在結婚七年後，突然迎來丈夫的離婚宣告。面對愛情悄然逝去，不甘放手的她，強拉著丈夫進行婚姻諮商，試圖修復彼此之間的裂痕。當過去相處點滴被逐一攤開、放大檢視，這個關於情感的練習題，卻比她想像中還要難解複雜。聚焦感情中的失衡狀態，藉由主、客觀視角轉換，重新解構日常生活片段，如剝洋蔥般地層層探討關係中的情感霸凌與情緒勒索，再延伸至個人家庭的成長記憶與自我認同。', poster: 'img/五月.jpeg', label: '05 / MAY' },
  { title: '六月｜腓尼基計劃 THE PHOENICIAN SCHEME', still: 'img/六月劇照.jpg', meta: '美國 USA｜2025｜101 min｜Wes Anderson', tags: '#黑色幽默,#家族企業,#華麗陣容', synopsis: '這是關於一個家族和一個家族企業的故事，班尼西歐戴托羅飾演商業大亨安納托「賈賈」寇達，歐洲最有錢的富豪之一；米亞薛波頓飾演莉絲兒修女，他的獨生女／一名修女；麥可塞拉飾演比約恩蘭德，他們的家教。豪華的演員陣容還包括里茲阿邁德、湯姆漢克斯、布萊恩克雷斯頓、馬修亞瑪希、理查艾尤德、傑佛瑞萊特、史嘉蕾喬韓森、班尼迪克康柏拜區、魯柏佛蘭德以及琥珀戴維絲。', poster: 'img/六月.jpg', label: '06 / JUNE' },
  { title: '七月｜長椅小情歌 At the Bench', still: 'img/七月劇照.jpg', meta: '日本 Japan｜2024｜86 min｜奧山由之', tags: '#日常微光,#群像,#奇幻', synopsis: '一張孤獨的長椅，靜靜在河畔公園的草地上。一對掛念彼此的青梅竹馬在此久別重逢、為日常瑣事爭吵的情侶被亂入的怪叔叔打斷、妹妹嘗試勸回因陷入苦戀而離家出走的姊姊、前來拆除椅子但形跡可疑的謎樣公務員……。人們來來去去，長椅兀自無言，仍舊靜靜看著歲月流轉。<br><br>以拍攝廣告出名的攝影師奧山由之，擅長從日常細節捕捉閃亮微光，營造清透柔美的自然氛圍。他凝視城市角落的靜謐，將不被注目的長椅化作記憶的容器。奧山由之初次執導即成功集結廣瀨鈴、仲野太賀、草彅剛、吉岡里帆、神木隆之介、今田美櫻等一線實力派演員，並請來知名音樂人安部勇磨操刀配樂。真摯情深卻又惡趣怪誕，在宮藤官九郎、濱口龍介與洪常秀之間闢出一條奇幻蹊徑。', poster: 'img/七月.jpeg', label: '07 / JULY' },
  { title: '八月｜醜繼妹 The Ugly Stepsister', still: 'img/八月劇照.jpg', meta: '挪威 Norway｜2025｜109 min｜Emilie Blichfeldt', tags: '#暗黑童話,#容貌焦慮,#顛覆', synopsis: '當變美成為被愛的唯一手段，她不惜一切代價……<br><br>醜陋的艾薇拉一生的夢想就是嫁給王子。為了贏過天生麗質的繼姐，她甘願整容削骨、吞蟲瘦身，動用一切極端手段挑戰肉體極限，只為博得王子一眼青睞。本片改編自經典童話《灰姑娘》，以極致暗黑風格重新詮釋「變美」的殘酷代價，徹底顛覆你對童話的想像。', poster: 'img/八月.jpeg', label: '08 / AUGUST' },
  { title: '九月｜我家的事 Family Matters', still: 'img/九月劇照.jpg', meta: '台灣 Taiwan｜2025｜99 min｜潘客印', tags: '#家庭時光,#溫馨,#台灣日常', synopsis: '一個家就是一個四季，每個家都有不能說的祕密。追尋身世的姊姊、艱辛求子的媽媽、天兵闖蕩的弟弟、試圖逆轉人生的爸爸，有歡聲笑鬧，也有哭泣徬徨，直到微光照進幽暗的心房。改編自短片《姊姊》，導演潘客印首部長片以不同家人視角，編織一部動人小品，勾勒平凡台灣鄉間家庭橫越24年的鮮活畫像。藍葦華、高伊玲、曾敬驊、黃珮琪共組一家四口，串起四段時光的悲喜往事。', poster: 'img/九月.jpg', label: '09 / SEPTEMBER' },
  { title: '十月｜九龍大眾浪漫 KOWLOON GENERIC ROMANCE', still: 'img/十月劇照.webP', meta: '日本 Japan｜2025｜117 min｜池田千尋', tags: '#懸疑戀曲,#香港九龍,#懷舊', synopsis: '搖曳燈火、發霉後街還有流著汗的行人，曾經的香港九龍城寨魚龍混雜，卻也神秘魅惑。在異國悶熱的魔窟，鯨井於一間房地產公司工作，每天遵循固定時間打卡，和看似無理的前輩工藤鬥嘴消磨時光，卻漸漸驚覺自己丟失了記憶。抽菸、吃西瓜是「她」的習慣，想要買新鞋、交朋友卻是自己的想望。而在那個與自己若即若離的前輩瞳孔裡，似乎也常懷哀愁，他曾有一位特別的戀人。愛是無法放下的時空魔咒，而他為思念造了一座城……。<br><br>改編自眉月啍的同名人氣漫畫，繼製作成動畫影集後，再推出真人電影，由日本新生代亮眼新星吉岡里帆搭檔水上恒司搭檔共譜懸疑戀曲，臺灣演員曾少宗則在片中驚喜出演要角。劇組為了再現昔日九龍城寨的風情，特地在盛夏來臺取景，撿拾街巷的懷舊遺跡。在重重謎團中，與觀眾一起走過那個無盡的夏日，編織出一曲橫越過去、現在與未來的絕美戀歌。', poster: 'img/十月.jpg', label: '10 / OCTOBER' },
  { title: '十一月｜換乘真愛 Eternity', still: 'img/十一月劇照.jpeg', meta: '美國 USA｜2025｜113 min｜David FREYNE', tags: '#奇幻愛情,#靈魂轉運,#抉擇', synopsis: '一個是等了你一輩子的人？一個是陪了你一輩子的人？<br><br>瓊安（伊莉莎白歐森飾演）與賴瑞（麥爾斯泰勒飾演）結縭60年，過著平凡卻充滿默契的婚姻生活。不過一場突如其來的意外，讓賴瑞離開人世，醒來卻發現自己重回年輕時的模樣，置身在一個名叫「靈魂轉運站」的奇幻世界——在這裡，每個靈魂都必須在七天之內，選擇自己將在哪個「永恆」中繼續存在。正當賴瑞猶豫之際，罹癌多年的瓊安也走到了生命盡頭。當她步入轉運站，與年輕樣貌的賴瑞重逢，原以為是命運賜予的奇蹟，卻在下一刻，瓊安見到自己在韓戰中陣亡的第一任丈夫路克（卡倫透納飾演），而路克離世後，便在轉運站癡情苦等瓊安67年，只為與她再續前緣。在這個連結無數靈魂的永恆轉運站裡，瓊安必須面對人生中最艱難的選擇：是與陪她走過一生、歷盡風雨的伴侶再續溫柔歲月？還是重回那段被時間凍結的初戀，重新擁抱年少時那份純粹的悸動？她必須做出選擇，決定自己的永恆。', poster: 'img/十一月.png', label: '11 / NOVEMBER' },
  { title: '十二月｜旅與日子 Two Seasons, Two Strangers', still: 'img/十二月劇照.jpg', meta: '日本 Japan｜2025｜89 min｜三宅唱', tags: '#異境相遇,#心靈棲居,#靜謐', synopsis: '閃耀的夏日海灘上，一位與這裡格格不入的男子，遇見了一位鬱鬱寡歡的女子，兩人就只是共同度過了一些時光。李是一名編劇，在創作上陷入了瓶頸，於是決定踏上一段旅程。冬日裡，她住進一間破破爛爛的民宿，屋頂上厚重的積雪感覺隨時都會崩塌。她在那遇見了懶散的民宿老闆，弁造。這間民宿沒有暖氣，甚至連被褥都得自己鋪……', poster: 'img/十二月.jpeg', label: '12 / DECEMBER' },
]

export default function Month() {
  const [current, setCurrent] = useState<MonthData>(MONTHS[0])
  const [detailed, setDetailed] = useState<boolean>(false)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [isMobile, setIsMobile] = useState<boolean>(() => window.matchMedia('(max-width: 767px)').matches)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const scrollWrapperRef = useRef<HTMLDivElement>(null)
  const autoScrollRef = useRef<boolean>(!window.matchMedia('(max-width: 767px)').matches)
  const isPausedRef = useRef<boolean>(false)
  const rafRef = useRef<number | null>(null)

  useEffect(() => { document.title = '月份推薦 | Midnight Moodvie' }, [])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
      autoScrollRef.current = !e.matches
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (window.matchMedia('(max-width: 767px)').matches) return

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
      const mobile = window.matchMedia('(max-width: 767px)').matches
      entries.forEach((entry) => {
        if (entry.isIntersecting && (autoScrollRef.current || mobile)) {
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
          <AnimatePresence mode="wait">
            <motion.img
              key={current.still}
              src={current.still}
              className="still-bg"
              alt="電影劇照"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: detailed ? 0.35 : 0.5, scale: detailed ? 1.05 : 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.7, ease: 'easeInOut' }}
            />
          </AnimatePresence>

          <div className="floating-title">
            <AnimatePresence mode="wait">
              <motion.h2
                key={current.title}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.38, ease: 'easeOut' }}
              >
                {current.title}
              </motion.h2>
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {detailed && (
              <motion.div
                className="info-panel"
                initial={isMobile ? { y: '100%', opacity: 0 } : { x: 80, opacity: 0 }}
                animate={isMobile ? { y: 0, opacity: 1 } : { x: 0, opacity: 1 }}
                exit={isMobile ? { y: '100%', opacity: 0 } : { x: 80, opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
              >
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="right-section" ref={scrollAreaRef}>
          <div className="scroll-wrapper" ref={scrollWrapperRef}>
            {allCards.map((m, i) => (
              <motion.div
                key={i}
                className="month-card"
                data-index={i}
                role="button"
                tabIndex={i < MONTHS.length ? 0 : -1}
                aria-label={m.label}
                onMouseEnter={() => handleEnter(m)}
                onMouseLeave={handleLeave}
                onClick={() => handleClick(m)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(m) } }}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <span className="month-label">{m.label}</span>
                <div className="poster-frame">
                  <img src={m.poster} alt={m.title} />
                </div>
              </motion.div>
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

      <p className="month-copyright">
        所有海報與劇照圖，圖源皆為官方所有，僅作為學生畢制作品需求用，無營利目的。
      </p>
    </div>
  )
}
