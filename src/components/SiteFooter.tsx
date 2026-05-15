import { Link } from 'react-router-dom'
import './SiteFooter.css'

export default function SiteFooter() {
  return (
    <footer className="site-footer" aria-label="網站頁尾">
      <p className="site-footer-copy">© midnight-moodvie 2026</p>
      <nav className="site-footer-nav" aria-label="頁尾連結">
        <Link to="/privacy" className="site-footer-link">隱私政策</Link>
      </nav>
    </footer>
  )
}
