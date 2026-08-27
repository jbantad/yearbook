import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { AuthPage } from './pages/Auth'
import { DayPage } from './pages/DayPage'
import { todayISO } from './lib/pages'
import { CalendarPage } from './pages/CalendarPage'
import { QuestsPage } from './pages/QuestsPage'
import { ShelvesPage } from './pages/ShelvesPage'
import { PersonDetailPage } from './pages/PersonDetailPage'
import { AlbumsPage } from './pages/AlbumsPage'
import { AlbumPage } from './pages/AlbumPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return <div className="loading-screen">Loading…</div>
  if (!session) return <Navigate to="/auth" replace />
  return <>{children}</>
}

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/" element={<Navigate to={`/day/${todayISO()}`} replace />} />
        <Route path="/day/:date" element={<RequireAuth><DayPage /></RequireAuth>} />
        <Route path="/calendar" element={<RequireAuth><CalendarPage /></RequireAuth>} />
        <Route path="/quests" element={<RequireAuth><QuestsPage /></RequireAuth>} />
        <Route path="/shelves" element={<RequireAuth><ShelvesPage /></RequireAuth>} />
        <Route path="/people/:id" element={<RequireAuth><PersonDetailPage /></RequireAuth>} />
        <Route path="/albums" element={<RequireAuth><AlbumsPage /></RequireAuth>} />
        <Route path="/page/:id" element={<RequireAuth><AlbumPage /></RequireAuth>} />
        <Route path="*" element={<Navigate to={`/day/${todayISO()}`} replace />} />
      </Routes>
    </div>
  )
}

export default App
