import {
  createContext,
  useContext,
  useEffect,
  useState
} from 'react'

import api from '../services/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem('usuario')

    if (usuarioSalvo) {
      setUsuario(JSON.parse(usuarioSalvo))
    }

    setLoading(false)
  }, [])

  async function login(email, senha) {
    try {
      const response = await api.post('/auth/login', {
        email,
        senha
      })

      const dados = response.data

      localStorage.setItem('token', dados.token)
      localStorage.setItem('usuario', JSON.stringify(dados.usuario))

      setUsuario(dados.usuario)

      return true
    } catch (error) {
      return false
    }
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setUsuario(null)
  }

  function atualizarUsuarioLocal(dadosAtualizados) {
    const usuarioAtualizado = {
      ...usuario,
      ...dadosAtualizados
    }

    localStorage.setItem('usuario', JSON.stringify(usuarioAtualizado))
    setUsuario(usuarioAtualizado)
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, loading, atualizarUsuarioLocal }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
