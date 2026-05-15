import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getConsent, setConsent, type ConsentState } from '../lib/consent'
import { initAnalytics } from '../lib/analytics'
import './ConsentBanner.css'

export default function ConsentBanner() {
  const [state, setState] = useState<ConsentState>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const current = getConsent()
    setState(current)
    setMounted(true)
    if (current === 'accepted') initAnalytics()

    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<ConsentState>).detail
      setState(detail ?? null)
    }
    window.addEventListener('mm-consent-change', onChange)
    return () => window.removeEventListener('mm-consent-change', onChange)
  }, [])

  if (!mounted || state !== null) return null

  const accept = () => {
    setConsent('accepted')
    initAnalytics()
  }

  const decline = () => {
    setConsent('declined')
  }

  return (
    <div className="consent-banner" role="dialog" aria-label="Cookie 與資料蒐集同意">
      <p className="consent-text">
        我們使用 PostHog 分析網站使用情形（包含你在心情測驗中輸入的文字），
        以改善推薦品質。詳見
        <Link to="/privacy" className="consent-link">隱私政策</Link>。
      </p>
      <div className="consent-actions">
        <button className="consent-btn consent-btn-ghost" onClick={decline}>拒絕</button>
        <button className="consent-btn consent-btn-primary" onClick={accept}>接受</button>
      </div>
    </div>
  )
}
