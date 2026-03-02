import { CATEGORIES } from '../../constants/categories'
import { useCategoryContext } from '../../context/CategoryContext'
import { useThemeContext } from '../../context/ThemeContext'

export function TabBar(): JSX.Element {
  const { activeCategory, setActiveCategory } = useCategoryContext()
  const { theme, toggleTheme } = useThemeContext()

  return (
    <nav
      className="sticky top-0 z-20 border-b border-gray-200 bg-white shadow-sm dark:bg-gray-900 dark:border-gray-700"
      aria-label="News categories"
    >
      {/* App name row */}
      <div className="flex items-center justify-between px-4 pt-3 pb-0">
        <h1 className="text-lg font-bold text-gray-900 tracking-tight dark:text-gray-100">NewsFlow</h1>
        <button
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={toggleTheme}
          className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          {theme === 'dark' ? (
            // Sun icon
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            // Moon icon
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>

      {/* Scrollable tab row */}
      <div className="flex overflow-x-auto scrollbar-none gap-0 px-2 pb-0">
        {CATEGORIES.map((cat) => {
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
