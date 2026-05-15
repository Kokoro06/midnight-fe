import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import { useLenis } from "lenis/react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { readItems } from "@directus/sdk";
import GrainCanvas from "../components/GrainCanvas";
import GravityTags from "../components/GravityTags";
import TopNav from "../components/TopNav";
import { directus } from "../lib/directus";
import { track, truncateMoodText } from "../lib/analytics";
import "./Home.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface Film {
  title: string;
  poster: string;
  synopsis: string;
  meta: string;
}

interface FavoritesCardProps {
  films: Film[];
  posterId: string;
  onMore: () => void;
}

const MOOD_TAGS: string[] = [
  "想談戀愛",
  "靜靜看就好",
  "需要被療癒",
  "暖暖的就好",
  "驚悚",
  "懸疑",
  "喜劇",
  "科幻",
  "動作",
  "酷兒",
  "犯罪",
  "這世界很荒謬",
  "文藝",
  "好想哭",
  "越燒越好",
  "有點寂寞",
  "奇幻",
  "世界毀了也無所謂",
  "戰爭",
  "心動的感覺",
  "躺著看就好",
  "想念那時候",
  "劇情",
  "公路電影",
  "紀錄片",
  "想看點怪的",
];

const MOOD_TAG_MAP: Record<string, string[]> = {
  想談戀愛: ["愛情", "浪漫"],
  靜靜看就好: ["放鬆", "平靜"],
  需要被療癒: ["療癒", "溫馨"],
  暖暖的就好: ["溫馨", "放鬆"],
  驚悚: ["驚悚"],
  懸疑: ["懸疑", "燒腦"],
  喜劇: ["喜劇", "放鬆"],
  科幻: ["科幻"],
  動作: ["動作"],
  酷兒: ["LGBTQ"],
  犯罪: ["犯罪"],
  這世界很荒謬: ["諷刺", "喜劇"],
  文藝: ["文藝", "劇情"],
  好想哭: ["憂鬱", "劇情"],
  越燒越好: ["燒腦", "懸疑"],
  有點寂寞: ["寂寞"],
  奇幻: ["奇幻"],
  世界毀了也無所謂: ["末日", "科幻"],
  戰爭: ["戰爭"],
  心動的感覺: ["浪漫", "愛情"],
  躺著看就好: ["放鬆", "療癒"],
  想念那時候: ["寂寞", "憂鬱"],
  劇情: ["劇情"],
  公路電影: ["公路電影"],
  紀錄片: ["紀錄片"],
  想看點怪的: ["邪典", "驚悚"],
};

// 反向對應：Directus tag → 找出最能代表它的 MOOD_TAGS
function mapToMoodTags(directusTags: string[]): string[] {
  const scores: Record<string, number> = {};
  for (const dt of directusTags) {
    for (const [moodTag, dts] of Object.entries(MOOD_TAG_MAP)) {
      if (dts.includes(dt)) scores[moodTag] = (scores[moodTag] ?? 0) + 1;
    }
  }
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag]) => tag);
}

const MOOD_MAPPER_URL = import.meta.env.VITE_MOOD_MAPPER_URL ?? "/api/mood";

const FESTIVAL_FILMS: Film[] = [
  {
    title: "《末路相縫》 Sew Torn",
    poster: "img/poster5.jpg",
    meta: "美國、瑞士 USA、Switzerland｜2024｜100min｜佛萊迪麥可唐納德",
    synopsis: "經營慘澹的裁縫店繼承人，意外撞見兩名重傷男子與滿袋現金。她一時起貪念想藉此翻身，卻捲入殺手追殺與一連串失控事件，陷入良知與慾望的生死抉擇。",
  },
  {
    title: "《太空百合戰鬥姬》 Lesbian Space Princess",
    poster: "img/poster8.jpg",
    meta: "澳洲 Australia｜2025｜87min｜艾瑪赫夫霍布斯",
    synopsis: "失意的外星公主為了拯救被擄走的薄情前任，不得不覺醒體內的皇族神器。她深入險境展開一場宇宙大對決，在混亂與激戰中展現無敵女力。",
  },
  {
    title: "《錄影帶謀殺案》 Videodrome",
    poster: "img/poster7.jpg",
    meta: "加拿大 Canada｜1983｜87min｜大衛柯能堡",
    synopsis:
      "電視台老闆意外截獲一段充滿暴力虐殺的神祕頻段，不僅與女友陷入病態的迷戀，更導致身體產生詭異變異。隨著幻覺與現實模糊，他漸漸落入難以挽回的感官陷阱。",
  },
  {
    title: "《輕鬆生活》 Easy Living",
    poster: "img/poster6.jpg",
    meta: "美國 USA｜1937｜88min｜米契爾萊森",
    synopsis:
      "富有的銀行家一氣之下扔掉妻子昂貴的貂皮大衣，從天而降在一個女職員身上，導致每個人都誤以為她是富商的情婦，忙著討好巴結。隨之而來的誤會，讓劇情瘋狂超展開，推向意想不到的結局。",
  },
];

const YEARLY_FILMS: Film[] = [
  {
    title: "《青春末世物語》 Happyend",
    poster: "img/poster1.jpg",
    meta: "日本 Japan｜2025｜113min｜空音央",
    synopsis:
      "在壓抑的東京校園，兩名叛逆高中生以音樂與惡作劇對抗體制。一場校方發起的監控反擊，卻意外引發學生思潮的動盪，讓兩人的友誼與未來在畢業前夕瀕臨失控。",
  },
  {
    title: "《一百公尺》 100 Meters",
    poster: "img/poster2.jpg",
    meta: "日本 Japan｜2025｜106min｜岩井澤健治",
    synopsis:
      "兩名少年因田徑結緣，在追求速度的賽道上發展出亦敵亦友的深厚羈絆。多年後，當天才跑者陷入恐懼巔峰，昔日的同伴已蛻變為強大對手，再度於百米起點重逢。",
  },
  {
    title: "《長椅小情歌》 At the Bench",
    poster: "img/poster4.jpg",
    meta: "日本 Japan｜2025｜86min｜奧山由之",
    synopsis: "河畔公園的一張長椅，靜靜見證了青梅竹馬的重逢、情侶的爭吵與姊妹的離合。透過各色人物的來去，在日常瑣事中勾勒出歲月流轉下的百味人生。",
  },
  {
    title: "《我家的事》 Family Matters",
    poster: "img/poster3.jpg",
    meta: "台灣 Taiwan｜2025｜99min｜潘客印",
    synopsis:
      "橫跨台灣鄉間一年四季，透過一家四口各自的祕密與困境，細膩編織出平凡家庭的悲歡離合。當微光照進幽暗，那些隱藏在歡笑後的徬徨，終將化作動人的時光畫像。",
  },
];

function PosterShowcase({ films, variant, onPosterClick }: { films: Film[]; variant: "festival" | "yearly"; onPosterClick: (f: Film) => void }) {
  return (
    <div className={`poster-showcase poster-showcase--${variant}`}>
      <div className="fav-smoke" />
      <GrainCanvas className="fav-grain" />
      <div className="festival-posters">
        {films.map((f, i) => (
          <button key={f.title} type="button" className={`fp-item fp-item--${i}`} onClick={() => onPosterClick(f)} aria-label={`查看 ${f.title} 簡介`}>
            <div className="fp-img" style={{ backgroundImage: `url(${f.poster})` }} />
            <p className="fp-title">{f.title}</p>
            <p className="fp-meta">{f.meta}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function SynopsisModal({ film, onClose }: { film: Film | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {film && (
        <motion.div
          className="synopsis-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          onClick={onClose}
        >
          <motion.div
            className="synopsis-modal"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`${film.title} 簡介`}
          >
            <button type="button" className="synopsis-close" onClick={onClose} aria-label="關閉">
              ×
            </button>
            <div className="synopsis-poster" style={{ backgroundImage: `url(${film.poster})` }} />
            <div className="synopsis-body">
              <h3 className="synopsis-title">{film.title}</h3>
              <p className="synopsis-meta">{film.meta}</p>
              <p className="synopsis-text">{film.synopsis}</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FavoritesCard({ films, posterId, onMore }: FavoritesCardProps) {
  const posterRef = useRef<HTMLDivElement>(null);

  const handleEnter = (poster: string) => {
    const el = posterRef.current;
    if (!el) return;
    el.style.backgroundImage = `url(${poster})`;
    el.classList.add("has-image");
  };

  const handleLeave = () => {
    const el = posterRef.current;
    if (!el) return;
    el.classList.remove("has-image");
    el.style.backgroundImage = "";
  };

  return (
    <div className="favorites-card">
      <div className="fav-smoke" />
      <GrainCanvas className="fav-grain" />
      <div className="favorites-list">
        <ul onMouseLeave={handleLeave}>
          {films.map((f) => (
            <li key={f.title} data-poster={f.poster} onMouseEnter={() => handleEnter(f.poster)}>
              {f.title}
            </li>
          ))}
        </ul>
        <div className="more-btn-wrap">
          <button className="btn-slot" onClick={onMore}>
            <div className="btn-marquee">
              <span>MORE</span>
              <span className="arrow">→</span>
              <span>MORE</span>
            </div>
          </button>
        </div>
      </div>
      <div className="favorites-poster-float" id={posterId} ref={posterRef} />
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mood, setMood] = useState<string>(() => searchParams.get("tag") ?? "");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>(MOOD_TAGS);
  const [tagsFromDirectus, setTagsFromDirectus] = useState(false);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [mappingLoading, setMappingLoading] = useState(false);
  const [mappingError, setMappingError] = useState<string | null>(null);
  const [pendingMood, setPendingMood] = useState<string>("");
  const [pendingDirectusTags, setPendingDirectusTags] = useState<string[]>([]);
  const [reducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [showOverlay, setShowOverlay] = useState<boolean>(true);
  const [modalFilm, setModalFilm] = useState<Film | null>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  useEffect(() => {
    if (!modalFilm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalFilm(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalFilm]);

  useLenis(({ scroll }) => {
    const hint = scrollHintRef.current;
    if (!hint) return;
    if (scroll > 80) hint.classList.add("is-hidden");
    else hint.classList.remove("is-hidden");
  });

  useEffect(() => {
    document.title = "Midnight Moodvie — 今晚想看什麼？";
    const t = setTimeout(() => setShowOverlay(false), 1700);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = (await directus.request(readItems("tags", { fields: ["name"], sort: ["name"], limit: -1 }))) as Array<{ name: string }>;
        if (cancelled) return;
        const names = result.map((t) => t.name).filter(Boolean);
        if (names.length > 0) {
          setAvailableTags(names);
          setTagsFromDirectus(true);
        }
      } catch {
        // Directus 不可用時保留 MOOD_TAGS fallback
      } finally {
        if (!cancelled) setTagsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── GSAP scroll animations ──────────────────────────────────────────────
  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // 每個 favorites section 整體淡入 + 上移
    gsap.utils.toArray<HTMLElement>(".favorites").forEach((section) => {
      gsap.from(section, {
        opacity: 0,
        y: 60,
        duration: 0.9,
        ease: "power2.out",
        scrollTrigger: { trigger: section, start: "top 85%" },
      });
    });

    // year 數字浮現
    gsap.utils.toArray<HTMLElement>(".favorites-year").forEach((el) => {
      gsap.from(el, {
        opacity: 0,
        y: 26,
        duration: 1.2,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 85%" },
      });
    });

    // 卡片延遲淡入
    gsap.utils.toArray<HTMLElement>(".poster-showcase").forEach((card) => {
      gsap.from(card, {
        opacity: 0,
        y: 24,
        duration: 0.9,
        ease: "power2.out",
        delay: 0.3,
        scrollTrigger: { trigger: card, start: "top 82%" },
      });
    });

    // typing text — GSAP counter 取代 setInterval
    gsap.utils.toArray<HTMLElement>(".favorites-sub").forEach((sub) => {
      const span = sub.querySelector<HTMLElement>(".typing-text");
      if (!span) return;
      const fullText = span.getAttribute("data-text") ?? "";
      let tween: gsap.core.Tween | null = null;

      ScrollTrigger.create({
        trigger: sub,
        start: "top 85%",
        once: true,
        onEnter() {
          tween?.kill();
          span.textContent = "";
          const obj = { n: 0 };
          tween = gsap.to(obj, {
            n: fullText.length,
            duration: fullText.length * 0.08,
            ease: "none",
            onUpdate() {
              span.textContent = fullText.slice(0, Math.round(obj.n));
            },
          });
        },
      });
    });
  });

  const addTag = (tag: string) => {
    // 使用者手動點選 → 清除 mood-mapper 的暫存結果
    setPendingDirectusTags([]);
    setPendingMood("");
    setMappingError(null);
    setSelectedTags((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      if (prev.length >= 3) return prev;
      return [...prev, tag];
    });
  };

  const goResult = async () => {
    const trimmed = mood.trim();
    if (!trimmed || mappingLoading) return;
    setMappingLoading(true);
    setMappingError(null);
    const startedAt = performance.now();
    try {
      const res = await fetch(MOOD_MAPPER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "分析失敗");
      }
      const { tags } = await res.json();
      if (!Array.isArray(tags) || tags.length === 0) throw new Error("無法識別心情標籤");
      track("mood_input_submitted", {
        mood_text: truncateMoodText(trimmed),
        mood_text_length: trimmed.length,
        tags_returned: tags,
        mapper_latency_ms: Math.round(performance.now() - startedAt),
      });
      navigate(`/result?tags=${tags.map(encodeURIComponent).join(",")}&mood=${encodeURIComponent(trimmed)}`);
    } catch (err) {
      setMappingError("無法分析心情，請試試直接選 tag");
      track("mood_input_failed", {
        mood_text_length: trimmed.length,
        error_message: err instanceof Error ? err.message : "unknown",
        mapper_latency_ms: Math.round(performance.now() - startedAt),
      });
    } finally {
      setMappingLoading(false);
    }
  };

  const goTagResult = () => {
    let directusTags: string[];
    let moodParam = "";

    if (pendingDirectusTags.length > 0) {
      directusTags = pendingDirectusTags;
      moodParam = `&mood=${encodeURIComponent(pendingMood)}`;
    } else if (tagsFromDirectus) {
      directusTags = selectedTags;
    } else {
      directusTags = [...new Set(selectedTags.flatMap((t) => MOOD_TAG_MAP[t] ?? []))];
    }

    if (directusTags.length === 0) return;
    track("tags_submitted", {
      tags: directusTags,
      selected_count: selectedTags.length,
    });
    navigate(`/result?tags=${directusTags.map(encodeURIComponent).join(",")}${moodParam}`);
  };

  const MARQUEE_TEXT = "感恩的心！5月15日歡迎投觀眾票選幫我衝一下人氣..＞＿＜..!!✦✦在午夜裡✶讓電影成為心的放映～✶金馬經典影展要開展啦～～你今天過得還好嗎？";

  return (
    <>
      <div className="marquee-bar" aria-hidden="true">
        <div className="marquee-track">
          <span>{MARQUEE_TEXT}</span>
          <span>{MARQUEE_TEXT}</span>
        </div>
      </div>

      {showOverlay && (
        <div className="intro-logo-overlay">
          <img src="/img/mm-logo-w.svg" alt="Midnight Moodvie" />
        </div>
      )}

      <TopNav hideUntilMs={1700} />

      <div className="hero">
        <video className="hero-bg" src="2.1.mp4" autoPlay muted loop playsInline />
        <div className="hero-overlay" />

        <main className="mood-search">
          <h1 className="site-title">
            <img src="/img/mm-logo-w.svg" alt="FEEL REEL" />
          </h1>

          <div className="search-bar">
            <div className="search-input-wrap">
              {selectedTags.map((tag) => (
                <button key={tag} className="input-tag-pill" onClick={() => addTag(tag)}>
                  {tag} <span aria-hidden="true">×</span>
                </button>
              ))}
              <input
                id="mood-input"
                type="text"
                placeholder={selectedTags.length > 0 ? "" : "今天的心情如何？"}
                value={mood}
                onChange={(e) => {
                  setMood(e.target.value);
                  setMappingError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") selectedTags.length > 0 ? goTagResult() : goResult();
                }}
                disabled={mappingLoading}
              />
              <button
                className="clear-btn"
                aria-label="清除輸入"
                onClick={() => {
                  setMood("");
                  setMappingError(null);
                  setSelectedTags([]);
                  setPendingDirectusTags([]);
                  setPendingMood("");
                }}
              >
                ✕
              </button>
            </div>
            <button
              id="search-btn"
              onClick={selectedTags.length > 0 ? goTagResult : goResult}
              disabled={mappingLoading || (selectedTags.length === 0 && !mood.trim())}
              className={[mappingLoading ? "is-loading" : "", selectedTags.length > 0 ? "is-tag-mode" : ""].filter(Boolean).join(" ")}
            >
              {mappingLoading ? <span className="btn-spinner" aria-hidden="true" /> : selectedTags.length > 0 ? "看電影推薦 →" : "送出"}
            </button>
          </div>
          {mappingError && <p className="mood-error">{mappingError}</p>}
          {!mappingError && <p className="search-hint">輸入心情關鍵字或點選下方標籤，快速找到今晚的電影</p>}

          {tagsLoading ? (
            <div className="tags-loading" aria-busy="true" aria-label="載入心情標籤中" />
          ) : reducedMotion ? (
            <div className="mood-tags">
              {availableTags.map((tag, i) => (
                <button
                  key={tag}
                  className={`tag${selectedTags.includes(tag) ? " tag--selected" : ""}${selectedTags.length >= 3 && !selectedTags.includes(tag) ? " tag--dimmed" : ""}`}
                  style={{ animationDelay: `${i * 0.1}s` }}
                  onClick={() => addTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          ) : (
            <GravityTags tags={availableTags} onTagClick={addTag} selectedTags={selectedTags} maxTags={3} />
          )}
        </main>

        <div className="scroll-down-hint" ref={scrollHintRef} aria-hidden="true">
          <span className="scroll-down-hint__label">SCROLL</span>
          <div className="scroll-down-hint__track">
            <div className="scroll-down-hint__pearl" />
          </div>
        </div>
      </div>

      <section id="festival" className="block favorites favorites-festival">
        <div className="favorites-inner">
          <div className="favorites-text">
            <p className="favorites-year">2025</p>
            <h2 className="favorites-title">
              <span className="title-dot">影展推薦</span>
            </h2>
            <p className="favorites-sub">
              <span className="typing-text" data-text="FESTIVAL PICKS">
                FESTIVAL PICKS
              </span>
            </p>
            <div className="more-btn-wrap text-more">
              <button className="btn-slot" onClick={() => navigate("/festival")}>
                <div className="btn-marquee">
                  <span>MORE</span>
                  <span className="arrow">→</span>
                  <span>MORE</span>
                </div>
              </button>
            </div>
          </div>
          <PosterShowcase films={FESTIVAL_FILMS} variant="festival" onPosterClick={setModalFilm} />
        </div>
      </section>

      <section id="yearly" className="block favorites favorites-yearly">
        <div className="favorites-inner">
          <div className="favorites-text">
            <p className="favorites-year">2025</p>
            <h2 className="favorites-title">
              <span className="title-dot">年度推薦</span>
            </h2>
            <p className="favorites-sub">
              <span className="typing-text" data-text="BEST OF 2025">
                BEST OF 2025
              </span>
            </p>
            <div className="more-btn-wrap text-more">
              <button className="btn-slot" onClick={() => navigate("/month")}>
                <div className="btn-marquee">
                  <span>MORE</span>
                  <span className="arrow">→</span>
                  <span>MORE</span>
                </div>
              </button>
            </div>
          </div>
          <PosterShowcase films={YEARLY_FILMS} variant="yearly" onPosterClick={setModalFilm} />
        </div>
      </section>

      <SynopsisModal film={modalFilm} onClose={() => setModalFilm(null)} />
    </>
  );
}
