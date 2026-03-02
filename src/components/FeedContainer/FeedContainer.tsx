import { useEffect, useState } from 'react'
import { useCategoryContext } from '../../context/CategoryContext'
import { useFeed } from '../../hooks/useFeed'
import type { CategoryId } from '../../types'
import { NewsCard } from '../NewsCard/NewsCard'
import { LoadingSpinner } from '../LoadingSpinner/LoadingSpinner'
import { ErrorState } from '../ErrorState/ErrorState'
import { ScrollSentinel } from '../ScrollSentinel/ScrollSentinel'
import { SearchBar } from '../SearchBar/SearchBar'

export function FeedContainer(): JSX.Element {
  const { activeCategory } = useCategoryContext()
  // safe cast: FeedContainer is only rendered by MainView when activeCategory !== 'bookmarks'
  const { articles, allArticles, status, error, hasMore, loadMore, retry } = useFeed(activeCategory as CategoryId)
  const [query, setQuery] = useState<string>('')

  // Scroll to top whenever the user switches category
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [activeCategory])

  // Reset search query whenever the active category changes (US4)
  useEffect(() => {
    setQuery('')
  }, [activeCategory])

  const normalizedQuery = query.trim().toLowerCase()
  const filteredArticles = normalizedQuery
    ? allArticles.filter(
        (a) =>
          a.title.toLowerCase().includes(normalizedQuery) ||
          a.sourceName.toLowerCase().includes(normalizedQuery)
      )
    : articles

  const isInitialLoading = status === 'idle' || (status === 'loading' && articles.length === 0)
  const isBackgroundRefreshing = status === 'loading' && articles.length > 0

  if (isInitialLoading) {
    return <LoadingSpinner fullScreen message="Loading news…" />
  }

  if (status === 'error') {
    return (
      <ErrorState
        message={error ?? 'Unable to load news. Please check your connection.'}
        onRetry={retry}
      />
    )
  }

  if (status === 'success' && allArticles.length === 0) {
    return (
      <p className="px-4 py-12 text-center text-sm text-gray-400 dark:text-gray-500">
        No recent articles. Check back later.
      </p>
    )
  }

  return (
    <div className="pb-4">
      <SearchBar
        value={query}
        onChange={setQuery}
        onClear={() => setQuery('')}
      />

      {filteredArticles.length > 0 ? (
        <>
          {filteredArticles.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}

          {isBackgroundRefreshing && (
            <LoadingSpinner message="Refreshing…" />
          )}

          {status === 'success' && !normalizedQuery && (
            <ScrollSentinel onVisible={loadMore} hasMore={hasMore} />
          )}
        </>
      ) : (
        <p className="px-4 py-12 text-center text-sm text-gray-400 dark:text-gray-500">
          No articles match &ldquo;{query.trim()}&rdquo;
        </p>
      )}
    </div>
  )
}
