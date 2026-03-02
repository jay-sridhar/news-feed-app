import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { firebaseAuth, googleProvider } from '../services/firebase'
import type { AuthContextValue, UserProfile } from '../types'

const AuthContext = createContext<AuthContextValue | null>(null)

function toUserProfile(user: User): UserProfile {
  return {
    uid: user.uid,
    displayName: user.displayName ?? '',
    email: user.email ?? '',
    photoURL: user.photoURL,
  }
}

/** In DEV mode only: allow Playwright to inject a signed-in user via page.addInitScript */
function getInitialMockUser(): UserProfile | null {
  if (!import.meta.env.DEV) return null
  const w = window as { __MOCK_AUTH_USER__?: UserProfile }
  return w.__MOCK_AUTH_USER__ ?? null
}

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const mockUser = getInitialMockUser()
  const [user, setUser] = useState<UserProfile | null>(mockUser)
  const [authLoading, setAuthLoading] = useState<boolean>(firebaseAuth !== null && mockUser === null)

  useEffect(() => {
    // If Firebase is not configured or we have a mock user, skip the real auth listener
    if (!firebaseAuth || mockUser !== null) {
      setAuthLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      setUser(firebaseUser ? toUserProfile(firebaseUser) : null)
      setAuthLoading(false)
    })

    return unsubscribe
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function signInWithGoogle(): Promise<void> {
    if (!firebaseAuth || !googleProvider) return
    try {
      await signInWithPopup(firebaseAuth, googleProvider)
    } catch {
      // user cancelled or popup blocked — stay signed out
    }
  }

  async function signOut(): Promise<void> {
    if (!firebaseAuth) {
      setUser(null)
      return
    }
    try {
      await firebaseSignOut(firebaseAuth)
    } catch {
      // ignore sign-out errors
    }
  }

  return (
    <AuthContext.Provider value={{ user, authLoading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within an AuthProvider')
  return ctx
}
