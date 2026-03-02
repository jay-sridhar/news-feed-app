import { createContext, useContext, useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDocs,
  writeBatch,
} from 'firebase/firestore'
import type { Unsubscribe } from 'firebase/firestore'
import { firebaseDb } from '../services/firebase'
import { useAuthContext } from './AuthContext'
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

function saveBookmarksToLocal(bookmarks: BookmarkedArticle[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks))
  } catch {
    // storage quota exceeded or private browsing — silently ignore
  }
}

export function BookmarkProvider({ children }: { children: ReactNode }): JSX.Element {
  const { user } = useAuthContext()
  const [bookmarks, setBookmarks] = useState<BookmarkedArticle[]>(loadBookmarks)

  // Track the Firestore unsubscribe function
  const unsubscribeRef = useRef<Unsubscribe | null>(null)
  // Track previous user uid to detect sign-in transitions
  const prevUidRef = useRef<string | null>(null)

  useEffect(() => {
    const uid = user?.uid ?? null

    if (uid === null) {
      // Signed out — unsubscribe from Firestore and reload from localStorage
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
      if (prevUidRef.current !== null) {
        // Just signed out — reload local bookmarks
        setBookmarks(loadBookmarks())
      }
      prevUidRef.current = null
      return
    }

    if (!firebaseDb) {
      // Firebase not configured — stay in local-only mode
      prevUidRef.current = uid
      return
    }

    const bookmarksCol = collection(firebaseDb, 'users', uid, 'bookmarks')

    // First-sign-in merge: copy local bookmarks not yet in Firestore
    if (prevUidRef.current === null) {
      void mergeLocalToCloud(uid, bookmarksCol)
    }

    // Set up real-time listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
    }

    const unsubscribe = onSnapshot(bookmarksCol, (snapshot) => {
      const cloudBookmarks: BookmarkedArticle[] = snapshot.docs.map(
        (d) => d.data() as BookmarkedArticle
      )
      // Sort by savedAt descending (most recently saved first)
      cloudBookmarks.sort((a, b) => b.savedAt - a.savedAt)
      setBookmarks(cloudBookmarks)
      saveBookmarksToLocal(cloudBookmarks)
    })

    unsubscribeRef.current = unsubscribe
    prevUidRef.current = uid

    return () => {
      unsubscribe()
      unsubscribeRef.current = null
    }
  }, [user?.uid]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync to localStorage when signed out (no Firestore listener)
  useEffect(() => {
    if (user) return // Firestore listener handles this when signed in
    saveBookmarksToLocal(bookmarks)
  }, [bookmarks, user])

  async function mergeLocalToCloud(
    uid: string,
    bookmarksCol: ReturnType<typeof collection>
  ): Promise<void> {
    if (!firebaseDb) return
    try {
      const localBookmarks = loadBookmarks()
      if (localBookmarks.length === 0) return

      const existingSnap = await getDocs(bookmarksCol)
      const existingIds = new Set(existingSnap.docs.map((d) => d.id))

      const toWrite = localBookmarks.filter((b) => !existingIds.has(b.id))
      if (toWrite.length === 0) return

      const batch = writeBatch(firebaseDb)
      for (const bookmark of toWrite) {
        const docRef = doc(firebaseDb, 'users', uid, 'bookmarks', bookmark.id)
        batch.set(docRef, bookmark)
      }
      await batch.commit()
    } catch {
      // merge failure is non-fatal — local bookmarks stay in localStorage
    }
  }

  function toggleBookmark(article: NewsArticle): void {
    const uid = user?.uid
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.id === article.id)
      let next: BookmarkedArticle[]
      if (exists) {
        next = prev.filter((b) => b.id !== article.id)
        // Remove from Firestore if signed in
        if (uid && firebaseDb) {
          const docRef = doc(firebaseDb, 'users', uid, 'bookmarks', article.id)
          void deleteDoc(docRef)
        }
      } else {
        const newBookmark: BookmarkedArticle = { ...article, savedAt: Date.now() }
        next = [newBookmark, ...prev]
        // Write to Firestore if signed in
        if (uid && firebaseDb) {
          const docRef = doc(firebaseDb, 'users', uid, 'bookmarks', article.id)
          void setDoc(docRef, newBookmark)
        }
      }
      return next
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
