import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, MotionConfig } from 'framer-motion'
import { ReactLenis, useLenis } from 'lenis/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Home from './pages/Home'
import Festival from './pages/Festival'
import Month from './pages/Month'
import Quiz from './pages/Quiz'
import Effect from './pages/Effect'
import Result from './pages/Result'
import QuizResult from './pages/QuizResult'
import NotFound from './pages/NotFound'

gsap.registerPlugin(ScrollTrigger)

function GSAPLenisSync() {
  const lenis = useLenis()

  useEffect(() => {
    if (!lenis) return
    const update = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(update)
    gsap.ticker.lagSmoothing(0)
    lenis.on('scroll', ScrollTrigger.update)
    return () => {
      gsap.ticker.remove(update)
      lenis.off('scroll', ScrollTrigger.update)
    }
  }, [lenis])

  return null
}

function ScrollToTop() {
  const lenis = useLenis()
  const { pathname } = useLocation()

  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true })
  }, [pathname, lenis])

  return null
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/festival" element={<Festival />} />
          <Route path="/month" element={<Month />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/recommend" element={<Effect />} />
          <Route path="/effect" element={<Effect />} />
          <Route path="/result" element={<Result />} />
          <Route path="/quiz-result" element={<QuizResult />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <MotionConfig reducedMotion="user">
      <ReactLenis
        root
        options={{
          duration: prefersReduced ? 0 : 1.2,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: !prefersReduced,
        }}
      >
        <BrowserRouter>
          <GSAPLenisSync />
          <ScrollToTop />
          <AnimatedRoutes />
        </BrowserRouter>
      </ReactLenis>
    </MotionConfig>
  )
}
