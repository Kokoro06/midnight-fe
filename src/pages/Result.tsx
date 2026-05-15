import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import GrainCanvas from "../components/GrainCanvas";
import TopNav from "../components/TopNav";
import { getMoviesByMultipleTags, posterUrl, type MovieWithScore, type FestivalAward } from "../lib/directus";
import { getWatchProviders, providerLogoUrl, type Provider, type WatchProviders } from "../lib/tmdb";
import { topAward, topAwards } from "../lib/awards";
import "./Result.css";

const POSTER_FALLBACK = "img/poster1.jpg";

const FestivalBadge = ({ award }: { award: FestivalAward }) => (
  <span className={`festival-badge festival-badge--${award.result}`}>
    {award.result === "won" ? "★" : "◎"} {award.festival} {award.award_category}
  </span>
);

export default function Result() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { key: locationKey } = useLocation();

  const tagsParam = params.get("tags");
  const tagNames = tagsParam ? tagsParam.split(",").filter(Boolean) : [];
  const moodParam = params.get("mood")?.trim() ?? "";

  const [movies, setMovies] = useState<MovieWithScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    document.title = "心情推薦 | Midnight Moodvie";
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getMoviesByMultipleTags(tagNames)
      .then((ms) => {
        if (!cancelled) {
          setMovies(ms);
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
  }, [tagsParam, reloadKey, locationKey]);

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    if (!img.src.endsWith(POSTER_FALLBACK)) img.src = POSTER_FALLBACK;
  };

  const SkeletonCard = () => (
    <div className="featured-movie featured-skeleton" aria-hidden>
      <div className="featured-poster skeleton-block" />
      <div className="featured-info">
        <span className="skeleton-line skeleton-line-sm" />
        <span className="skeleton-line skeleton-line-lg" />
        <span className="skeleton-line skeleton-line-sm" />
      </div>
    </div>
  );

  const WatchProvidersPanel = ({ movie }: { movie: MovieWithScore }) => {
    const [providers, setProviders] = useState<WatchProviders | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      let cancelled = false;
      if (!movie.tmdb_id) {
        setProviders(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      getWatchProviders(movie.tmdb_id).then((p) => {
        if (!cancelled) {
          setProviders(p);
          setLoading(false);
        }
      });
      return () => {
        cancelled = true;
      };
    }, [movie.tmdb_id]);

    if (loading) {
      return (
        <div className="primary-providers primary-providers--loading" aria-hidden>
          <span className="skeleton-line skeleton-line-lg" />
        </div>
      );
    }

    const total =
      (providers?.flatrate.length ?? 0) + (providers?.rent.length ?? 0) + (providers?.buy.length ?? 0);

    if (!providers || total === 0) {
      if (movie.justwatch_url) {
        return (
          <a
            className="primary-watch"
            href={movie.justwatch_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`在 JustWatch 上查看《${movie.title}》的觀看平台（新分頁開啟）`}
          >
            哪裡看 <span aria-hidden="true">↗</span>
          </a>
        );
      }
      return <p className="primary-providers-empty">目前在台灣查無串流平台</p>;
    }

    const link = providers.link ?? movie.justwatch_url ?? null;

    const renderGroup = (label: string, list: Provider[]) => {
      if (list.length === 0) return null;
      return (
        <div className="providers-group">
          <span className="providers-group-label">{label}</span>
          <div className="providers-list">
            {list.map((p) =>
              link ? (
                <a
                  key={p.provider_id}
                  className="provider-tile"
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`在 ${p.provider_name} ${label}（透過 JustWatch 開啟）`}
                >
                  <img src={providerLogoUrl(p)} alt="" className="provider-logo" loading="lazy" />
                  <span className="provider-name">{p.provider_name}</span>
                </a>
              ) : (
                <span key={p.provider_id} className="provider-tile">
                  <img src={providerLogoUrl(p)} alt="" className="provider-logo" loading="lazy" />
                  <span className="provider-name">{p.provider_name}</span>
                </span>
              ),
            )}
          </div>
        </div>
      );
    };

    return (
      <div className="primary-providers" aria-label="在台灣可看的串流平台">
        {renderGroup("訂閱", providers.flatrate)}
        {renderGroup("租借", providers.rent)}
        {renderGroup("購買", providers.buy)}
      </div>
    );
  };

  const PrimaryMovieCard = ({ m }: { m: MovieWithScore }) => {
    const awards = topAwards(m.festival_awards, 3);
    const [expanded, setExpanded] = useState(false);
    useEffect(() => {
      setExpanded(false);
    }, [m.id]);
    return (
      <motion.div
        className="primary-movie-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <img className="primary-poster" src={posterUrl(m)} alt={m.title} onError={handleImgError} />
        <div className="primary-info">
          {awards.length > 0 && (
            <div className="festival-row" role="list" aria-label="影展得獎紀錄">
              {awards.map((a) => (
                <FestivalBadge key={a.id} award={a} />
              ))}
            </div>
          )}
          <h3 className="primary-title">{m.title}</h3>
          {m.original_title && m.original_title !== m.title && <p className="primary-original">{m.original_title}</p>}
          {m.year > 0 && <span className="primary-year">{m.year}</span>}
          {m.overview && (
            <p
              className={`primary-overview ${expanded ? "is-expanded" : ""}`}
              onClick={() => setExpanded((v) => !v)}
              role="button"
              tabIndex={0}
              aria-expanded={expanded}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setExpanded((v) => !v);
                }
              }}
            >
              {m.overview}
            </p>
          )}
          <WatchProvidersPanel movie={m} />
        </div>
      </motion.div>
    );
  };

  const SecondaryMovieCard = ({ m, index }: { m: MovieWithScore; index: number }) => {
    const award = topAward(m.festival_awards);
    return (
      <motion.div
        className="secondary-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 + index * 0.07 }}
        whileHover={{ y: -5 }}
      >
        <div className="secondary-poster-wrap">
          <img className="secondary-poster" src={posterUrl(m)} alt={m.title} onError={handleImgError} />
        </div>
        {award && <FestivalBadge award={award} />}
        <p className="secondary-title">{m.title}</p>
        {m.year > 0 && <span className="secondary-year">{m.year}</span>}
      </motion.div>
    );
  };

  return (
    <div className="result-page">
      <video className="result-bg-video" src="ir.mp4" autoPlay muted loop playsInline />

      <TopNav />

      <div className="result-wrap">
        <article className="card">
          <div className="card-bg" />
          <div className="card-smoke" />
          <GrainCanvas />
          <div className="card-inner">
            <div className="card-col-left">
              <div className="card-label">Today&apos;s Mood</div>
              <h2 className="card-title">心情配電影</h2>
              <p className="card-sub">根據你選擇的心情，為你找到今晚的電影</p>
              <div className="result-side">
                {moodParam && tagNames.length > 0 ? (
                  <div className="mood-echo">
                    <p className="mood-echo-quote">
                      你說：「<span className="mood-echo-input">{moodParam}</span>」
                    </p>
                    <p className="mood-echo-tags">→ 我理解為 {tagNames.map((t) => `#${t}`).join(" ")}</p>
                  </div>
                ) : (
                  <h3 className="result-heading">{tagNames.length > 0 ? `根據你的心情：${tagNames.map((t) => `#${t}`).join(" ")}` : "今晚想看什麼？"}</h3>
                )}
                <div className="result-actions">
                  <motion.button
                    className="btn-primary"
                    onClick={() => setReloadKey((k) => k + 1)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                  >
                    再看一部
                  </motion.button>
                  <motion.button
                    className="more-btn"
                    onClick={() => navigate("/")}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                  >
                    重新選擇
                  </motion.button>
                </div>
              </div>
            </div>
            <div className="card-col-right">
              {loading && <SkeletonCard />}
              {!loading && error && (
                <div className="rec-error">
                  <p>無法載入今晚的推薦</p>
                  <button className="more-btn" onClick={() => setReloadKey((k) => k + 1)}>
                    重試
                  </button>
                </div>
              )}
              {!loading && !error && movies.length === 0 && (
                <div className="rec-error">
                  <p>找不到符合的電影，試試其他心情標籤吧</p>
                </div>
              )}
              {!loading && !error && movies.length > 0 && <PrimaryMovieCard m={movies[0]} />}
            </div>
          </div>
        </article>
      </div>

      {!loading && !error && movies.length > 1 && (
        <section className="recommendations">
          <div className="secondary-section">
            <p className="secondary-heading">你可能也喜歡</p>
            <div className="secondary-grid">
              {movies.slice(1, 5).map((m, i) => (
                <SecondaryMovieCard key={m.id} m={m} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
