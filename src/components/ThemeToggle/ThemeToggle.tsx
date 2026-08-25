import { useEffect, useState } from 'react'

type ThemeChoice = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'zenfi-theme'
const NEXT: Record<ThemeChoice, ThemeChoice> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
}
const LABEL: Record<ThemeChoice, string> = {
  system: 'Sistema',
  light: 'Claro',
  dark: 'Oscuro',
}

function readStoredChoice(): ThemeChoice {
  // Storage can throw outright in a private window or with site data blocked,
  // so a missing value and an unreadable store both fall back to 'system'.
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored
    }
  } catch {
    /* fall through */
  }
  return 'system'
}

function applyChoice(choice: ThemeChoice): void {
  const root = document.documentElement
  if (choice === 'system') {
    root.removeAttribute('data-theme')
  } else {
    root.setAttribute('data-theme', choice)
  }
}

export function ThemeToggle() {
  const [choice, setChoice] = useState<ThemeChoice>(readStoredChoice)

  useEffect(() => {
    applyChoice(choice)
    try {
      window.localStorage.setItem(STORAGE_KEY, choice)
    } catch {
      /* a viewer who blocks storage still gets the theme for this session */
    }
  }, [choice])

  return (
    <button
      type="button"
      onClick={() => setChoice((current) => NEXT[current])}
      aria-label={`Tema: ${LABEL[choice]}. Cambiar a ${LABEL[NEXT[choice]]}`}
      className="inline-flex items-center gap-2 rounded-lg border border-hairline px-3 py-2 text-sm font-medium text-ink-secondary transition-colors hover:bg-wash"
    >
      <span aria-hidden="true" className="text-base leading-none">
        {choice === 'dark' ? '◐' : choice === 'light' ? '○' : '◑'}
      </span>
      {LABEL[choice]}
    </button>
  )
}
