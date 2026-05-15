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
  posthog.capture(name, props)
}

export function trackPageview(path: string) {
  if (!initialized) return
  posthog.capture('$pageview', {
    $current_url: window.location.href,
    $pathname: path,
  })
}

export function resetAnalytics() {
  if (!initialized) return
  posthog.reset()
}
