import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'
import type { FirebaseApp } from 'firebase/app'
import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'

const configured = [
  import.meta.env.VITE_FIREBASE_API_KEY,
  import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  import.meta.env.VITE_FIREBASE_PROJECT_ID,
  import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  import.meta.env.VITE_FIREBASE_APP_ID,
].every(Boolean)

if (!configured) {
  console.warn('[NewsFlow] Firebase env vars missing — running in local-only mode.')
}

const firebaseConfig = configured
  ? {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    }
  : null

export const firebaseApp: FirebaseApp | null = configured ? initializeApp(firebaseConfig!) : null

export const firebaseAuth: Auth | null = configured ? getAuth(firebaseApp!) : null

export const firebaseDb: Firestore | null = configured
  ? initializeFirestore(firebaseApp!, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    })
  : null

export const googleProvider: GoogleAuthProvider | null = configured ? new GoogleAuthProvider() : null
