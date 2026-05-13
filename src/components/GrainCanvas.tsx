import { useEffect, useRef } from 'react'

interface GrainCanvasProps {
  className?: string
}

export default function GrainCanvas({ className = 'grain-canvas' }: GrainCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const card = (
      canvas.closest('.quiz-card') ||
      canvas.closest('.card') ||
      canvas.closest('.favorites-card') ||
      canvas.closest('.qr-card')
    ) as HTMLElement | null
    if (!card) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const PIXEL_SIZE = 1
    const DENSITY = 0.18

    function resize() {
      canvas!.width = card!.offsetWidth
      canvas!.height = card!.offsetHeight
    }

    function drawGrain() {
      const w = canvas!.width
      const h = canvas!.height
      ctx!.clearRect(0, 0, w, h)
      const cols = Math.ceil(w / PIXEL_SIZE)
      const rows = Math.ceil(h / PIXEL_SIZE)
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (Math.random() > DENSITY) continue
          const roll = Math.random()
          let color: string, alpha: number
          if (roll < 0.55) {
            const b = 180 + Math.floor(Math.random() * 70)
            color = `rgb(${b},${b - 10},${b - 30})`
            alpha = (0.18 + Math.random() * 0.28) / 2
          } else if (roll < 0.82) {
            const rv = 140 + Math.floor(Math.random() * 60)
            const gv = 40 + Math.floor(Math.random() * 30)
            color = `rgb(${rv},${gv},5)`
            alpha = (0.2 + Math.random() * 0.3) / 2
          } else {
            color = 'rgb(10,5,3)'
            alpha = (0.3 + Math.random() * 0.4) / 2
          }
          ctx!.globalAlpha = alpha
          ctx!.fillStyle = color
          ctx!.fillRect(c * PIXEL_SIZE, r * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE)
        }
      }
      ctx!.globalAlpha = 1
    }

    resize()
    drawGrain()

    // 手機 viewport：只畫一次靜態 grain，不開 RAF（避免 GPU/CPU 持續耗電發燙）
    const isMobile = window.matchMedia('(max-width: 767px)').matches
    if (isMobile) return

    let frame = 0
    let rafId: number
    function tick() {
      frame++
      if (frame % 3 === 0) drawGrain()
      rafId = requestAnimationFrame(tick)
    }
    tick()

    const handleResize = () => { resize(); drawGrain() }
    window.addEventListener('resize', handleResize)
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return <canvas ref={canvasRef} className={className} />
}
