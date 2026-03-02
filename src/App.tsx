import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { CategoryProvider, useCategoryContext } from './context/CategoryContext'
import { BookmarkProvider } from './context/BookmarkContext'
import { TabBar } from './components/TabBar/TabBar'
import { FeedContainer } from './components/FeedContainer/FeedContainer'
import { BookmarksContainer } from './components/BookmarksContainer/BookmarksContainer'
import { SettingsScreen } from './components/SettingsScreen/SettingsScreen'

function MainContent(): JSX.Element {
  const { activeCategory } = useCategoryContext()
  return activeCategory === 'bookmarks' ? <BookmarksContainer /> : <FeedContainer />
}

function AppContent(): JSX.Element {
  const { isSettingsOpen } = useCategoryContext()

  if (isSettingsOpen) {
    return <SettingsScreen />
  }

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-900">
      <TabBar />
      <main className="flex-1">
        <MainContent />
      </main>
    </div>
  )
}

export default function App(): JSX.Element {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BookmarkProvider>
          <CategoryProvider>
            <AppContent />
          </CategoryProvider>
        </BookmarkProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}
