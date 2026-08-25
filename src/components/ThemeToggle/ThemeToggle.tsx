import { MoonIcon, SunIcon } from '../icons'
import { useController } from './hooks/useController'

export const ThemeToggle = () => {
  const { next, label, handleClick } = useController()

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      title={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-hairline text-ink-secondary transition-colors hover:bg-wash hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-series-1"
    >
      {/* The icon names the destination, matching what the button does. */}
      {next === 'dark' ? (
        <MoonIcon className="h-5 w-5" />
      ) : (
        <SunIcon className="h-5 w-5" />
      )}
    </button>
  )
}
