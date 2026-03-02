import { useCategoryContext } from '../../context/CategoryContext'

export function TabBar(): JSX.Element {
  const { activeCategory, setActiveCategory, categories, enabledCategories, openSettings } = useCategoryContext()

  return (
    <nav
      className="sticky top-0 z-20 border-b border-gray-200 bg-white shadow-sm dark:bg-gray-900 dark:border-gray-700"
      aria-label="News categories"
    >
      {/* App name row */}
      <div className="flex items-center justify-between px-4 pt-3 pb-0">
        <div>
          <h1 className="text-lg font-bold text-gray-900 tracking-tight dark:text-gray-100">NewsFlow</h1>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-none">by Jay Sridhar</p>
        </div>
        <button
          aria-label="Open settings"
          onClick={openSettings}
          className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          {/* Gear icon */}
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
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

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
