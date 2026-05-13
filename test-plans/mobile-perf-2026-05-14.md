# Mobile Performance Patch — Manual Test Plan (2026-05-14)

## Patch scope
CSS-only changes in 5 files (no JS / TSX touched):
- `src/pages/QuizResult.css`
- `src/pages/Result.css`
- `src/pages/Quiz.css`
- `src/pages/Home.css`
- `src/pages/NotFound.css`

Goal: stop iPhone heat-up by killing on mobile (max-width 767px):
- fullscreen `<video>` background blur decode
- backdrop-filter on search bar, options, modal, featured card
- ::before/::after smoke blobs (`blur(40-55px)` + infinite animations)
- title flicker / glow / floaty / twinkle / softGlow / logoFlicker

Also adds `prefers-reduced-motion: reduce` honor block to all 5 files.

---

## 0. Pre-flight (already done by QA)
- [x] `npm run build` — 0 errors, CSS bundle 77.86 kB (gzip 14.80 kB)
- [x] Brace balance verified in all 5 files
- [x] One `@media (max-width: 767px)` block per file (no duplicate-guard risk)
- [x] All selectors referenced by mobile guard exist in matching `.tsx`

---

## 1. Device matrix

| Device | Viewport | Notes |
|---|---|---|
| iPhone (真機) | actual hardware | required for thermal test |
| Chrome DevTools — Pixel 7 | 412 x 915 | quick layout regression |
| Chrome DevTools — iPhone 14 Pro | 393 x 852 | iOS Safari sanity |
| Desktop | 1440 x 900 | regression: smoke/blur/video must still play |

---

## 2. Golden path (all devices)

Walk through:
1. `/` (Home)
2. type or pick a tag in search → land on Quiz
3. `/quiz` — answer all questions
4. `/effect?mood=...` — transition page
5. `/quiz-result?type=a` — typology card result
6. `/result?type=a` — movie recommendation result
7. force `/notfound-typo-url` to land on `NotFound`

---

## 3. Per-page mobile checklist (≤ 767px)

### Home `/`
- [ ] Background `2.1.mp4` (hero-bg) is NOT visible — instead solid `#1a1818`
- [ ] Search bar has no glassmorphism blur; solid `rgba(0,0,0,0.55)` background
- [ ] Mood tags do NOT bob up/down (floaty animation off)
- [ ] Site logo image does NOT flicker (only initial drop-in)
- [ ] "影展推薦" / "年度推薦" yellow title dot — no twinkle/softGlow
- [ ] `.favorites-card` smoke blobs — still visible as static gradients, but no blur and no animation
- [ ] `.poster-showcase--festival/--yearly` smoke blobs — same: static, no blur
- [ ] Tap a poster → synopsis modal opens; backdrop is solid `rgba(10,10,14,0.92)`, NOT blurred
- [ ] Marquee bar at top is `display: none` (existing behavior)

### Quiz `/quiz`
- [ ] Background `ir.mp4` is NOT visible — instead solid `#1a1818`
- [ ] Quiz card does NOT float (no cardFloat 7s loop)
- [ ] Card inner smoke blobs — static, no blur, no animation
- [ ] `.scene-title` (intro 標題) does NOT glow-pulse; static text-shadow only
- [ ] `.quiz-option` and `.scene-option` buttons — no backdrop-filter; solid `rgba(0,0,0,0.55)`
- [ ] Typing cursor "|" still blinks (intentionally kept — cheap animation)
- [ ] Option scene fade-in / fade-out still works
- [ ] Progress bar fill animates as before

### Effect `/effect?mood=xxx`
- Not in patch scope — note that `Effect.css` was NOT modified. Confirm page still works as-is. If still hot, flag for next round.

### QuizResult `/quiz-result?type=a`
- [ ] Background `ir.mp4` is NOT visible — solid `#1a1818`
- [ ] Card smoke blobs — static, no blur, no animation
- [ ] `.qr-title` — no flicker; static text-shadow
- [ ] Card header / desc / movie section fade-in animations still play (one-shot, OK to keep)
- [ ] Companion cards render with their static `rgba(28,18,12,0.55)` background
- [ ] Share button still has shadow; not animated
- [ ] Skeleton shimmer still animates (intentional — only when loading)
- [ ] `.qrs-*` story-export selector at `left:-99999px` — NOT visible. (Story is offscreen unless `?preview=story` or html2canvas runs.)
- [ ] If you append `?preview=story` to the URL on desktop, the story preview should still show full smoke (not suppressed) — confirms QA note #2 in handoff

### Result `/result?type=a`
- [ ] Background `ir.mp4` is NOT visible — solid `#1a1818`
- [ ] `.card` plays one-shot `fadeUpIn` entry (NOT removed)
- [ ] Card smoke blobs static, no blur, no animation
- [ ] `.card-title` — no flicker; static text-shadow
- [ ] `.featured-movie` — no backdrop-filter; solid `rgba(12,9,5,0.9)`
- [ ] Secondary grid posters render at 2-col (or 1-col under 399px)
- [ ] Skeleton shimmer animates (intentional)

### NotFound `/whatever-404`
- [ ] Background `ir.mp4` is NOT visible — solid `#1a1818`
- [ ] Page label / title / button render correctly against solid bg
- [ ] Contrast OK: yellow `#f7d25c` on `#1a1818` should still pass WCAG AA for the 0.6-alpha label

---

## 4. Desktop regression (≥ 1440px)

Walk the same path. Expected:
- [ ] All `<video>` backgrounds play with blur
- [ ] Search bar still glass-morph (backdrop-filter blur 28px)
- [ ] All smoke ::before/::after blobs blurred + infinite animations running
- [ ] Card titles flicker (Result, QuizResult)
- [ ] Logo flickers on Home
- [ ] Title dot twinkles + softGlows
- [ ] Mood tags bob (floaty)
- [ ] Synopsis modal has blurred backdrop
- [ ] Featured movie has backdrop-filter blur(8px)

If ANY of the above is missing on desktop, the mobile guard leaked.

---

## 5. Reduced-motion test (any device)

1. macOS: 系統偏好 → 輔助使用 → 顯示 → 勾「減少動態效果」
   Or iOS: 設定 → 輔助使用 → 動態效果 → 開「減少動態效果」
2. Reload each page. Expected:
   - All `infinite` smoke animations stopped (Home, Quiz, QuizResult, Result)
   - Title flicker/glow stopped
   - Floaty / twinkle / softGlow stopped
   - Marquee on Home stopped
   - Skeleton shimmer stopped (Result/QuizResult — covered in reduced-motion blocks)
   - One-shot entry animations (fadeUpIn) — still play once (acceptable; or stop if covered)
3. NotFound has no reduced-motion block (it has no animations to begin with) — OK.

---

## 6. Thermal test (iPhone real device only)

1. Open `/quiz-result?type=a` on iPhone Safari
2. Keep the screen on, app foregrounded, for **5 minutes**
3. Expected: device handfeel does NOT heat up noticeably (compared to pre-patch which would heat after ~2-3 min)
4. Repeat for `/` (Home) — same expectation

---

## 7. PageSpeed Mobile (post-deploy)

After patch hits production `https://mmoodvie.live`:
- [ ] Run PageSpeed Insights — Mobile
- [ ] Target: **TBT (Total Blocking Time) < 300ms**
- [ ] Target: CLS unchanged
- [ ] Target: LCP unchanged or better (video removed on mobile may even improve)

---

## 8. Known non-coverage

- `Effect.css`, `Festival.css`, `Month.css`, `TopNav.css` — NOT patched. If real-device still warm after this rollout, schedule a follow-up.
- `.qrs-*` story selectors with `blur(120px)` — intentionally untouched (offscreen export-only).
- `.hero-bg` has `heroFocusIn` keyframe with `blur(...)` filter still defined. On mobile it's `display:none` so does not paint. Verified.
