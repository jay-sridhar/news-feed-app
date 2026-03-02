import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { firebaseDb } from '../services/firebase'
import { useAuthContext } from './AuthContext'
import type { ActiveTab, CategoryContextValue, CategoryId } from '../types'
import { CATEGORIES, CATEGORY_MAP } from '../constants/categories'

const STORAGE_KEY = 'newsflow_enabled_categories'

function loadEnabledCategories(): CategoryId[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed: unknown = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        const valid = parsed.filter((id): id is CategoryId => typeof id === 'string' && id in CATEGORY_MAP)
        if (valid.length > 0) return valid
      }
    }
  } catch {
    // ignore parse errors
  }
  return CATEGORIES.map((c) => c.id)
}

const CategoryContext = createContext<CategoryContextValue | null>(null)

export function CategoryProvider({ children }: { children: ReactNode }): JSX.Element {
  const { user } = useAuthContext()
  const [activeCategory, setActiveCategory] = useState<ActiveTab>('top')
  const [enabledCategories, setEnabledCategories] = useState<CategoryId[]>(loadEnabledCategories)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // On sign-in: apply cloud preferences (overwrite local)
  // On sign-out: reload from localStorage
  useEffect(() => {
    const uid = user?.uid ?? null

    if (uid === null || !firebaseDb) return

    const prefDocRef = doc(firebaseDb, 'users', uid, 'preferences', 'default')
    void getDoc(prefDocRef).then((snap) => {
      if (!snap.exists()) return
      const data = snap.data() as { enabledCategories?: CategoryId[] }
      if (Array.isArray(data.enabledCategories) && data.enabledCategories.length > 0) {
        const valid = data.enabledCategories.filter(
          (id): id is CategoryId => typeof id === 'string' && id in CATEGORY_MAP
        )
        if (valid.length > 0) {
          setEnabledCategories(valid)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(valid))
        }
      }
    })
  }, [user?.uid]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleCategory = useCallback(
    (id: CategoryId): void => {
      setEnabledCategories((prev) => {
        const isEnabled = prev.includes(id)
        if (isEnabled && prev.length === 1) return prev // min-one guard
        const next = isEnabled ? prev.filter((x) => x !== id) : [...prev, id]
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        // Dual-write to Firestore if signed in
        if (user?.uid && firebaseDb) {
          const writeRef = doc(firebaseDb, 'users', user.uid, 'preferences', 'default')
          void setDoc(writeRef, { enabledCategories: next }, { merge: true })
        }
        return next
      })
    },
    [user?.uid]
  )

  const openSettings = useCallback((): void => {
    setIsSettingsOpen(true)
  }, [])

  const closeSettings = useCallback((): void => {
    setIsSettingsOpen(false)
    // Auto-switch if the active category was just deselected
    setActiveCategory((prev) => {
      if (prev === 'bookmarks') return prev
      if (!enabledCategories.includes(prev as CategoryId)) {
        return enabledCategories[0]
      }
      return prev
    })
  }, [enabledCategories])

  return (
    <CategoryContext.Provider
      value={{
        activeCategory,
        setActiveCategory,
        enabledCategories,
        toggleCategory,
        isSettingsOpen,
        openSettings,
        closeSettings,
      }}
    >
      {children}
    </CategoryContext.Provider>
  )
}

export function useCategoryContext(): CategoryContextValue {
  const ctx = useContext(CategoryContext)
  if (!ctx) {
    throw new Error('useCategoryContext must be used within a CategoryProvider')
  }
  return ctx
}
