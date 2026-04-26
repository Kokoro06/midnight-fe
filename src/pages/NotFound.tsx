import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import TopNav from '../components/TopNav'
import './NotFound.css'

export default function NotFound() {
  useEffect(() => { document.title = '迷路了 | Midnight Moodvie' }, [])

  return (
    <div className="notfound-page">
      <video className="notfound-bg" src="ir.mp4" autoPlay muted loop playsInline />
      <TopNav />
      <div className="notfound-content">
        <p className="notfound-label">404</p>
        <h1 className="notfound-title">迷路了？</h1>
        <p className="notfound-sub">這個頁面不在今晚的片單裡。</p>
        <Link to="/" className="notfound-btn">回首頁找電影</Link>
      </div>
    </div>
  )
}
