import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Usuarios from './pages/Usuarios.jsx'
import Exportar from './pages/Exportar.jsx'
import CambiarPassword from './pages/CambiarPassword.jsx'
import Layout from './components/Layout.jsx'

function RequireAuth({ children }) {
  const token = localStorage.getItem('token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/usuarios" replace />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="exportar" element={<Exportar />} />
          <Route path="cambiar-password" element={<CambiarPassword />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
