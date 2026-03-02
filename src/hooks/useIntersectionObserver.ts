import { useEffect } from 'react'
import type { RefObject } from 'react'

export function useIntersectionObserver(
  ref: RefObject<Element>,
  callback: () => void,
  options?: IntersectionObserverInit
): void {
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) callback()
        })
      },
      options
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, callback, options])
}
