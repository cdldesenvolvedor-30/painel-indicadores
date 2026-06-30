import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'

import api from '../services/api'

const AuthContext = createContext()

const PERMISSOES_STORAGE_KEY = 'usuarios_permissoes_customizadas'

export const PERMISSAO_MODULO = '__MODULO__'

export const TODOS_INDICADORES = {
  Digisac: [
    'Indicadores',
    'Mapa de Performance',
    'Classificação',
    'Alertas',
    'CRM Atendimento',
    'Meta x Resultado',
    'Metas/KPIs'
  ],
  Shift: [],
  Atendimento: [
    'Compliance das Unidades'
  ],
  Diretoria: [
    'OX360 Financeiro'
  ],
  Gestão: [
    'Colaboradores',
    'Integrações',
    'Usuários',
    'Auditoria'
  ]
}

export const PERMISSOES_POR_PERFIL = {
  admin: {
    Digisac: [...TODOS_INDICADORES.Digisac],
    Shift: [PERMISSAO_MODULO],
    Atendimento: [...TODOS_INDICADORES.Atendimento],
    Diretoria: [...TODOS_INDICADORES.Diretoria],
    Gestão: [...TODOS_INDICADORES.Gestão]
  },
  diretoria: {
    Digisac: [...TODOS_INDICADORES.Digisac],
    Shift: [PERMISSAO_MODULO],
    Atendimento: [...TODOS_INDICADORES.Atendimento],
    Diretoria: [...TODOS_INDICADORES.Diretoria],
    Gestão: []
  },
  gerencia: {
    Digisac: [...TODOS_INDICADORES.Digisac],
    Shift: [PERMISSAO_MODULO],
    Atendimento: [...TODOS_INDICADORES.Atendimento],
    Diretoria: [...TODOS_INDICADORES.Diretoria],
    Gestão: []
  },
  gestao: {
    Digisac: [],
    Shift: [PERMISSAO_MODULO],
    Atendimento: [...TODOS_INDICADORES.Atendimento],
    Diretoria: [],
    Gestão: []
  },
  supervisao: {
    Digisac: ['Indicadores', 'Mapa de Performance', 'Classificação', 'Alertas'],
    Shift: [],
    Atendimento: [...TODOS_INDICADORES.Atendimento],
    Diretoria: [],
    Gestão: []
  },
  usuario: {
    Digisac: ['Indicadores'],
    Shift: [],
    Atendimento: [],
    Diretoria: [],
    Gestão: []
  }
}

export const PERMISSOES_POR_ROTA = {
  '/indicadores': { modulo: 'Digisac', indicador: 'Indicadores' },
  '/mapa-performance': { modulo: 'Digisac', indicador: 'Mapa de Performance' },
  '/ranking': { modulo: 'Digisac', indicador: 'Classificação' },
  '/alertas': { modulo: 'Digisac', indicador: 'Alertas' },
  '/crm': { modulo: 'Digisac', indicador: 'CRM Atendimento' },
  '/comparativo-metas': { modulo: 'Digisac', indicador: 'Meta x Resultado' },
  '/metas': { modulo: 'Digisac', indicador: 'Metas/KPIs' },
  '/atendimento-compliance': { modulo: 'Atendimento', indicador: 'Compliance das Unidades' },
  '/ox360-financeiro': { modulo: 'Diretoria', indicador: 'OX360 Financeiro' },
  '/colaboradores': { modulo: 'Gestão', indicador: 'Colaboradores' },
  '/integracoes': { modulo: 'Gestão', indicador: 'Integrações' },
  '/usuarios': { modulo: 'Gestão', indicador: 'Usuários' },
  '/logs': { modulo: 'Gestão', indicador: 'Auditoria' }
}

export function clonarPermissoes(permissoes = {}) {
  return Object.keys(TODOS_INDICADORES).reduce((acc, modulo) => {
    acc[modulo] = Array.isArray(permissoes?.[modulo])
      ? [...permissoes[modulo]]
      : []

    return acc
  }, {})
}

function parsePermissoes(permissoes) {
  if (!permissoes) return null

  if (typeof permissoes === 'string') {
    try {
      return JSON.parse(permissoes)
    } catch {
      return null
    }
  }

  return permissoes
}

function chaveUsuarioPermissoes(usuario) {
  if (!usuario) return null
  return usuario.id ? `id:${usuario.id}` : `email:${usuario.email}`
}

function buscarPermissoesCustomizadas(usuario) {
  const chave = chaveUsuarioPermissoes(usuario)
  if (!chave) return null

  try {
    const mapa = JSON.parse(localStorage.getItem(PERMISSOES_STORAGE_KEY) || '{}')
    return mapa[chave] || null
  } catch {
    return null
  }
}

export function normalizarPermissoes(usuario) {
  const perfil = usuario?.perfil || 'usuario'
  const permissoesBase = PERMISSOES_POR_PERFIL[perfil] || PERMISSOES_POR_PERFIL.usuario

  // Prioridade total para permissões salvas manualmente.
  // Isso evita que o perfil (Diretoria, Gerência etc.) volte a marcar tudo após salvar.
  const permissoesCustomizadas = buscarPermissoesCustomizadas(usuario)
  const permissoesRecebidas = parsePermissoes(usuario?.permissoes)
  const permissoesFinais = permissoesCustomizadas || permissoesRecebidas

  if (permissoesFinais) {
    return clonarPermissoes(permissoesFinais)
  }

  return clonarPermissoes(permissoesBase)
}

export function usuarioTemPermissao(usuario, modulo, indicador) {
  if (!usuario) return false
  if (usuario.perfil === 'admin') return true

  const permissoes = normalizarPermissoes(usuario)
  const permissoesModulo = permissoes?.[modulo] || []

  if (!indicador) {
    const indicadores = TODOS_INDICADORES[modulo] || []

    if (indicadores.length === 0) {
      return permissoesModulo.includes(PERMISSAO_MODULO)
    }

    return permissoesModulo.length > 0
  }

  return permissoesModulo.includes(indicador)
}

export function usuarioPodeAcessarRota(usuario, pathname) {
  if (!usuario) return false
  if (usuario.perfil === 'admin') return true

  if (pathname === '/' || pathname === '/dashboard' || pathname === '/login') {
    return true
  }

  const permissao = PERMISSOES_POR_ROTA[pathname]

  if (!permissao) {
    return true
  }

  return usuarioTemPermissao(usuario, permissao.modulo, permissao.indicador)
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem('usuario')

    if (usuarioSalvo) {
      try {
        const usuarioParseado = JSON.parse(usuarioSalvo)
        const usuarioNormalizado = {
          ...usuarioParseado,
          permissoes: normalizarPermissoes(usuarioParseado)
        }

        localStorage.setItem('usuario', JSON.stringify(usuarioNormalizado))
        setUsuario(usuarioNormalizado)
      } catch {
        localStorage.removeItem('usuario')
        localStorage.removeItem('token')
      }
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
      const usuarioNormalizado = {
        ...dados.usuario,
        permissoes: normalizarPermissoes(dados.usuario)
      }

      localStorage.setItem('token', dados.token)
      localStorage.setItem('usuario', JSON.stringify(usuarioNormalizado))

      setUsuario(usuarioNormalizado)

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
    setUsuario((usuarioAtual) => {
      if (!usuarioAtual) return usuarioAtual

      const usuarioAtualizado = {
        ...usuarioAtual,
        ...dadosAtualizados
      }

      usuarioAtualizado.permissoes = normalizarPermissoes(usuarioAtualizado)

      localStorage.setItem('usuario', JSON.stringify(usuarioAtualizado))

      return usuarioAtualizado
    })
  }

  const value = useMemo(() => ({
    usuario,
    login,
    logout,
    loading,
    atualizarUsuarioLocal,
    usuarioTemPermissao: (modulo, indicador) => usuarioTemPermissao(usuario, modulo, indicador),
    usuarioPodeAcessarRota: (pathname) => usuarioPodeAcessarRota(usuario, pathname)
  }), [usuario, loading])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
