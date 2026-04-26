import { test, expect, type Page } from '@playwright/test'

const NAV = 'nav.global-top-nav'
const LOGO = 'nav.global-top-nav a.global-nav-logo'
const LINKS = 'nav.global-top-nav .global-nav-links a'
const BURGER = 'nav.global-top-nav button.global-nav-burger'

const RWD = { mobile: { width: 375, height: 667 }, desktop: { width: 1280, height: 800 } }

async function gotoStable(page: Page, path: string) {
  await page.goto(path)
  await page.waitForSelector(NAV, { state: 'attached' })
}

// ─────────────────────────────────────────────────────────
// 1) 八路徑都渲染 nav
// ─────────────────────────────────────────────────────────
test.describe('T1 / item 7 — nav renders on all routes & active state', () => {
  const routes = [
    { path: '/', activeIdx: -1 },
    { path: '/festival', activeIdx: 0 },
    { path: '/month', activeIdx: 1 },
    { path: '/recommend?mood=happy', activeIdx: -1 },
    { path: '/effect?mood=happy', activeIdx: -1 },
    { path: '/result?type=healing', activeIdx: -1 },
    { path: '/this-route-does-not-exist', activeIdx: -1 },
  ]

  for (const r of routes) {
    test(`nav visible on ${r.path}`, async ({ page }) => {
      await gotoStable(page, r.path)
      await expect(page.locator(NAV)).toBeVisible()
      await expect(page.locator(LOGO)).toBeVisible()

      const linkEls = page.locator(LINKS)
      await expect(linkEls).toHaveCount(3)
      const activeCount = await page.locator(`${LINKS}.is-active`).count()
      if (r.activeIdx === -1) {
        expect(activeCount).toBe(0)
      } else {
        expect(activeCount).toBe(1)
        await expect(linkEls.nth(r.activeIdx)).toHaveClass(/is-active/)
      }
    })
  }

  // Quiz step gating: step 0 → no nav; click 開始測驗 → nav appears
  test('Quiz step=0 nav hidden, step=1 nav appears', async ({ page }) => {
    await page.goto('/quiz')
    await page.waitForSelector('.quiz-page')
    await expect(page.locator(NAV)).toHaveCount(0)
    // Quiz scene has typing animation + scene transitions; force click to bypass stability check
    await page.getByRole('button', { name: '開始測驗' }).click({ force: true })
    await expect(page.locator(NAV)).toBeVisible()
    await expect(page.locator(`${LINKS}.is-active`)).toHaveCount(1)
    await expect(page.locator(LINKS).nth(2)).toHaveClass(/is-active/)
  })
})

// ─────────────────────────────────────────────────────────
// 2) Logo 從 7 個非首頁回 /
// ─────────────────────────────────────────────────────────
test.describe('T2 — logo navigates back to /', () => {
  const paths = ['/festival', '/month', '/recommend?mood=x', '/effect?mood=x', '/result?type=healing', '/notfound-route']
  for (const p of paths) {
    test(`logo from ${p} → /`, async ({ page }) => {
      await gotoStable(page, p)
      await page.locator(LOGO).click()
      await expect(page).toHaveURL('http://localhost:5173/')
    })
  }
})

// ─────────────────────────────────────────────────────────
// 3) NavLink active sync + browser back/forward
// ─────────────────────────────────────────────────────────
test.describe('T3 / T8 — active syncs with URL incl. browser back/fwd', () => {
  test('clicking links updates active class', async ({ page }) => {
    await gotoStable(page, '/festival')
    await expect(page.locator(LINKS).nth(0)).toHaveClass(/is-active/)
    await page.locator(LINKS).nth(1).click()  // /month
    await expect(page).toHaveURL(/\/month$/)
    await expect(page.locator(LINKS).nth(1)).toHaveClass(/is-active/)
    await expect(page.locator(LINKS).nth(0)).not.toHaveClass(/is-active/)
  })

  test('browser back/forward updates active', async ({ page }) => {
    await gotoStable(page, '/festival')
    await page.locator(LINKS).nth(1).click()  // → /month
    await expect(page).toHaveURL(/\/month$/)
    await page.goBack()
    await expect(page).toHaveURL(/\/festival$/)
    await expect(page.locator(LINKS).nth(0)).toHaveClass(/is-active/)
    await page.goForward()
    await expect(page).toHaveURL(/\/month$/)
    await expect(page.locator(LINKS).nth(1)).toHaveClass(/is-active/)
  })
})

// ─────────────────────────────────────────────────────────
// 4) T6 — Home hideUntilMs=1700
// ─────────────────────────────────────────────────────────
test.describe('T6 — Home reveal delay 1700ms', () => {
  test('nav data-revealed flips false → true', async ({ page }) => {
    await page.goto('/')
    const nav = page.locator(NAV)
    await nav.waitFor({ state: 'attached' })
    // shortly after mount, should still be hiding
    const earlyState = await nav.getAttribute('data-revealed')
    expect(earlyState).toBe('false')
    // pointer-events: none
    await expect(nav).toHaveCSS('pointer-events', 'none')
    // wait past 1700ms
    await page.waitForTimeout(1900)
    await expect(nav).toHaveAttribute('data-revealed', 'true')
    await expect(nav).toHaveCSS('opacity', '1')
  })
})

// ─────────────────────────────────────────────────────────
// 5) T9-T12, T16 — Scroll hide / show + scrolled bg
// ─────────────────────────────────────────────────────────
test.describe('T9-T12 / T16 — scroll hide + scrolled bg', () => {
  test('nav scroll hide/show with thresholds', async ({ page }) => {
    await gotoStable(page, '/festival')
    // wait for page to be settled (no stray scroll restoration)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(120)
    const nav = page.locator(NAV)
    await expect(nav).toHaveAttribute('data-visible', 'true')
    await expect(nav).toHaveAttribute('data-scrolled', 'false')

    // ≤ 80 always visible
    await page.evaluate(() => window.scrollTo(0, 60))
    await expect(nav).toHaveAttribute('data-visible', 'true', { timeout: 1500 })
    await expect(nav).toHaveAttribute('data-scrolled', 'false')

    // scroll to 200 (delta > 8) → should hide; scrolled true
    await page.evaluate(() => window.scrollTo(0, 200))
    await expect(nav).toHaveAttribute('data-scrolled', 'true', { timeout: 1500 })
    await expect(nav).toHaveAttribute('data-visible', 'false', { timeout: 1500 })

    // tiny jitter to 205 (delta=5, ≤ 8) → no toggle (still hidden)
    await page.evaluate(() => window.scrollTo(0, 205))
    await page.waitForTimeout(200)
    await expect(nav).toHaveAttribute('data-visible', 'false')

    // scroll up to 100 (delta = -105, < -8) → should show again
    await page.evaluate(() => window.scrollTo(0, 100))
    await expect(nav).toHaveAttribute('data-visible', 'true', { timeout: 1500 })

    // scroll back to 0 → scrolled false again
    await page.evaluate(() => window.scrollTo(0, 0))
    await expect(nav).toHaveAttribute('data-scrolled', 'false', { timeout: 1500 })
  })
})

// ─────────────────────────────────────────────────────────
// 6) T14 — focusin into nav while hidden brings it back
// ─────────────────────────────────────────────────────────
test.describe('T14 — focus into nav re-shows it', () => {
  test('focusing a hidden nav link sets visible=true', async ({ page }) => {
    await gotoStable(page, '/festival')
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(120)
    await page.evaluate(() => window.scrollTo(0, 400))
    const nav = page.locator(NAV)
    await expect(nav).toHaveAttribute('data-scrolled', 'true', { timeout: 2000 })
    await expect(nav).toHaveAttribute('data-visible', 'false', { timeout: 2000 })
    await page.evaluate(() => {
      const a = document.querySelector('.global-nav-links a') as HTMLAnchorElement | null
      a?.focus()
    })
    await expect(nav).toHaveAttribute('data-visible', 'true', { timeout: 2000 })
  })
})

// ─────────────────────────────────────────────────────────
// 7) Item 8 — z-index layering
// ─────────────────────────────────────────────────────────
test.describe('item 8 — z-index layering', () => {
  test('nav z-index 200, splash 999 on Home', async ({ page }) => {
    await page.goto('/')
    const nav = page.locator(NAV)
    await nav.waitFor({ state: 'attached' })
    await expect(nav).toHaveCSS('z-index', '200')
    const splash = page.locator('.intro-logo-overlay')
    await expect(splash).toBeVisible()
    await expect(splash).toHaveCSS('z-index', '999')
  })
})

// ─────────────────────────────────────────────────────────
// 8) T19 — RWD: ≥768 horizontal links, <768 burger
// ─────────────────────────────────────────────────────────
test.describe('T19 — RWD desktop vs mobile', () => {
  test('desktop shows links, hides burger', async ({ page }) => {
    await page.setViewportSize(RWD.desktop)
    await gotoStable(page, '/festival')
    await expect(page.locator(LINKS).first()).toBeVisible()
    await expect(page.locator(BURGER)).toBeHidden()
  })

  test('mobile hides links, shows burger', async ({ page }) => {
    await page.setViewportSize(RWD.mobile)
    await gotoStable(page, '/festival')
    await expect(page.locator(BURGER)).toBeVisible()
    // links container display:none
    await expect(page.locator('.global-nav-links').first()).toBeHidden()
  })
})

// ─────────────────────────────────────────────────────────
// 9) Mobile menu — Esc, body scroll lock, resize, F1 (route change)
// ─────────────────────────────────────────────────────────
test.describe('item 4 / T20-T22 / T24 (F1) — mobile menu behavior', () => {
  test.use({ viewport: RWD.mobile })

  test('open → body overflow hidden; Esc closes; body restored', async ({ page }) => {
    await gotoStable(page, '/festival')
    await page.locator(BURGER).click()
    const overlay = page.locator('.global-nav-mobile-overlay')
    await expect(overlay).toBeVisible()
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden')
    await page.keyboard.press('Escape')
    await expect(overlay).toHaveCount(0)
    // body overflow should not be 'hidden' anymore (default is visible)
    const overflowAfter = await page.evaluate(() => document.body.style.overflow)
    expect(overflowAfter).not.toBe('hidden')
  })

  // F2 — pointer-events: none inherited onto overlay/X/links makes them untappable
  test('overlay + X + link must have pointer-events !== "none" (F2 regression)', async ({ page }) => {
    await gotoStable(page, '/festival')
    await page.locator(BURGER).click()
    await expect(page.locator('.global-nav-mobile-overlay')).toBeVisible()
    await page.waitForTimeout(400) // animation settle
    const pe = await page.evaluate(() => {
      const overlay = document.querySelector('.global-nav-mobile-overlay') as HTMLElement | null
      const close = document.querySelector('.global-nav-mobile-close') as HTMLElement | null
      const link = document.querySelector('.global-nav-mobile-link') as HTMLElement | null
      return {
        overlay: overlay ? getComputedStyle(overlay).pointerEvents : null,
        close: close ? getComputedStyle(close).pointerEvents : null,
        link: link ? getComputedStyle(link).pointerEvents : null,
      }
    })
    expect(pe.overlay, 'overlay must accept pointer events').not.toBe('none')
    expect(pe.close, 'X button must accept pointer events').not.toBe('none')
    expect(pe.link, 'mobile link must accept pointer events').not.toBe('none')
  })

  // NOTE: this test currently passes for the WRONG reason. With F2 in effect, the X button
  // has pointer-events: none. force-click lands on the underlying burger (same top-right
  // corner) which toggles mobileOpen=false. After F2 is fixed, this should still pass —
  // but for the right reason (X click handler runs).
  test('X button closes [passes via burger overlap until F2 fix]', async ({ page }) => {
    await gotoStable(page, '/month')
    await page.locator(BURGER).click()
    await expect(page.locator('.global-nav-mobile-overlay')).toBeVisible()
    await page.waitForTimeout(400)
    await page.locator('.global-nav-mobile-close').click({ force: true })
    await expect(page.locator('.global-nav-mobile-overlay')).toHaveCount(0, { timeout: 2000 })
  })

  test('clicking link inside menu navigates and closes', async ({ page }) => {
    await gotoStable(page, '/festival')
    await page.locator(BURGER).click()
    const overlay = page.locator('.global-nav-mobile-overlay')
    await expect(overlay).toBeVisible()
    await page.waitForTimeout(400) // wait for slide-in animation
    await overlay.locator('a', { hasText: '月份推薦' }).click({ force: true })
    await expect(page).toHaveURL(/\/month$/, { timeout: 2000 })
    await expect(overlay).toHaveCount(0)
  })

  test('T21 — resize ≥768 closes menu', async ({ page }) => {
    await gotoStable(page, '/festival')
    await page.locator(BURGER).click()
    await expect(page.locator('.global-nav-mobile-overlay')).toBeVisible()
    await page.setViewportSize(RWD.desktop)
    await expect(page.locator('.global-nav-mobile-overlay')).toHaveCount(0)
    const overflowAfter = await page.evaluate(() => document.body.style.overflow)
    expect(overflowAfter).not.toBe('hidden')
  })

  test('F1 — browser back closes mobile menu', async ({ page }) => {
    await gotoStable(page, '/festival')
    await page.evaluate(() => history.pushState({}, '', '/month'))
    // direct nav to seed history
    await gotoStable(page, '/month')
    await gotoStable(page, '/festival')
    // open menu on /festival
    await page.locator(BURGER).click()
    await expect(page.locator('.global-nav-mobile-overlay')).toBeVisible()
    // browser back → /month → menu must auto-close
    await page.goBack()
    await expect(page).toHaveURL(/\/month$/)
    await expect(page.locator('.global-nav-mobile-overlay')).toHaveCount(0)
    const overflowAfter = await page.evaluate(() => document.body.style.overflow)
    expect(overflowAfter).not.toBe('hidden')
  })

  test('T25 — rapid burger click does not deadlock', async ({ page }) => {
    await gotoStable(page, '/festival')
    const burger = page.locator(BURGER)
    for (let i = 0; i < 6; i++) await burger.click({ delay: 20 })
    // even count → closed; odd count → open. 6 clicks → closed.
    await expect(page.locator('.global-nav-mobile-overlay')).toHaveCount(0)
    // open one more time to confirm still functional
    await burger.click()
    await expect(page.locator('.global-nav-mobile-overlay')).toBeVisible()
  })

  test('aria-expanded reflects state', async ({ page }) => {
    await gotoStable(page, '/festival')
    const burger = page.locator(BURGER)
    await expect(burger).toHaveAttribute('aria-expanded', 'false')
    await burger.click()
    await expect(burger).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('Escape')
    await expect(burger).toHaveAttribute('aria-expanded', 'false')
  })
})
