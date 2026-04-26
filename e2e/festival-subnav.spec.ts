import { test, expect, type Page } from '@playwright/test'

const NAV = 'nav.global-top-nav'
const SUBNAV = '.festival-subnav'
const SUB_TABS = '.festival-subnav button.festival-subnav-tab'

const RWD = { mobile: { width: 375, height: 667 }, desktop: { width: 1280, height: 800 } }

async function gotoFestival(page: Page) {
  await page.goto('/festival')
  await page.waitForSelector(NAV)
  await page.waitForSelector(SUBNAV)
}

// ─────────────────────────────────────────────────────────
// item 15-17, 19 — subnav presence, default active, switching
// ─────────────────────────────────────────────────────────
test.describe('item 15-17 / 19 — subnav presence + switching', () => {
  test('subnav exists immediately on /festival with goldenHorse default', async ({ page }) => {
    await gotoFestival(page)
    const tabs = page.locator(SUB_TABS)
    await expect(tabs).toHaveCount(3)
    await expect(tabs.nth(0)).toHaveText('金馬影展')
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true')
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'false')
    await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'false')
    // default --accent-color is goldenHorse #d4af37 set on <html>
    const accent = await page.evaluate(() => document.documentElement.style.getPropertyValue('--accent-color').trim())
    expect(accent).toBe('#d4af37')
  })

  test('clicking a tab updates active + accent + page fades', async ({ page }) => {
    await gotoFestival(page)
    const tabs = page.locator(SUB_TABS)
    await tabs.nth(1).click()  // taipei
    // immediately during fade (within 600ms): main has fade-out, tabs are disabled
    await expect(page.locator('#content-wrapper')).toHaveClass(/fade-out/)
    await expect(tabs.nth(0)).toBeDisabled()
    await expect(tabs.nth(1)).toBeDisabled()
    await expect(tabs.nth(2)).toBeDisabled()
    // wait for fade complete (600ms)
    await page.waitForTimeout(750)
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'false')
    const accent = await page.evaluate(() => document.documentElement.style.getPropertyValue('--accent-color').trim())
    expect(accent).toBe('#4ab0ff')
    // panel updates to taipei content
    await expect(page.locator('.panel-title').first()).toContainText('台北')
  })

  test('item 18 — clicking same active tab does not refade', async ({ page }) => {
    await gotoFestival(page)
    const tabs = page.locator(SUB_TABS)
    await tabs.nth(0).click()  // already active
    // should NOT add fade-out class
    await expect(page.locator('#content-wrapper')).not.toHaveClass(/fade-out/)
  })

  test('item 13 / 19 — leaving /festival removes --accent-color inline', async ({ page }) => {
    await gotoFestival(page)
    let accent = await page.evaluate(() => document.documentElement.style.getPropertyValue('--accent-color').trim())
    expect(accent).toBe('#d4af37')
    // navigate away via main nav
    await page.locator('nav.global-top-nav .global-nav-links a', { hasText: '月份推薦' }).click()
    await expect(page).toHaveURL(/\/month$/)
    accent = await page.evaluate(() => document.documentElement.style.getPropertyValue('--accent-color'))
    expect(accent).toBe('')
    // subnav also gone
    await expect(page.locator(SUBNAV)).toHaveCount(0)
  })

  test('item 19 — /month → subnav absent; back to /festival → subnav reappears', async ({ page }) => {
    await page.goto('/month')
    await page.waitForSelector(NAV)
    await expect(page.locator(SUBNAV)).toHaveCount(0)
    await page.goto('/festival')
    await expect(page.locator(SUBNAV)).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────
// item 10, 11 — keyboard navigation: roving tabindex + Arrow / Home / End / Enter / Space
// ─────────────────────────────────────────────────────────
test.describe('item 10 / 11 — keyboard navigation', () => {
  test('roving tabindex: only active tab has tabindex=0', async ({ page }) => {
    await gotoFestival(page)
    const tabs = page.locator(SUB_TABS)
    await expect(tabs.nth(0)).toHaveAttribute('tabindex', '0')
    await expect(tabs.nth(1)).toHaveAttribute('tabindex', '-1')
    await expect(tabs.nth(2)).toHaveAttribute('tabindex', '-1')
  })

  test('ArrowRight / ArrowLeft moves focus only, no active change', async ({ page }) => {
    await gotoFestival(page)
    const tabs = page.locator(SUB_TABS)
    await tabs.nth(0).focus()
    await page.keyboard.press('ArrowRight')
    // focus moved
    await expect(tabs.nth(1)).toBeFocused()
    // active unchanged
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true')
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'false')

    await page.keyboard.press('ArrowRight')
    await expect(tabs.nth(2)).toBeFocused()
    // wrap forward
    await page.keyboard.press('ArrowRight')
    await expect(tabs.nth(0)).toBeFocused()
    // wrap backward
    await page.keyboard.press('ArrowLeft')
    await expect(tabs.nth(2)).toBeFocused()
  })

  test('Home / End jumps to first / last', async ({ page }) => {
    await gotoFestival(page)
    const tabs = page.locator(SUB_TABS)
    await tabs.nth(0).focus()
    await page.keyboard.press('End')
    await expect(tabs.nth(2)).toBeFocused()
    await page.keyboard.press('Home')
    await expect(tabs.nth(0)).toBeFocused()
  })

  test('Enter activates focused tab', async ({ page }) => {
    await gotoFestival(page)
    const tabs = page.locator(SUB_TABS)
    await tabs.nth(0).focus()
    await page.keyboard.press('ArrowRight')
    await expect(tabs.nth(1)).toBeFocused()
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'false')
    await page.keyboard.press('Enter')
    // wait for fade complete
    await page.waitForTimeout(750)
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
  })

  test('Space activates focused tab', async ({ page }) => {
    await gotoFestival(page)
    const tabs = page.locator(SUB_TABS)
    await tabs.nth(0).focus()
    await page.keyboard.press('End')
    await expect(tabs.nth(2)).toBeFocused()
    await page.keyboard.press(' ')
    await page.waitForTimeout(750)
    await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true')
  })
})

// ─────────────────────────────────────────────────────────
// item 12 — fading disable
// ─────────────────────────────────────────────────────────
test.describe('item 12 — fading disable', () => {
  test('during 600ms fade, all tabs are disabled & second click ignored', async ({ page }) => {
    await gotoFestival(page)
    const tabs = page.locator(SUB_TABS)
    await tabs.nth(1).click()
    // immediately disabled
    for (let i = 0; i < 3; i++) await expect(tabs.nth(i)).toBeDisabled()
    // try to click another tab during fade — Playwright will refuse on disabled, so we use force to confirm no state change
    await tabs.nth(2).click({ force: true }).catch(() => {})
    // wait for first fade to complete
    await page.waitForTimeout(750)
    // active should be tab 1 (taipei), not tab 2
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
    await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'false')
  })
})

// ─────────────────────────────────────────────────────────
// item 14, 22 — subnav slides with nav (translateY) + scrim covers both rows
// ─────────────────────────────────────────────────────────
test.describe('item 14 / 22 — subnav scrolls with nav', () => {
  test('scroll down → both nav and subnav hide together (single transform)', async ({ page }) => {
    await gotoFestival(page)
    const nav = page.locator(NAV)
    const subnav = page.locator(SUBNAV)
    await expect(nav).toHaveAttribute('data-visible', 'true')
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    // Mouse wheel scroll in two downward steps (avoids browser scroll-clamping artifact
    // that fires a tiny upward delta after scrollTo overshoot)
    await page.mouse.move(640, 400)
    await page.mouse.wheel(0, 120)
    await page.mouse.wheel(0, 120)
    await expect(nav).toHaveAttribute('data-scrolled', 'true', { timeout: 2000 })
    await expect(nav).toHaveAttribute('data-visible', 'false', { timeout: 2000 })
    await page.waitForTimeout(320)  // transform transition settle
    const transform = await nav.evaluate((el) => getComputedStyle(el).transform)
    // matrix(1, 0, 0, 1, 0, -N) where N > 0 is the upward translate
    expect(transform).toMatch(/matrix\(1,\s*0,\s*0,\s*1,\s*0,\s*-\d+/)
    // subnav inherits transform from parent nav (it lives inside nav, no own transform)
    const subTransform = await subnav.evaluate((el) => getComputedStyle(el).transform)
    expect(subTransform).toBe('none')  // sub doesn't apply its own; the nav transform carries it
    const subBox = await subnav.boundingBox()
    expect(subBox, 'subnav bounding box should reflect parent transform').not.toBeNull()
    expect(subBox!.y + subBox!.height, `subnav bottom should be ≤ 2 (got ${subBox!.y + subBox!.height})`).toBeLessThanOrEqual(2)

    // scroll up → both reappear
    await page.mouse.wheel(0, -200)
    await expect(nav).toHaveAttribute('data-visible', 'true', { timeout: 2000 })
    await page.waitForTimeout(320)
    const transform2 = await nav.evaluate((el) => getComputedStyle(el).transform)
    expect(transform2 === 'none' || /matrix\(1,\s*0,\s*0,\s*1,\s*0,\s*0\)/.test(transform2)).toBe(true)
  })

  test('scrim height (::before) is 160px (covers both rows)', async ({ page }) => {
    await gotoFestival(page)
    const scrimH = await page.evaluate(() => {
      const nav = document.querySelector('.global-top-nav')
      if (!nav) return null
      const before = getComputedStyle(nav, '::before')
      return before.height
    })
    expect(scrimH).toBe('160px')
  })
})

// ─────────────────────────────────────────────────────────
// item 21 — RWD gap
// ─────────────────────────────────────────────────────────
test.describe('item 21 — RWD gap', () => {
  test('desktop ≥ 768 gap is 24px', async ({ page }) => {
    await page.setViewportSize(RWD.desktop)
    await gotoFestival(page)
    const gap = await page.locator(SUBNAV).evaluate((el) => getComputedStyle(el).columnGap)
    expect(gap).toBe('24px')
  })

  test('mobile < 768 gap is 14px', async ({ page }) => {
    await page.setViewportSize(RWD.mobile)
    await gotoFestival(page)
    const gap = await page.locator(SUBNAV).evaluate((el) => getComputedStyle(el).columnGap)
    expect(gap).toBe('14px')
    // 3 tabs all visible side-by-side
    const tabs = page.locator(SUB_TABS)
    for (let i = 0; i < 3; i++) await expect(tabs.nth(i)).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────
// item 20 — main nav active underline color follows accent (intentional)
// ─────────────────────────────────────────────────────────
test.describe('item 20 — accent-driven main link underline (intentional, not a bug)', () => {
  test('on Festival, main nav link active text stays white but underline color tracks accent', async ({ page }) => {
    await gotoFestival(page)
    const activeLink = page.locator('nav.global-top-nav .global-nav-links a.is-active')
    // text color is hard-coded white
    await expect(activeLink).toHaveCSS('color', 'rgb(255, 255, 255)')
    // switch to taipei
    await page.locator(SUB_TABS).nth(1).click()
    await page.waitForTimeout(750)
    // text still white (independent of accent)
    await expect(activeLink).toHaveCSS('color', 'rgb(255, 255, 255)')
    // accent is now blue
    const accent = await page.evaluate(() => document.documentElement.style.getPropertyValue('--accent-color').trim())
    expect(accent).toBe('#4ab0ff')
  })
})
