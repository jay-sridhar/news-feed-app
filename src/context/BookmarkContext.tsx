import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { NewsArticle, BookmarkedArticle } from '../types'

export interface BookmarkContextValue {
  bookmarks: BookmarkedArticle[]
  toggleBookmark: (article: NewsArticle) => void
  isBookmarked: (articleId: string) => boolean
}

const BookmarkContext = createContext<BookmarkContextValue | null>(null)

const STORAGE_KEY = 'newsflow_bookmarks'

function loadBookmarks(): BookmarkedArticle[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as BookmarkedArticle[]
  } catch {
    return []
  }
}

export function BookmarkProvider({ children }: { children: ReactNode }): JSX.Element {
  const [bookmarks, setBookmarks] = useState<BookmarkedArticle[]>(loadBookmarks)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks))
    } catch {
      // storage quota exceeded or private browsing — silently ignore
    }
  }, [bookmarks])

  function toggleBookmark(article: NewsArticle): void {
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.id === article.id)
      if (exists) {
        return prev.filter((b) => b.id !== article.id)
      }
      return [{ ...article, savedAt: Date.now() }, ...prev]
    })
  }

  function isBookmarked(articleId: string): boolean {
    return bookmarks.some((b) => b.id === articleId)
  }

  return (
    <BookmarkContext.Provider value={{ bookmarks, toggleBookmark, isBookmarked }}>
      {children}
    </BookmarkContext.Provider>
  )
}

export function useBookmarkContext(): BookmarkContextValue {
  const ctx = useContext(BookmarkContext)
  if (!ctx) {
    throw new Error('useBookmarkContext must be used within a BookmarkProvider')
  }
  return ctx
}
