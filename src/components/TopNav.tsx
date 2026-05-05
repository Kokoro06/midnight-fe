import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import './TopNav.css'

interface TopNavProps {
  variant?: 'transparent' | 'solid'
  hideUntilMs?: number
  rightSlot?: ReactNode
  subNav?: ReactNode
}

interface MobileMenuOverlayProps {
  open: boolean
  onClose: () => void
  burgerRef: React.RefObject<HTMLButtonElement | null>
}

const NAV_ITEMS = [
  { to: '/', label: '首頁', end: true },
  { to: '/festival', label: '影展資訊', end: false },
  { to: '/month', label: '月份推薦', end: false },
  { to: '/quiz', label: '心情測驗', end: false },
] as const

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function MobileMenuOverlay({ open, onClose, burgerRef }: MobileMenuOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const firstLinkRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => firstLinkRef.current?.focus(), 50)
    return () => {
      clearTimeout(t)
      burgerRef.current?.focus()
    }
  }, [open, burgerRef])

  if (!open) return null

  return (
    <>
    <div className="global-nav-mobile-backdrop" onClick={onClose} aria-hidden="true" />
    <div
      ref={overlayRef}
      className="global-nav-mobile-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="主選單"
      id="global-nav-menu"
    >
      <button
        type="button"
        className="global-nav-mobile-close"
        aria-label="關閉選單"
        onClick={onClose}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <line x1="5" y1="5" x2="19" y2="19" />
          <line x1="19" y1="5" x2="5" y2="19" />
        </svg>
      </button>
      <ul className="global-nav-mobile-list">
        {NAV_ITEMS.map((item, i) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              ref={i === 0 ? firstLinkRef : undefined}
              onClick={onClose}
              className={({ isActive }) => `global-nav-mobile-link${isActive ? ' is-active' : ''}`}
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
    </>
  )
}

export default function TopNav({ variant = 'transparent', hideUntilMs, rightSlot, subNav }: TopNavProps) {
  const [scrolled, setScrolled] = useState(false)
  const [visible, setVisible] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [revealed, setRevealed] = useState(hideUntilMs == null)
  const lastScrollY = useRef(0)
  const rafId = useRef<number | null>(null)
  const navRef = useRef<HTMLElement>(null)
  const burgerRef = useRef<HTMLButtonElement>(null)
  const location = useLocation()

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (hideUntilMs == null) return
    const t = window.setTimeout(() => setRevealed(true), hideUntilMs)
    return () => window.clearTimeout(t)
  }, [hideUntilMs])

  useEffect(() => {
    if (prefersReducedMotion()) {
      setVisible(true)
      return
    }
    lastScrollY.current = window.scrollY

    const tick = () => {
      rafId.current = null
      const y = window.scrollY
      const delta = y - lastScrollY.current
      setScrolled(y > 80)
      if (y <= 80) {
        setVisible(true)
      } else if (delta > 8) {
        setVisible(false)
      } else if (delta < -8) {
        setVisible(true)
      }
      lastScrollY.current = y
    }

    const onScroll = () => {
      if (rafId.current != null) return
      rafId.current = window.requestAnimationFrame(tick)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafId.current != null) window.cancelAnimationFrame(rafId.current)
    }
  }, [])

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const onFocusIn = () => setVisible(true)
    nav.addEventListener('focusin', onFocusIn)
    return () => nav.removeEventListener('focusin', onFocusIn)
  }, [])

  return (
    <nav
      ref={navRef}
      aria-label="主導覽"
      className="global-top-nav"
      data-variant={variant}
      data-visible={visible ? 'true' : 'false'}
      data-scrolled={scrolled ? 'true' : 'false'}
      data-revealed={revealed ? 'true' : 'false'}
    >
      <div className="global-nav-row global-nav-row-primary">
        <Link to="/" className="global-nav-logo" aria-label="Midnight Moodvie 回首頁">
          <img src="/img/mm-logo-w.svg" alt="" />
        </Link>

        <ul className="global-nav-links">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) => `global-nav-link${isActive ? ' is-active' : ''}`}
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {rightSlot && <div className="global-nav-right">{rightSlot}</div>}

        <button
          ref={burgerRef}
          type="button"
          className="global-nav-burger"
          aria-label={mobileOpen ? '關閉選單' : '開啟選單'}
          aria-expanded={mobileOpen}
          aria-controls="global-nav-menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="13" x2="20" y2="13" />
            <line x1="4" y1="19" x2="20" y2="19" />
          </svg>
        </button>
      </div>

      {subNav && (
        <div className="global-nav-row global-nav-row-sub">
          {subNav}
        </div>
      )}

      <MobileMenuOverlay
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        burgerRef={burgerRef}
      />
    </nav>
  )
}
