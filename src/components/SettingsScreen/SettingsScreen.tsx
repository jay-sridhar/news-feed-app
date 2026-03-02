import { useState } from 'react'
import { INDIA_STATES } from '../../constants/categories'
import { useCategoryContext } from '../../context/CategoryContext'
import { useThemeContext } from '../../context/ThemeContext'
import { useAuthContext } from '../../context/AuthContext'
import type { CategoryId } from '../../types'

export function SettingsScreen(): JSX.Element {
  const { categories, enabledCategories, toggleCategory, closeSettings, userRegion, setUserRegion } =
    useCategoryContext()
  const { theme, toggleTheme } = useThemeContext()
  const { user, authLoading, signInWithGoogle, signOut } = useAuthContext()
  const [guardFired, setGuardFired] = useState(false)

  function handleToggle(id: CategoryId): void {
    const isEnabled = enabledCategories.includes(id)
    if (isEnabled && enabledCategories.length === 1) {
      setGuardFired(true)
      return
    }
    setGuardFired(false)
    toggleCategory(id)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Settings</h2>
        <button
          aria-label="Close settings"
          onClick={closeSettings}
          className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
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
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="px-4 py-4">
        {/* Account section */}
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Account
        </p>
        <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
          {user ? (
            <div className="px-4 py-3">
              <div className="mb-3 flex items-center gap-3">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                    <span className="text-sm font-semibold">
                      {user.displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {user.displayName}
                  </p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
              </div>
              <button
                onClick={() => void signOut()}
                className="w-full rounded-lg border border-gray-300 bg-white py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="px-4 py-3">
              <button
                onClick={() => void signInWithGoogle()}
                disabled={authLoading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                {/* Google logo */}
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign in with Google
              </button>
            </div>
          )}
        </div>

        {/* Region section */}
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Region
        </p>
        <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
          {/* Country row — fixed to India for now */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Country</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">India</span>
          </div>
          {/* State row */}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">State / Region</span>
            <select
              aria-label="Select state"
              value={userRegion.state}
              onChange={(e) => setUserRegion({ country: userRegion.country, state: e.target.value })}
              className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            >
              {INDIA_STATES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.value}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* News Categories section */}
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          News Categories
        </p>
        <div className="rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
          {categories.map((cat, index) => {
            const isEnabled = enabledCategories.includes(cat.id)
            const isLastEnabled = isEnabled && enabledCategories.length === 1
            const isLast = index === categories.length - 1

            return (
              <div
                key={cat.id}
                className={[
                  'flex items-center justify-between px-4 py-3',
                  !isLast ? 'border-b border-gray-200 dark:border-gray-700' : '',
                ].join(' ')}
              >
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{cat.label}</span>
                <button
                  role="switch"
                  aria-checked={isEnabled}
                  aria-label={cat.label}
                  onClick={() => handleToggle(cat.id)}
                  className={[
                    'relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                    isLastEnabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                    isEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
                      isEnabled ? 'translate-x-5' : 'translate-x-0',
                    ].join(' ')}
                  />
                </button>
              </div>
            )
          })}
        </div>

        {guardFired && (
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
            At least one category must remain selected
          </p>
        )}

        {/* Appearance section */}
        <p className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Appearance
        </p>
        <div className="rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Dark Mode</span>
            <button
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={toggleTheme}
              className={[
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600',
              ].join(' ')}
            >
              <span
                className={[
                  'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
                  theme === 'dark' ? 'translate-x-5' : 'translate-x-0',
                ].join(' ')}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
