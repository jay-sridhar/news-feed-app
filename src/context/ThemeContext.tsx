import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { firebaseDb } from '../services/firebase'
import { useAuthContext } from './AuthContext'
import type { Theme } from '../types'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem('newsflow_theme')
    if (stored === 'dark' || stored === 'light') return stored
  } catch {}
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }): JSX.Element {
  const { user } = useAuthContext()
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  // Sync DOM class with theme state (does NOT write to localStorage)
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  // On sign-in: apply cloud theme preference
  useEffect(() => {
    const uid = user?.uid ?? null
    if (uid === null || !firebaseDb) return

    const prefDocRef = doc(firebaseDb, 'users', uid, 'preferences', 'default')
    void getDoc(prefDocRef).then((snap) => {
      if (!snap.exists()) return
      const data = snap.data() as { theme?: Theme }
      if (data.theme === 'dark' || data.theme === 'light') {
        setTheme(data.theme)
        try {
          localStorage.setItem('newsflow_theme', data.theme)
        } catch {}
      }
    })
  }, [user?.uid]) // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for OS theme changes — only apply when no manual preference is stored
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    function handler(e: MediaQueryListEvent): void {
      try {
        if (localStorage.getItem('newsflow_theme') === null) {
          setTheme(e.matches ? 'dark' : 'light')
        }
      } catch {
        setTheme(e.matches ? 'dark' : 'light')
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  function toggleTheme(): void {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem('newsflow_theme', next)
      } catch {}
      // Dual-write to Firestore if signed in
      if (user?.uid && firebaseDb) {
        const prefDocRef = doc(firebaseDb, 'users', user.uid, 'preferences', 'default')
        void setDoc(prefDocRef, { theme: next }, { merge: true })
      }
      return next
    })
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useThemeContext must be used within a ThemeProvider')
  return ctx
}
