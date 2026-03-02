import { useState } from 'react'
import { CATEGORIES } from '../../constants/categories'
import { useCategoryContext } from '../../context/CategoryContext'
import { useThemeContext } from '../../context/ThemeContext'
import type { CategoryId } from '../../types'

export function SettingsScreen(): JSX.Element {
  const { enabledCategories, toggleCategory, closeSettings } = useCategoryContext()
  const { theme, toggleTheme } = useThemeContext()
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
        {/* News Categories section */}
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          News Categories
        </p>
        <div className="rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
          {CATEGORIES.map((cat, index) => {
            const isEnabled = enabledCategories.includes(cat.id)
            const isLastEnabled = isEnabled && enabledCategories.length === 1
            const isLast = index === CATEGORIES.length - 1

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
