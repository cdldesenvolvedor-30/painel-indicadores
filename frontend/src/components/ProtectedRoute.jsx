import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ children }) {
  const { usuario, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        Carregando...
      </div>
    )
  }

  if (!usuario) {
    return <Navigate to="/login" />
  }

  return children
}

export default ProtectedRoute