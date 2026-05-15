import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import TopNav from '../components/TopNav'
import { getConsent, clearConsent } from '../lib/consent'
import './Privacy.css'

const CONTACT_EMAIL = 'anyustudio@gmail.com'

export default function Privacy() {
  useEffect(() => {
    document.title = '隱私政策 | Midnight Moodvie'
  }, [])

  const handleReset = () => {
    clearConsent()
    window.location.reload()
  }

  const current = typeof window !== 'undefined' ? getConsent() : null

  return (
    <div className="privacy-page">
      <TopNav />
      <main className="privacy-wrap">
        <h1 className="privacy-title">隱私政策</h1>
        <p className="privacy-meta">最後更新：2026 年 5 月 15 日</p>

        <section className="privacy-section">
          <h2>我們是誰</h2>
          <p>
            Midnight Moodvie（午夜心放映）是一個以心情推薦電影的互動實驗網站，
            網址為 <a href="https://mmoodvie.live">mmoodvie.live</a>。
            本網站由個人經營，不販售商品或服務，亦不進行廣告投放。
          </p>
        </section>

        <section className="privacy-section">
          <h2>我們蒐集的資料</h2>
          <p>當你瀏覽或使用本網站，我們可能蒐集以下資料：</p>
          <ul>
            <li>
              <strong>使用行為事件</strong>：包含頁面瀏覽、心情測驗作答（A/B 選項）、
              推薦結果互動（點擊、重新推薦、分享、外連至 JustWatch）等。
            </li>
            <li>
              <strong>心情測驗輸入文字（原文）</strong>：若你在首頁的心情輸入欄位填入文字，
              我們會將該內容（最多 500 字）連同對應到的標籤一併送至分析服務，
              用於改善推薦邏輯。請勿在此欄位填入個人身分資訊（姓名、電話、信箱、地址等）。
            </li>
            <li>
              <strong>技術資料</strong>：匿名識別碼（cookie 與 localStorage）、瀏覽器類型、
              裝置類型、來源網址、UTM 參數。我們不蒐集你的真實姓名或可直接識別個人的資訊。
            </li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>我們使用的服務</h2>
          <p>
            <strong>PostHog</strong>（PostHog Inc.，美國）— 產品分析服務，
            用於追蹤上述使用行為事件。資料儲存於 PostHog 美國機房。
            詳見 <a href="https://posthog.com/privacy" target="_blank" rel="noopener noreferrer">PostHog 隱私政策</a>。
          </p>
        </section>

        <section className="privacy-section">
          <h2>Cookie 與 localStorage</h2>
          <p>
            我們在你首次造訪時會詢問是否同意資料蒐集。若你「接受」，PostHog 會在你的瀏覽器
            寫入匿名識別 cookie 與 localStorage；若你「拒絕」，分析腳本將不會載入。
            你的選擇會記錄在瀏覽器本地（key 為 <code>mm_consent_v1</code>）。
          </p>
          {current !== null && (
            <p className="privacy-current">
              你目前的設定：<strong>{current === 'accepted' ? '已接受' : '已拒絕'}</strong>。
              <button className="privacy-reset" onClick={handleReset}>重設此選擇</button>
            </p>
          )}
        </section>

        <section className="privacy-section">
          <h2>你的權利</h2>
          <p>
            你可以隨時要求查閱、更正或刪除我們持有的關於你的資料。由於我們僅持有匿名識別碼，
            若需刪除，請來信告知你的 PostHog distinct_id（可在瀏覽器開發者工具
            <code>localStorage</code> 中找到，key 為 <code>ph_*_posthog</code>）。
          </p>
          <p>
            聯絡信箱：<a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
        </section>

        <section className="privacy-section">
          <h2>資料保留</h2>
          <p>
            分析事件預設保留 12 個月，期滿自動由 PostHog 清除。
            自由文字 mood 內容比照辦理。
          </p>
        </section>

        <section className="privacy-section">
          <h2>政策變更</h2>
          <p>
            本政策若有重大變更，我們會在網站顯著位置公告。
            細部修訂則以本頁標示的「最後更新」日期為準。
          </p>
        </section>

        <p className="privacy-back">
          <Link to="/">← 回首頁</Link>
        </p>
      </main>
    </div>
  )
}
