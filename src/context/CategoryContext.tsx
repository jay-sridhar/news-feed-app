import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { firebaseDb } from '../services/firebase'
import { useAuthContext } from './AuthContext'
import type { ActiveTab, Category, CategoryContextValue, CategoryId, FreshnessWindow, UserRegion } from '../types'
import { buildCategories, CATEGORY_MAP, DEFAULT_USER_REGION } from '../constants/categories'
import { DEFAULT_FRESHNESS_WINDOW } from '../constants/feed'

const STORAGE_KEY = 'newsflow_enabled_categories'
const REGION_STORAGE_KEY = 'newsflow_user_region'
const FRESHNESS_STORAGE_KEY = 'newsflow_freshness_window'

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
  return ['top']
}

const VALID_FRESHNESS: FreshnessWindow[] = ['6h', '12h', '24h', '48h', '7d', 'all']

function loadFreshnessWindow(): FreshnessWindow {
  try {
    const stored = localStorage.getItem(FRESHNESS_STORAGE_KEY)
    if (stored && (VALID_FRESHNESS as string[]).includes(stored)) {
      return stored as FreshnessWindow
    }
  } catch {}
  return DEFAULT_FRESHNESS_WINDOW
}

function loadUserRegion(): UserRegion {
  try {
    const stored = localStorage.getItem(REGION_STORAGE_KEY)
    if (stored) {
      const parsed: unknown = JSON.parse(stored)
      if (
        parsed !== null &&
        typeof parsed === 'object' &&
        'country' in parsed &&
        'state' in parsed &&
        typeof (parsed as Record<string, unknown>).country === 'string' &&
        typeof (parsed as Record<string, unknown>).state === 'string'
      ) {
        return parsed as UserRegion
      }
    }
  } catch {
    // ignore parse errors
  }
  return DEFAULT_USER_REGION
}

const CategoryContext = createContext<CategoryContextValue | null>(null)

export function CategoryProvider({ children }: { children: ReactNode }): JSX.Element {
  const { user } = useAuthContext()
  const [activeCategory, setActiveCategory] = useState<ActiveTab>('top')
  const [enabledCategories, setEnabledCategories] = useState<CategoryId[]>(loadEnabledCategories)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [userRegion, setUserRegionState] = useState<UserRegion>(loadUserRegion)
  const [freshnessWindow, setFreshnessWindowState] = useState<FreshnessWindow>(loadFreshnessWindow)
  const [searchQuery, setSearchQueryState] = useState<string>('')

  const categories: Category[] = useMemo(() => buildCategories(userRegion), [userRegion])

  // Clear search when the active tab changes
  useEffect(() => {
    setSearchQueryState('')
  }, [activeCategory])

  // Keep a stable ref to enabledCategories for use in closeSettings
  const enabledRef = useRef(enabledCategories)
  enabledRef.current = enabledCategories

  // On sign-in: apply cloud preferences (overwrite local)
  useEffect(() => {
    const uid = user?.uid ?? null
    if (uid === null || !firebaseDb) return

    const prefDocRef = doc(firebaseDb, 'users', uid, 'preferences', 'default')
    void getDoc(prefDocRef).then((snap) => {
      if (!snap.exists()) return
      const data = snap.data() as { enabledCategories?: CategoryId[]; userRegion?: UserRegion; freshnessWindow?: FreshnessWindow }

      if (Array.isArray(data.enabledCategories) && data.enabledCategories.length > 0) {
        const valid = data.enabledCategories.filter(
          (id): id is CategoryId => typeof id === 'string' && id in CATEGORY_MAP
        )
        if (valid.length > 0) {
          setEnabledCategories(valid)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(valid))
        }
      }

      if (
        data.userRegion &&
        typeof data.userRegion.country === 'string' &&
        typeof data.userRegion.state === 'string'
      ) {
        setUserRegionState(data.userRegion)
        localStorage.setItem(REGION_STORAGE_KEY, JSON.stringify(data.userRegion))
      }

      if (data.freshnessWindow && (VALID_FRESHNESS as string[]).includes(data.freshnessWindow)) {
        setFreshnessWindowState(data.freshnessWindow)
        localStorage.setItem(FRESHNESS_STORAGE_KEY, data.freshnessWindow)
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
        if (user?.uid && firebaseDb) {
          const writeRef = doc(firebaseDb, 'users', user.uid, 'preferences', 'default')
          void setDoc(writeRef, { enabledCategories: next }, { merge: true })
        }
        return next
      })
    },
    [user?.uid]
  )

  const setUserRegion = useCallback(
    (region: UserRegion): void => {
      setUserRegionState(region)
      localStorage.setItem(REGION_STORAGE_KEY, JSON.stringify(region))
      if (user?.uid && firebaseDb) {
        const writeRef = doc(firebaseDb, 'users', user.uid, 'preferences', 'default')
        void setDoc(writeRef, { userRegion: region }, { merge: true })
      }
    },
    [user?.uid]
  )

  const setFreshnessWindow = useCallback(
    (w: FreshnessWindow): void => {
      setFreshnessWindowState(w)
      localStorage.setItem(FRESHNESS_STORAGE_KEY, w)
      if (user?.uid && firebaseDb) {
        const writeRef = doc(firebaseDb, 'users', user.uid, 'preferences', 'default')
        void setDoc(writeRef, { freshnessWindow: w }, { merge: true })
      }
    },
    [user?.uid]
  )

  const openSettings = useCallback((): void => {
    setIsSettingsOpen(true)
  }, [])

  const closeSettings = useCallback((): void => {
    setIsSettingsOpen(false)
    setActiveCategory((prev) => {
      if (prev === 'bookmarks') return prev
      if (!enabledRef.current.includes(prev as CategoryId)) {
        return enabledRef.current[0]
      }
      return prev
    })
  }, [])

  return (
    <CategoryContext.Provider
      value={{
        activeCategory,
        setActiveCategory,
        categories,
        enabledCategories,
        toggleCategory,
        isSettingsOpen,
        openSettings,
        closeSettings,
        userRegion,
        setUserRegion,
        freshnessWindow,
        setFreshnessWindow,
        searchQuery,
        setSearchQuery: setSearchQueryState,
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
