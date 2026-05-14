import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import GrainCanvas from "../components/GrainCanvas";
import TopNav from "../components/TopNav";
import { getMoviesByMultipleTags, posterUrl, type MovieWithScore, type FestivalAward } from "../lib/directus";
import { CHARACTERS, type ResultKey } from "../data/quizData";
import { characterImageUrl, CHARACTER_IMAGE_FALLBACK } from "../data/characterImages";
import "./QuizResult.css";

const POSTER_FALLBACK = "img/poster1.jpg";

// 離屏 story img 用獨立 URL，避免與可見 img 共用瀏覽器 image cache。
// 可見 img 沒帶 crossOrigin（避免 DEV 跨 port 跨來源檢查），若兩者共用快取，
// 離屏 img 雖標 crossOrigin="anonymous" 也會拿到無 CORS 標記的快取版 →
// html2canvas 會 taint canvas → toBlob 回 null → 分享失敗。
// DEV：走 Vite proxy 變同源；PROD：query 加 _share=1 拆 cache key。
function storyPosterSrc(url: string): string {
  if (!url || url.startsWith("img/")) return url || POSTER_FALLBACK;
  if (import.meta.env.DEV) {
    if (url.includes("image.tmdb.org")) {
      return url.replace(/^https?:\/\/image\.tmdb\.org/, "/img-proxy/tmdb");
    }
    if (url.includes("localhost:8055")) {
      return url.replace(/^https?:\/\/localhost:8055/, "/img-proxy/directus");
    }
    return url;
  }
  return url + (url.includes("?") ? "&" : "?") + "_share=1";
}

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

function topAwards(awards: FestivalAward[], limit = 3): FestivalAward[] {
  if (!awards || awards.length === 0) return [];
  return awards
    .slice()
    .sort((a, b) => {
      if (a.result !== b.result) return a.result === "won" ? -1 : 1;
      const pa = TOP_AWARD_PRIORITY.indexOf(a.award_category);
      const pb = TOP_AWARD_PRIORITY.indexOf(b.award_category);
      const priorityA = pa === -1 ? 999 : pa;
      const priorityB = pb === -1 ? 999 : pb;
      if (priorityA !== priorityB) return priorityA - priorityB;
      return b.year - a.year;
    })
    .slice(0, limit);
}

const FALLBACK_KEY: ResultKey = "E";

function isResultKey(value: string | null): value is ResultKey {
  return value !== null && value in CHARACTERS;
}

export default function QuizResult() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { key: locationKey } = useLocation();

  const rawType = params.get("type")?.toUpperCase() ?? null;
  const type: ResultKey = isResultKey(rawType) ? rawType : FALLBACK_KEY;
  const data = CHARACTERS[type];
  const previewStory = params.get("preview") === "story";

  const cardRef = useRef<HTMLElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const [movie, setMovie] = useState<MovieWithScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [sharing, setSharing] = useState(false);
  const [posterBlobUrl, setPosterBlobUrl] = useState<string | null>(null);
  const preBuiltFileRef = useRef<File | null>(null);

  // 預先把 story 海報抓成 blob URL，當作 .qrs-poster 的 src。
  // 這樣 html2canvas 看到的永遠是同源 blob，避開 TMDB 沒送 Vary:Origin
  // 造成的 CORS cache 污染（可見 img 無 crossOrigin 先載入後，離屏 img
  // 即使帶 _share=1 cache buster 也可能命中 opaque response）。
  useEffect(() => {
    setPosterBlobUrl(null);
    if (!movie) return;
    const url = storyPosterSrc(posterUrl(movie));
    if (url.startsWith("img/")) return;

    let cancelled = false;
    let createdUrl: string | null = null;
    fetch(url, { mode: "cors", credentials: "omit" })
      .then(async (resp) => {
        if (!resp.ok) throw new Error(`poster fetch not ok: ${resp.status} ${resp.type}`);
        const blob = await resp.blob();
        if (cancelled) return;
        createdUrl = URL.createObjectURL(blob);
        setPosterBlobUrl(createdUrl);
      })
      .catch((err) => {
        console.warn("[QuizResult] poster pre-fetch failed:", url, err);
      });

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [movie]);

  const buildShareFile = async (story: HTMLElement): Promise<File | null> => {
    const imgs = Array.from(story.querySelectorAll("img"));
    await Promise.all(
      imgs.map((img) =>
        img.complete && img.naturalWidth > 0
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              const done = () => resolve();
              img.addEventListener("load", done, { once: true });
              img.addEventListener("error", done, { once: true });
            }),
      ),
    );

    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(story, {
      backgroundColor: "#0c0905",
      scale: 1,
      useCORS: true,
      allowTaint: false,
      logging: false,
      width: 1080,
      height: 1920,
      windowWidth: 1080,
      windowHeight: 1920,
    });

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!blob) return null;
    return new File([blob], `moodie-${type}-story.png`, { type: "image/png" });
  };

  // Best-effort pre-build so iOS can keep user activation when sharing.
  // 包 requestIdleCallback：html2canvas 渲染 1080×1920 會占用主執行緒數百 ms，
  // 若 movie 一載入就立刻跑，使用者剛好想 scroll 就會卡。改在瀏覽器 idle 時跑。
  useEffect(() => {
    preBuiltFileRef.current = null;
    if (!movie) return;
    const story = storyRef.current;
    if (!story) return;

    let cancelled = false;
    const run = async () => {
      try {
        const file = await buildShareFile(story);
        if (!cancelled && file) preBuiltFileRef.current = file;
      } catch (err) {
        console.warn("[QuizResult] pre-build failed (will rebuild on click):", err);
      }
    };

    const ric = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
    const cic = (window as Window & { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback;
    let handle: number;
    if (ric) {
      handle = ric(() => { void run(); }, { timeout: 3000 });
    } else {
      handle = window.setTimeout(() => { void run(); }, 200);
    }

    return () => {
      cancelled = true;
      if (ric && cic) cic(handle);
      else window.clearTimeout(handle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movie, type, posterBlobUrl]);

  const downloadShareFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareOrDownload = (file: File) => {
    if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
      return navigator
        .share({ files: [file], title: "", text: "" })
        .catch((err: Error) => {
          if (err.name === "AbortError") return;
          console.error("[QuizResult] share failed, downloading:", err);
          downloadShareFile(file);
        });
    }
    downloadShareFile(file);
    return Promise.resolve();
  };

  const handleShare = async () => {
    if (sharing) return;

    // Fast path: pre-built file is ready. navigator.share() called synchronously
    // here (no awaits before) so iOS transient user activation is preserved.
    const preBuilt = preBuiltFileRef.current;
    if (preBuilt) {
      setSharing(true);
      shareOrDownload(preBuilt).finally(() => setSharing(false));
      return;
    }

    // Slow path: pre-build didn't finish. Build now. iOS may lose activation
    // and fall back to download, but at least the user gets something.
    const story = storyRef.current;
    if (!story) return;
    setSharing(true);
    try {
      const file = await buildShareFile(story);
      if (!file) {
        console.error("[QuizResult] toBlob returned null (canvas tainted?)");
        return;
      }
      preBuiltFileRef.current = file;
      await shareOrDownload(file);
    } catch (err) {
      console.error("[QuizResult] share build failed:", err);
    } finally {
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

  const handleCharacterImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    if (!img.src.endsWith(CHARACTER_IMAGE_FALLBACK)) img.src = CHARACTER_IMAGE_FALLBACK;
  };

  const awards = movie ? topAwards(movie.festival_awards) : [];

  return (
    <div className="qr-page">
      <video className="qr-bg-video" src="ir.mp4" autoPlay muted loop playsInline />
      <TopNav />

      {!previewStory && (
        <div className="qr-scroll">
          <section className="qr-card" ref={cardRef}>
            <div className="qr-card-bg" />
            <div className="qr-card-smoke" />
            <GrainCanvas animate={false} />
            <div className="qr-card-inner">
              {/* Header */}
              <div className="qr-header">
                <div className="qr-header-text">
                  <p className="qr-eyebrow">在影廳裡，你是——</p>
                  <h1 className="qr-title">
                    {data.title.slice(0, 2)}
                    <br />
                    {data.title.slice(2)}
                  </h1>
                </div>
                <img className={`qr-character qr-character--${type}`} src={characterImageUrl(type)} alt={data.title} onError={handleCharacterImgError} />
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
                    <div className="qr-movie-info">
                      <h3 className="qr-movie-title">《{movie.title}》</h3>
                      <p className="qr-movie-meta">
                        {movie.year > 0 && <span>{movie.year}</span>}
                        {movie.year > 0 && movie.original_title && movie.original_title !== movie.title && <span className="qr-meta-sep">｜</span>}
                        {movie.original_title && movie.original_title !== movie.title && <span>{movie.original_title}</span>}
                      </p>
                      {awards.length > 0 && (
                        <div className="qr-festival-badges">
                          {awards.map((a, i) => (
                            <span key={i} className={`qr-festival-badge qr-festival-badge--${a.result}`}>
                              {a.result === "won" ? "★" : "◎"} {a.festival} {a.award_category}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <img className="qr-poster" src={posterUrl(movie)} alt={movie.title} onError={handleImgError} />
                  </motion.div>
                )}
              </div>

              {/* Companions */}
              <div className="qr-companions">
                <div className="qr-companion-card">
                  <img className="qr-companion-img" src={characterImageUrl(data.compatible.key)} alt={data.compatible.name} onError={handleCharacterImgError} />
                  <div className="qr-companion-info">
                    <span className="qr-companion-label">✦✦ 最佳影友 ✦✦</span>
                    <span className="qr-companion-name">{data.compatible.name}</span>
                    <span className="qr-companion-reason">{data.compatible.reason}</span>
                  </div>
                </div>
                <div className="qr-companion-card">
                  <img className="qr-companion-img" src={characterImageUrl(data.regular.key)} alt={data.regular.name} onError={handleCharacterImgError} />
                  <div className="qr-companion-info">
                    <span className="qr-companion-label">✦✦ 異頻片友 ✦✦</span>
                    <span className="qr-companion-name">{data.regular.name}</span>
                    <span className="qr-companion-reason">{data.regular.reason}</span>
                  </div>
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
                disabled={sharing || !movie}
                whileHover={{ scale: sharing || !movie ? 1 : 1.02 }}
                whileTap={{ scale: sharing || !movie ? 1 : 0.97 }}
                transition={{ duration: 0.15 }}
              >
                {sharing ? "處理中…" : "分享我的結果"}
              </motion.button>
            </div>
          </section>
        </div>
      )}

      {/* Off-screen Instagram Story (1080×1920) capture target */}
      <div ref={storyRef} className={`qr-story${previewStory ? " qr-story--preview" : ""}`} aria-hidden={!previewStory}>
        <div className="qrs-smoke-a" />
        <div className="qrs-smoke-b" />
        <div className="qrs-inner">
          <div className="qrs-header">
            <div className="qrs-header-text">
              <p className="qrs-eyebrow">在影廳裡，你是——</p>
              <h1 className="qrs-title">
                {data.title.slice(0, 2)}
                <br />
                {data.title.slice(2)}
              </h1>
            </div>
            <img className={`qrs-character qrs-character--${type}`} src={characterImageUrl(type)} alt={data.title} onError={handleCharacterImgError} />
          </div>

          <div className="qrs-movie-row">
            <div className="qrs-movie-col">
              <p className="qrs-movie-heading">今晚就看這一部吧～</p>
              {movie && (
                <>
                  <img className="qrs-poster" src={posterBlobUrl ?? storyPosterSrc(posterUrl(movie))} alt={movie.title} crossOrigin="anonymous" onError={handleImgError} />
                  <h3 className="qrs-movie-title">《{movie.title}》</h3>
                  {(movie.year > 0 || (movie.original_title && movie.original_title !== movie.title)) && (
                    <p className="qrs-movie-meta">
                      {movie.year > 0 && <span>{movie.year}</span>}
                      {movie.year > 0 && movie.original_title && movie.original_title !== movie.title && <span className="qrs-meta-sep">｜</span>}
                      {movie.original_title && movie.original_title !== movie.title && <span>{movie.original_title}</span>}
                    </p>
                  )}
                </>
              )}
            </div>
            <div className="qrs-right-col">
              {data.tags && data.tags.length > 0 && (
                <div className="qrs-tags">
                  {data.tags.slice(0, 2).map((t, i) => (
                    <span key={t} className={`qrs-tag${i === 0 ? " qrs-tag--tilt" : ""}`}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <p className="qrs-desc-sub">{data.sub}</p>
              <p className="qrs-desc-text">{data.text}</p>
            </div>
          </div>

          <div className="qrs-companions-row">
            <div className="qrs-companion-card">
              <img className="qrs-companion-img" src={characterImageUrl(data.compatible.key)} alt={data.compatible.name} onError={handleCharacterImgError} />
              <div className="qrs-companion-info">
                <span className="qrs-companion-label">✦✦ 最佳影友 ✦✦</span>
                <span className="qrs-companion-name">{data.compatible.name}</span>
                <span className="qrs-companion-reason">{data.compatible.reason}</span>
              </div>
            </div>
            <div className="qrs-companion-card">
              <img className="qrs-companion-img" src={characterImageUrl(data.regular.key)} alt={data.regular.name} onError={handleCharacterImgError} />
              <div className="qrs-companion-info">
                <span className="qrs-companion-label">✦✦ 異頻片友 ✦✦</span>
                <span className="qrs-companion-name">{data.regular.name}</span>
                <span className="qrs-companion-reason">{data.regular.reason}</span>
              </div>
            </div>
          </div>

          <div className="qrs-footer">
            <img className="qrs-brand" src="img/mm-logo-b.png" alt="午夜心放映" />
            <span className="qrs-url">mmoodvie.live</span>
          </div>
        </div>
      </div>
    </div>
  );
}
