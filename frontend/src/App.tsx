import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ClassProfilePage } from '@/pages/ClassProfilePage'
import { CreatePage } from '@/pages/CreatePage'
import { EditSheetPage } from '@/pages/EditSheetPage'
import { HomePage } from '@/pages/HomePage'
import { ImprovePage } from '@/pages/ImprovePage'
import { LoginPage } from '@/pages/LoginPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { useAuth } from '@/lib/auth'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  return user ? <Navigate to="/" replace /> : <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnly>
            <LoginPage />
          </PublicOnly>
        }
      />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="create" element={<CreatePage />} />
        <Route path="improve" element={<ImprovePage />} />
        <Route path="improve/:sheetId" element={<ImprovePage />} />
        <Route path="sheets/:sheetId/edit" element={<EditSheetPage />} />
        <Route path="class" element={<ClassProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
