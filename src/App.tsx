import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './components/auth/AuthContext'
import CatalogPage from './pages/CatalogPage'
import DatasetPage from './pages/DatasetPage'
import StatusPage from './pages/StatusPage'
import LoginPage from './pages/LoginPage'
import ArticlesPage from './pages/ArticlesPage'
import ArticleDetailPage from './pages/ArticleDetailPage'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/dataset/:id" element={<DatasetPage />} />
        <Route path="/status" element={<StatusPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/articles" element={<ArticlesPage />} />
        <Route path="/articles/:id" element={<ArticleDetailPage />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
