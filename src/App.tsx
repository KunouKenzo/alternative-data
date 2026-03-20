import { Routes, Route } from 'react-router-dom'
import CatalogPage from './pages/CatalogPage'
import DatasetPage from './pages/DatasetPage'
import StatusPage from './pages/StatusPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<CatalogPage />} />
      <Route path="/dataset/:id" element={<DatasetPage />} />
      <Route path="/status" element={<StatusPage />} />
    </Routes>
  )
}

export default App
