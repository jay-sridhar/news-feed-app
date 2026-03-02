import { useEffect, useRef, useState } from 'react'
import { useCategoryContext } from '../../context/CategoryContext'
import { useThemeContext } from '../../context/ThemeContext'

export function TabBar(): JSX.Element {
  const {
    activeCategory, setActiveCategory, categories, enabledCategories,
    openSettings, searchQuery, setSearchQuery,
  } = useCategoryContext()
  const { theme, toggleTheme } = useThemeContext()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close search when tab changes
  useEffect(() => {
    setIsSearchOpen(false)
  }, [activeCategory])

  function openSearch(): void {
    setIsSearchOpen(true)
    // Focus the input on next frame after it mounts
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function closeSearch(): void {
    setIsSearchOpen(false)
    setSearchQuery('')
  }

  return (
    <nav
      className="sticky top-0 z-20 border-b border-gray-200 bg-white shadow-sm dark:bg-gray-900 dark:border-gray-700"
      aria-label="News categories"
    >
      {/* App name + icon row */}
      <div className="flex items-center justify-between px-4 pt-3 pb-0">
        <div>
          <h1 className="text-lg font-bold text-gray-900 tracking-tight dark:text-gray-100">NewsFlow</h1>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-none">by Jay Sridhar</p>
        </div>

        <div className="flex items-center gap-1">
          {/* Search icon */}
          <button
            aria-label="Search articles"
            onClick={openSearch}
            className={[
              'flex h-10 w-10 items-center justify-center rounded-full transition-colors',
              isSearchOpen
                ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30'
                : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
            ].join(' ')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          {/* Dark / light toggle */}
          <button
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          {/* Settings gear */}
          <button
            aria-label="Open settings"
            onClick={openSettings}
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expandable search row */}
      {isSearchOpen && (
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles…"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 pr-10 text-sm outline-none focus:border-blue-400 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:bg-gray-800"
            />
            {searchQuery.length > 0 && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <button
            onClick={closeSearch}
            className="flex-shrink-0 text-sm font-medium text-blue-600 dark:text-blue-400"
            aria-label="Close search"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Scrollable tab row — only enabled categories */}
      <div className="flex overflow-x-auto scrollbar-none gap-0 px-2 pb-0">
        {categories.filter((cat) => enabledCategories.includes(cat.id)).map((cat) => {
          const isActive = cat.id === activeCategory
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={[
                'flex-shrink-0 whitespace-nowrap px-3 py-3 text-sm font-medium transition-colors',
                'min-h-[44px] focus:outline-none',
                isActive
                  ? 'border-b-2 border-blue-600 text-blue-700'
                  : 'border-b-2 border-transparent text-gray-500 active:text-gray-800 dark:text-gray-400 dark:active:text-gray-200',
              ].join(' ')}
              aria-current={isActive ? 'page' : undefined}
            >
              {cat.label}
            </button>
          )
        })}

        {/* Bookmarks tab */}
        <button
          onClick={() => setActiveCategory('bookmarks')}
          className={[
            'flex-shrink-0 whitespace-nowrap px-3 py-3 text-sm font-medium transition-colors',
            'min-h-[44px] focus:outline-none',
            activeCategory === 'bookmarks'
              ? 'border-b-2 border-blue-600 text-blue-700'
              : 'border-b-2 border-transparent text-gray-500 active:text-gray-800 dark:text-gray-400 dark:active:text-gray-200',
          ].join(' ')}
          aria-current={activeCategory === 'bookmarks' ? 'page' : undefined}
        >
          Bookmarks
        </button>
      </div>
    </nav>
  )
}
