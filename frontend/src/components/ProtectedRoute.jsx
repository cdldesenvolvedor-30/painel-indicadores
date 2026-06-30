import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ children }) {
  const location = useLocation()
  const { usuario, loading, usuarioPodeAcessarRota } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        Carregando...
      </div>
    )
  }

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  if (!usuarioPodeAcessarRota(location.pathname)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default ProtectedRoute
