import { useBookmarkContext } from '../../context/BookmarkContext'
import { NewsCard } from '../NewsCard/NewsCard'

export function BookmarksContainer(): JSX.Element {
  const { bookmarks } = useBookmarkContext()

  if (bookmarks.length === 0) {
    return (
      <p className="px-4 py-12 text-center text-sm text-gray-400 dark:text-gray-500">
        No bookmarks yet. Tap the bookmark icon on any article to save it.
      </p>
    )
  }

  return (
    <div className="pb-4">
      {bookmarks.map((bookmark) => (
        <NewsCard key={bookmark.id} article={bookmark} />
      ))}
    </div>
  )
}
