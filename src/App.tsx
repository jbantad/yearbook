import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { AuthPage } from './pages/Auth'
import { DayPage } from './pages/DayPage'
import { todayISO } from './lib/pages'
import { ShelvesPage } from './pages/ShelvesPage'
import { PersonDetailPage } from './pages/PersonDetailPage'
import { TocPage } from './pages/TocPage'

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
        <Route path="/shelves" element={<RequireAuth><ShelvesPage /></RequireAuth>} />
        <Route path="/people/:id" element={<RequireAuth><PersonDetailPage /></RequireAuth>} />
        <Route path="/toc" element={<RequireAuth><TocPage /></RequireAuth>} />
        <Route path="*" element={<Navigate to={`/day/${todayISO()}`} replace />} />
      </Routes>
    </div>
  )
}

export default App
