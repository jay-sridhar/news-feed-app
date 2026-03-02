import { useRef, useCallback } from 'react'
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'

interface ScrollSentinelProps {
  onVisible: () => void
  hasMore: boolean
}

export function ScrollSentinel({ onVisible, hasMore }: ScrollSentinelProps): JSX.Element {
  const sentinelRef = useRef<HTMLDivElement>(null)

  const stableOnVisible = useCallback(onVisible, [onVisible])

  useIntersectionObserver(sentinelRef, stableOnVisible, { threshold: 0.1 })

  if (!hasMore) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-gray-400">You're all caught up</p>
      </div>
    )
  }

  return <div ref={sentinelRef} className="h-4 w-full" aria-hidden="true" />
}
