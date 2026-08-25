import { useEffect, useId, useRef, useState } from 'react'
import type { FilterOption } from '../MultiSelectFilter'

type Params = {
  options: FilterOption[]
  selected: ReadonlySet<string>
  allLabel: string
  manyNoun: string
}

export function useController({
  options,
  selected,
  allLabel,
  manyNoun,
}: Params) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!isOpen) return

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (containerRef.current?.contains(target) === true) return
      setIsOpen(false)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setIsOpen(false)
      // Escape must return focus to the trigger, or the keyboard user is left
      // stranded on an element that no longer exists.
      buttonRef.current?.focus()
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen])

  const summary =
    selected.size === 0
      ? allLabel
      : selected.size === 1
        ? (options.find((option) => selected.has(option.id))?.label ?? allLabel)
        : `${String(selected.size)} ${manyNoun}`

  const handleTriggerClick = () => {
    setIsOpen((open) => !open)
  }

  /** Tabbing out of the panel closes it instead of leaving it hanging open. */
  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget)) return
    setIsOpen(false)
  }

  return {
    isOpen,
    summary,
    panelId,
    containerRef,
    buttonRef,
    handleTriggerClick,
    handleBlur,
  }
}
