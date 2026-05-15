export type ConsentState = 'accepted' | 'declined' | null

const KEY = 'mm_consent_v1'

export function getConsent(): ConsentState {
  if (typeof window === 'undefined') return null
  try {
    const v = window.localStorage.getItem(KEY)
    if (v === 'accepted' || v === 'declined') return v
    return null
  } catch {
    return null
  }
}

export function setConsent(state: 'accepted' | 'declined') {
  try {
    window.localStorage.setItem(KEY, state)
    window.dispatchEvent(new CustomEvent('mm-consent-change', { detail: state }))
  } catch {
    // localStorage 不可用就放棄；下次仍會跳 banner
  }
}

export function clearConsent() {
  try {
    window.localStorage.removeItem(KEY)
    window.dispatchEvent(new CustomEvent('mm-consent-change', { detail: null }))
  } catch {
    // noop
  }
}
