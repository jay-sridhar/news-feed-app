import { useState, useEffect, useCallback } from 'react'
import type { CategoryId, FeedStatus, NewsArticle } from '../types'
import { CATEGORY_MAP } from '../constants/categories'
import { PAGE_SIZE } from '../constants/feed'
import { fetchFeed } from '../services/rssService'

interface UseFeedReturn {
  articles: NewsArticle[]
  allArticles: NewsArticle[]
  status: FeedStatus
  error: string | null
  lastRefreshed: number | null
  hasMore: boolean
  loadMore: () => void
  retry: () => void
}

export function useFeed(categoryId: CategoryId): UseFeedReturn {
  const [allArticles, setAllArticles] = useState<NewsArticle[]>([])
  const [status, setStatus] = useState<FeedStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<number | null>(null)
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE)

  const doFetch = useCallback(
    async (signal: AbortSignal, isRefresh = false): Promise<void> => {
      const category = CATEGORY_MAP[categoryId]
      if (!category) return

      if (!isRefresh) {
        setStatus('loading')
      }

      try {
        const fetched = await fetchFeed(category, signal)

        setAllArticles((prev) => {
          if (!isRefresh) return fetched

          // Prepend new articles that aren't already in the list
          const existingLinks = new Set(prev.map((a) => a.link))
          const newItems = fetched.filter((a) => !existingLinks.has(a.link))
          return newItems.length > 0 ? [...newItems, ...prev] : prev
        })

        setLastRefreshed(Date.now())
        setStatus('success')
        setError(null)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        if (!isRefresh) {
          setStatus('error')
          setError('Unable to load news. Please check your connection.')
        }
        // On refresh failure, silently retain existing articles
      }
    },
    [categoryId]
  )

  // Initial fetch — reset state when category changes
  useEffect(() => {
    setAllArticles([])
    setStatus('idle')
    setError(null)
    setLastRefreshed(null)
    setDisplayCount(PAGE_SIZE)

    const controller = new AbortController()
    void doFetch(controller.signal, false)
    return () => controller.abort()
  }, [categoryId, doFetch])

  // Auto-refresh every 10 minutes
  useEffect(() => {
    const controller = { current: new AbortController() }

    const REFRESH_INTERVAL_MS = 10 * 60 * 1000
    const id = setInterval(() => {
      controller.current.abort()
      controller.current = new AbortController()
      void doFetch(controller.current.signal, true)
    }, REFRESH_INTERVAL_MS)

    return () => {
      clearInterval(id)
      controller.current.abort()
    }
  }, [categoryId, doFetch])

  const loadMore = useCallback((): void => {
    setDisplayCount((prev) => Math.min(prev + PAGE_SIZE, allArticles.length))
  }, [allArticles.length])

  const retry = useCallback((): void => {
    const controller = new AbortController()
    void doFetch(controller.signal, false)
  }, [doFetch])

  const visibleArticles = allArticles.slice(0, displayCount)
  const hasMore = displayCount < allArticles.length

  return { articles: visibleArticles, allArticles, status, error, lastRefreshed, hasMore, loadMore, retry }
}
