import type { NewsArticle } from '../../types'
import { formatRelativeTime } from '../../utils/relativeTime'
import { useBookmarkContext } from '../../context/BookmarkContext'

interface NewsCardProps {
  article: NewsArticle
}

export function NewsCard({ article }: NewsCardProps): JSX.Element {
  const { isBookmarked, toggleBookmark } = useBookmarkContext()
  const saved = isBookmarked(article.id)

  const content = (
    <div className="flex flex-col gap-1 px-4 py-4 pr-14 active:bg-gray-50 dark:active:bg-gray-800">
      <h2 className="text-[15px] font-semibold leading-snug text-gray-900 line-clamp-3 dark:text-gray-100">
        {article.title}
      </h2>
      <div className="flex items-center gap-2 pt-1">
        <span className="text-xs font-medium text-blue-700 truncate max-w-[55%]">
          {article.sourceName}
        </span>
        <span className="text-gray-300 text-xs dark:text-gray-600">·</span>
        <span className="text-xs text-gray-400 whitespace-nowrap dark:text-gray-500">
          {formatRelativeTime(article.pubDate)}
        </span>
      </div>
    </div>
  )

  const bookmarkButton = (
    <button
      aria-label={saved ? 'Remove bookmark' : 'Bookmark article'}
      onClick={() => toggleBookmark(article)}
      className="absolute top-2 right-2 flex h-11 w-11 items-center justify-center text-gray-400 hover:text-blue-500 dark:text-gray-500"
    >
      {saved ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5 text-blue-600"
          aria-hidden="true"
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      )}
    </button>
  )

  if (!article.link) {
    return (
      <div className="relative border-b border-gray-100 dark:border-gray-700 cursor-default">
        {content}
        {bookmarkButton}
      </div>
    )
  }

  return (
    <div className="relative border-b border-gray-100">
      <a
        href={article.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block no-underline"
      >
        {content}
      </a>
      {bookmarkButton}
    </div>
  )
}
