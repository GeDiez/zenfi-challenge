import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'zenfi-theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

/**
 * The stored preference, or null when the viewer has not chosen one yet.
 * Storage can throw outright in a private window or with site data blocked, so
 * an unreadable store and an absent value are treated the same.
 */
function readStored(): Theme | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    /* fall through */
  }
  return null
}

/** jsdom does not implement matchMedia, so its absence must not throw. */
function systemPrefersDark(): boolean {
  if (typeof window.matchMedia !== 'function') return false
  return window.matchMedia(DARK_QUERY).matches
}

/**
 * Two states, not three.
 *
 * The OS preference is the default on a first visit and nothing is stamped, so
 * the page follows the system until the viewer expresses a preference — and it
 * keeps following it live if the OS flips while the page is open. The first
 * click writes a choice, and from then on the choice wins.
 */
export function useController() {
  const [stored, setStored] = useState<Theme | null>(readStored)
  const [systemDark, setSystemDark] = useState(systemPrefersDark)

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const media = window.matchMedia(DARK_QUERY)
    const onChange = (event: MediaQueryListEvent) => {
      setSystemDark(event.matches)
    }
    media.addEventListener('change', onChange)
    return () => {
      media.removeEventListener('change', onChange)
    }
  }, [])

  const theme: Theme = stored ?? (systemDark ? 'dark' : 'light')

  useEffect(() => {
    const root = document.documentElement
    if (stored === null) {
      // No stamp means the CSS falls back to prefers-color-scheme.
      root.removeAttribute('data-theme')
      return
    }
    root.setAttribute('data-theme', stored)
    try {
      window.localStorage.setItem(STORAGE_KEY, stored)
    } catch {
      /* a viewer who blocks storage still gets the theme for this session */
    }
  }, [stored])

  const next: Theme = theme === 'dark' ? 'light' : 'dark'

  const handleClick = () => {
    setStored(next)
  }

  return {
    theme,
    next,
    // The button shows what it DOES, and an icon-only control must still say it
    // out loud: without this label a screen reader announces "button".
    label: next === 'dark' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro',
    handleClick,
  }
}
