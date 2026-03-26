import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './components/auth/AuthContext'
import CatalogPage from './pages/CatalogPage'
import DatasetPage from './pages/DatasetPage'
import StatusPage from './pages/StatusPage'
import LoginPage from './pages/LoginPage'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/dataset/:id" element={<DatasetPage />} />
        <Route path="/status" element={<StatusPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
