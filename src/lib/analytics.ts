import posthog from 'posthog-js'

let initialized = false

export function isInitialized() {
  return initialized
}

export function initAnalytics() {
  if (initialized) return
  const key = import.meta.env.VITE_POSTHOG_KEY
  if (!key) return

  const host = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com'
  posthog.init(key, {
    api_host: host,
    capture_pageview: false,
    autocapture: false,
    persistence: 'localStorage+cookie',
    person_profiles: 'identified_only',
  })
  posthog.register({
    app_version: import.meta.env.VITE_APP_VERSION ?? 'dev',
  })
  initialized = true
}

export function track(name: string, props?: Record<string, unknown>) {
  if (!initialized) return
  try {
    posthog.capture(name, props)
  } catch (err) {
    console.warn('[analytics] capture failed:', name, err)
  }
}

export function trackPageview(path: string) {
  if (!initialized) return
  try {
    posthog.capture('$pageview', {
      $current_url: window.location.href,
      $pathname: path,
    })
  } catch (err) {
    console.warn('[analytics] pageview failed:', path, err)
  }
}

export function resetAnalytics() {
  if (!initialized) return
  posthog.reset()
}

export function truncateMoodText(text: string, max = 500): string {
  if (typeof text !== 'string') return ''
  return text.length > max ? text.slice(0, max) : text
}
