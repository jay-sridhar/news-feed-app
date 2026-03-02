import { ThemeProvider } from './context/ThemeContext'
import { CategoryProvider, useCategoryContext } from './context/CategoryContext'
import { BookmarkProvider } from './context/BookmarkContext'
import { TabBar } from './components/TabBar/TabBar'
import { FeedContainer } from './components/FeedContainer/FeedContainer'
import { BookmarksContainer } from './components/BookmarksContainer/BookmarksContainer'

function MainView(): JSX.Element {
  const { activeCategory } = useCategoryContext()
  return activeCategory === 'bookmarks' ? <BookmarksContainer /> : <FeedContainer />
}

export default function App(): JSX.Element {
  return (
    <ThemeProvider>
      <BookmarkProvider>
        <CategoryProvider>
          <div className="flex min-h-screen flex-col bg-white dark:bg-gray-900">
            <TabBar />
            <main className="flex-1">
              <MainView />
            </main>
          </div>
        </CategoryProvider>
      </BookmarkProvider>
    </ThemeProvider>
  )
}
