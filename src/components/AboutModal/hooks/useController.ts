import { useCallback, useEffect, useId, useRef, useState } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * A hand-rolled modal, because jsdom does not implement `HTMLDialogElement`'s
 * `showModal()` — a native `<dialog>` here could only be tested through a mock,
 * which would exercise the mock and not the behaviour.
 *
 * That trade means owning the parts a native dialog gives away: Escape,
 * returning focus to the trigger, keeping Tab inside, and stopping the page
 * behind from scrolling.
 */
export function useController() {
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()

  const handleClose = useCallback(() => {
    setIsOpen(false)
    // Focus goes back where it came from. Without this the keyboard user is
    // dropped at the top of the document with no idea where they are.
    triggerRef.current?.focus()
  }, [])

  const handleOpen = () => {
    setIsOpen(true)
  }

  useEffect(() => {
    if (!isOpen) return

    // Move focus INTO the dialog, or the next Tab lands behind it.
    const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose()
        return
      }
      if (event.key !== 'Tab') return

      const panel = panelRef.current
      if (panel === null) return

      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)]
      if (items.length === 0) return

      const firstItem = items[0]
      const lastItem = items[items.length - 1]
      const active = document.activeElement

      // Wrap at both ends, so Tab can never walk out into the page behind.
      if (event.shiftKey && active === firstItem) {
        event.preventDefault()
        lastItem.focus()
      } else if (!event.shiftKey && active === lastItem) {
        event.preventDefault()
        firstItem.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)

    // The page behind must not scroll under the overlay.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen, handleClose])

  return { isOpen, titleId, panelRef, triggerRef, handleOpen, handleClose }
}
