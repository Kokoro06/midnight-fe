import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import GrainCanvas from "../components/GrainCanvas";
import TopNav from "../components/TopNav";
import { getMoviesByMultipleTags, posterUrl, type MovieWithScore, type FestivalAward } from "../lib/directus";
import { CHARACTERS, type ResultKey } from "../data/quizData";
import "./QuizResult.css";

const POSTER_FALLBACK = "img/poster1.jpg";

const TOP_AWARD_PRIORITY = [
  "金棕櫚獎",
  "金熊獎",
  "金獅獎",
  "最佳劇情長片",
  "最佳影片",
  "評審團大獎",
  "銀熊獎-評審團大獎",
  "銀獅獎-評審團大獎",
  "評審團獎",
  "銀熊獎-最佳導演",
  "銀獅獎-最佳導演",
  "最佳導演",
];

function topAward(awards: FestivalAward[]): FestivalAward | null {
  if (!awards || awards.length === 0) return null;
  const won = awards.filter((a) => a.result === "won");
  const pool = won.length > 0 ? won : awards;
  return pool.slice().sort((a, b) => {
    const pa = TOP_AWARD_PRIORITY.indexOf(a.award_category);
    const pb = TOP_AWARD_PRIORITY.indexOf(b.award_category);
    const priorityA = pa === -1 ? 999 : pa;
    const priorityB = pb === -1 ? 999 : pb;
    if (priorityA !== priorityB) return priorityA - priorityB;
    return b.year - a.year;
  })[0];
}

const FALLBACK_KEY: ResultKey = "social-emotion-poetic";

function isResultKey(value: string | null): value is ResultKey {
  return value !== null && value in CHARACTERS;
}

export default function QuizResult() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { key: locationKey } = useLocation();

  const rawType = params.get("type");
  const type: ResultKey = isResultKey(rawType) ? rawType : FALLBACK_KEY;
  const data = CHARACTERS[type];

  const cardRef = useRef<HTMLElement>(null);
  const [movie, setMovie] = useState<MovieWithScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    if (!cardRef.current || sharing) return;
    setSharing(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#0c0905",
        scale: window.devicePixelRatio || 2,
        useCORS: true,
        logging: false,
      });
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setSharing(false);
          return;
        }
        const file = new File([blob], `moodie-${type}.png`, { type: "image/png" });
        if (navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: `我是${data.title} | Midnight Moodvie` });
          } catch {
            /* cancelled */
          }
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `moodie-${type}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
        setSharing(false);
      });
    } catch {
      setSharing(false);
    }
  };

  useEffect(() => {
    document.title = `${data.title} | Midnight Moodvie`;
  }, [data.title]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getMoviesByMultipleTags(data.tags)
      .then((ms) => {
        if (!cancelled) {
          setMovie(ms[0] ?? null);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e?.message ?? "載入失敗");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [type, reloadKey, locationKey]);

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    if (!img.src.endsWith(POSTER_FALLBACK)) img.src = POSTER_FALLBACK;
  };

  const award = movie ? topAward(movie.festival_awards) : null;

  return (
    <div className="qr-page">
      <video className="qr-bg-video" src="ir.mp4" autoPlay muted loop playsInline />
      <TopNav />

      <div className="qr-scroll">
        <section className="qr-card" ref={cardRef}>
          <div className="qr-card-bg" />
          <div className="qr-card-smoke" />
          <GrainCanvas />
          <div className="qr-card-inner">
            {/* Header */}
            <div className="qr-header">
              <div className="qr-header-text">
                <p className="qr-eyebrow">在影癮裡，你是——</p>
                <h1 className="qr-title">
                  {data.title.slice(0, 2)}
                  <br />
                  {data.title.slice(2)}
                </h1>
                <div className="qr-tags">
                  {data.tags.map((tag) => (
                    <span key={tag} className="qr-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <img className="qr-character" src="img/character.png" alt={data.title} />
            </div>

            {/* Description box */}
            <div className="qr-desc-box">
              <p className="qr-desc-sub">{data.sub}</p>
              <p className="qr-desc-text">{data.text}</p>
            </div>

            {/* Movie section */}
            <div className="qr-movie-section">
              <p className="qr-movie-heading">今晚就看這一部吧～</p>

              {loading && <div className="qr-skeleton" aria-hidden="true" />}

              {!loading && error && (
                <div className="qr-error">
                  <p>無法載入推薦</p>
                  <button className="qr-btn-ghost" onClick={() => setReloadKey((k) => k + 1)}>
                    重試
                  </button>
                </div>
              )}

              {!loading && !error && !movie && (
                <div className="qr-error">
                  <p>找不到符合的電影</p>
                </div>
              )}

              {!loading && !error && movie && (
                <motion.div
                  className="qr-movie-card"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <img className="qr-poster" src={posterUrl(movie)} alt={movie.title} onError={handleImgError} />
                  <div className="qr-movie-overlay">
                    <div className="qr-movie-info">
                      <h3 className="qr-movie-title">《{movie.title}》</h3>
                      <p className="qr-movie-meta">
                        {movie.year > 0 && <span>{movie.year}</span>}
                        {movie.year > 0 && movie.original_title && movie.original_title !== movie.title && <span className="qr-meta-sep">｜</span>}
                        {movie.original_title && movie.original_title !== movie.title && <span>{movie.original_title}</span>}
                      </p>
                      {award && (
                        <span className={`qr-festival-badge qr-festival-badge--${award.result}`}>
                          {award.result === "won" ? "★" : "◎"} {award.festival} {award.award_category}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Companions 2×2 grid */}
            <div className="qr-companions">
              <div className="qr-companion-card">
                <span className="qr-companion-label">最佳影友</span>
                <img className="qr-companion-img" src="img/character.png" alt={data.compatible[0].name} />
                <span className="qr-companion-name">{data.compatible[0].name}</span>
              </div>
              <div className="qr-companion-card">
                <span className="qr-companion-label">還是有點距離比較好</span>
                <img className="qr-companion-img" src="img/character.png" alt={data.regular[0].name} />
                <span className="qr-companion-name">{data.regular[0].name}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="qr-actions">
              <motion.button
                className="qr-btn-ghost"
                onClick={() => setReloadKey((k) => k + 1)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.15 }}
              >
                再試一部
              </motion.button>
              <motion.button
                className="qr-btn-ghost"
                onClick={() => navigate("/")}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.15 }}
              >
                回首頁選片
              </motion.button>
            </div>

            <motion.button
              className="qr-btn-share"
              onClick={handleShare}
              disabled={sharing}
              whileHover={{ scale: sharing ? 1 : 1.02 }}
              whileTap={{ scale: sharing ? 1 : 0.97 }}
              transition={{ duration: 0.15 }}
            >
              {sharing ? "處理中…" : "分享我的結果"}
            </motion.button>
          </div>
        </section>
      </div>
    </div>
  );
}
