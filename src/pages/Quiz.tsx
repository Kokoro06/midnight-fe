import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import GrainCanvas from '../components/GrainCanvas'
import TopNav from '../components/TopNav'
import './Quiz.css'

type OptionType = 'A' | 'B' | 'C'
type ResultKey = 'healing' | 'cult' | 'thrill'
type Counts = Record<OptionType, number>

interface QuizOption {
  type: OptionType
  text: string
}

interface Question {
  step: number
  label: string
  text: string
  options: QuizOption[]
  footnote?: string
}

interface QuizCardProps {
  children: React.ReactNode
}

const QUESTIONS: Question[] = [
  {
    step: 1,
    label: 'Q1',
    text: '今晚的你，最像哪個場景？',
    options: [
      { type: 'A', text: '一個下過雨的老街，慢慢走著、聽鞋底踩在水窪的聲音。' },
      { type: 'B', text: '深夜的屋頂，你和朋友大聲聊天，順便計畫一個小小的惡作劇。' },
      { type: 'C', text: '看不清盡頭的公路，只有車燈和廣播陪你往前開。' },
    ],
  },
  {
    step: 2,
    label: 'Q2',
    text: '朋友約你看電影，你會選哪一種約會方式？',
    options: [
      { type: 'A', text: '一起窩在沙發上，看完電影順便聊彼此的心事。' },
      { type: 'B', text: '去戲院看一部評價兩極、劇情超怪的片，出來一起吐槽或大推。' },
      { type: 'C', text: '自己先看一部節奏很快的片，再把最刺激的片段剪給朋友看。' },
    ],
    footnote: '＊直覺選就好，不需要想太久。',
  },
  {
    step: 3,
    label: 'Q3',
    text: '電影看到一半，你最在意的是什麼？',
    options: [
      { type: 'A', text: '角色的情緒有沒有被好好說完、關係有沒有好好收尾。' },
      { type: 'B', text: '這部片有沒有哪一幕「太瘋太有創意」，會讓人記一輩子。' },
      { type: 'C', text: '剛剛埋下的線索會怎麼回收，結局能不能顛覆你的預期。' },
    ],
    footnote: '＊回答完這題，就會生成你的今晚 Moodie 卡牌。',
  },
]

function typeText(
  text: string,
  setter: React.Dispatch<React.SetStateAction<string>>,
  prevTimer?: ReturnType<typeof setInterval>,
): ReturnType<typeof setInterval> {
  if (prevTimer !== undefined) clearInterval(prevTimer)
  let i = 0
  setter('')
  const timer = setInterval(() => {
    if (i < text.length) {
      setter((prev) => prev + text.charAt(i))
      i++
    } else {
      clearInterval(timer)
    }
  }, 40)
  return timer
}

function QuizCard({ children }: QuizCardProps) {
  return (
    <div className="quiz-card">
      <div className="quiz-card-bg" />
      <div className="quiz-card-smoke" />
      <GrainCanvas />
      <div className="quiz-card-inner">{children}</div>
    </div>
  )
}

export default function Quiz() {
  const navigate = useNavigate()
  const [step, setStep] = useState<number>(0)
  const [leaving, setLeaving] = useState<boolean>(false)
  const [counts, setCounts] = useState<Counts>({ A: 0, B: 0, C: 0 })
  const [titleText, setTitleText] = useState<string>('')
  const [questionText, setQuestionText] = useState<string>('')
  const [chosenOption, setChosenOption] = useState<OptionType | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const typingTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  useEffect(() => {
    document.title = '心情測驗 | Midnight Moodvie'
    timerRef.current = setTimeout(() => {
      typingTimerRef.current = typeText('點根線香，放鬆一下', setTitleText, typingTimerRef.current)
    }, 100)
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current)
      if (typingTimerRef.current !== undefined) clearInterval(typingTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (step >= 1 && step <= 3) {
      const q = QUESTIONS[step - 1]
      typingTimerRef.current = typeText(q.text, setQuestionText, typingTimerRef.current)
    }
  }, [step])

  const chooseOption = (type: OptionType) => {
    if (leaving || chosenOption !== null) return
    setChosenOption(type)

    setTimeout(() => {
      setLeaving(true)
      setTimeout(() => {
        const newCounts: Counts = { ...counts, [type]: counts[type] + 1 }
        setCounts(newCounts)
        const nextStep = step + 1

        if (nextStep > 3) {
          let best: OptionType = 'A'
          if (newCounts.B > newCounts[best]) best = 'B'
          if (newCounts.C > newCounts[best]) best = 'C'
          const key: ResultKey = best === 'A' ? 'healing' : best === 'B' ? 'cult' : 'thrill'
          setTimeout(() => navigate(`/result?type=${key}`), 450)
        } else {
          setStep(nextStep)
          setLeaving(false)
          setChosenOption(null)
        }
      }, 350)
    }, 200)
  }

  const sceneClass = (s: number) => {
    if (s !== step) return 'scene'
    if (leaving) return 'scene scene-leave'
    return 'scene scene-active'
  }

  return (
    <div className="quiz-page">
      <video className="quiz-bg-video" src="ir.mp4" autoPlay muted loop playsInline />

      <section className={sceneClass(0)}>
        <QuizCard>
          <div style={{ paddingTop: '12px' }}>
            <div className="scene-logo">
              <img src="img/mm-logo-w.svg" alt="Midnight Moodvie" />
            </div>
            <h1 className="scene-title">{titleText}</h1>
            <p className="scene-subtitle">你是哪款！電影地縛靈 👻</p>
            <p className="scene-preview">共 3 題，約需 1 分鐘</p>
            <div className="quiz-divider" style={{ marginBottom: '32px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <motion.button
                className="scene-option btn-quiz-start"
                style={{ display: 'block', width: '100%', maxWidth: '200px', fontSize: '14px' }}
                onClick={() => { setStep(1); setLeaving(false) }}
                whileHover={{ y: -2, boxShadow: '0 8px 22px rgba(0,0,0,0.45)' }}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                開始測驗
              </motion.button>
              <Link to="/" className="skip-link">略過測驗，直接前往首頁</Link>
            </div>
          </div>
        </QuizCard>
      </section>

      {step >= 1 && <TopNav />}

      {QUESTIONS.map((q) => (
        <section key={q.step} className={sceneClass(q.step)}>
          <QuizCard>
            <div className="quiz-progress">
              <span className="quiz-progress-step">{q.step} / 3</span>
              <Link to="/" className="skip-link" style={{ marginTop: 0 }}>離開測驗</Link>
            </div>
            <div className="quiz-divider" />
            <div className="scene-label">{q.label}</div>
            <h2 className="scene-question">{step === q.step ? questionText : ''}</h2>
            <div className="scene-options">
              {q.options.map((opt) => (
                <motion.button
                  key={opt.type}
                  className={`scene-option${chosenOption === opt.type ? ' chosen' : ''}`}
                  onClick={() => chooseOption(opt.type)}
                  whileHover={{ y: -2, boxShadow: '0 8px 22px rgba(0,0,0,0.45)' }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                >
                  {opt.text}
                </motion.button>
              ))}
            </div>
            {q.footnote && <div className="scene-footnote"><small>{q.footnote}</small></div>}
          </QuizCard>
        </section>
      ))}
    </div>
  )
}
