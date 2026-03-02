import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { CategoryProvider, useCategoryContext } from './context/CategoryContext'
import { BookmarkProvider } from './context/BookmarkContext'
import { TabBar } from './components/TabBar/TabBar'
import { FeedContainer } from './components/FeedContainer/FeedContainer'
import { BookmarksContainer } from './components/BookmarksContainer/BookmarksContainer'
import { SettingsScreen } from './components/SettingsScreen/SettingsScreen'

function MainView(): JSX.Element {
  const { activeCategory, isSettingsOpen } = useCategoryContext()
  if (isSettingsOpen) return <SettingsScreen />
  return activeCategory === 'bookmarks' ? <BookmarksContainer /> : <FeedContainer />
}

export default function App(): JSX.Element {
  return (
    <AuthProvider>
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
    </AuthProvider>
  )
}
