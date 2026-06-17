import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

import toast from 'react-hot-toast'

import {
  Shield,
  UserPlus,
  Mail,
  Lock,
  User,
  BadgeCheck,
  Camera,
  Building2,
  Edit,
  Save
} from 'lucide-react'

import api from '../services/api'
import Topbar from '../components/Topbar'
import SkeletonCard from '../components/SkeletonCard'

const PERFIS = [
  { value: 'usuario', label: 'Usuário' },
  { value: 'gestao', label: 'Gestão' },
  { value: 'supervisao', label: 'Supervisão' },
  { value: 'gerencia', label: 'Gerência' },
  { value: 'diretoria', label: 'Diretoria' },
  { value: 'admin', label: 'Administrador' }
]

const TODOS_INDICADORES = {
  Digisac: ['Indicadores', 'Mapa de Performance', 'Classificação', 'Alertas', 'CRM Atendimento', 'Meta x Resultado', 'Metas/KPIs'],
  Shift: [],
  Gestão: ['Colaboradores', 'Integrações', 'Usuários', 'Auditoria']
}

const PERMISSOES_POR_PERFIL = {
  admin: {
    Digisac: ['Indicadores', 'Mapa de Performance', 'Classificação', 'Alertas', 'CRM Atendimento', 'Meta x Resultado', 'Metas/KPIs'],
    Shift: [],
    Gestão: ['Colaboradores', 'Integrações', 'Usuários', 'Auditoria']
  },

  diretoria: {
    Digisac: ['Indicadores', 'Mapa de Performance', 'Classificação', 'Alertas', 'CRM Atendimento', 'Meta x Resultado', 'Metas/KPIs'],
    Shift: [],
    Gestão: []
  },

  gerencia: {
    Digisac: ['Indicadores', 'Mapa de Performance', 'Classificação', 'Alertas', 'CRM Atendimento', 'Meta x Resultado', 'Metas/KPIs'],
    Shift: [],
    Gestão: []
  },

  gestao: {
    Digisac: [],
    Shift: [],
    Gestão: []
  },

  supervisao: {
    Digisac: ['Indicadores', 'Mapa de Performance', 'Classificação', 'Alertas'],
    Shift: [],
    Gestão: []
  },

  usuario: {
    Digisac: ['Indicadores'],
    Shift: [],
    Gestão: []
  }
}

function clonarPermissoes(permissoes) {
  return {
    Digisac: [...(permissoes?.Digisac || [])],
    Shift: [...(permissoes?.Shift || [])],
    Gestão: [...(permissoes?.Gestão || [])]
  }
}

function permissoesDoPerfil(perfil) {
  return clonarPermissoes(PERMISSOES_POR_PERFIL[perfil] || PERMISSOES_POR_PERFIL.usuario)
}

function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [perfil, setPerfil] = useState('usuario')
  const [setor, setSetor] = useState('')
  const [permissoes, setPermissoes] = useState(permissoesDoPerfil('usuario'))

  const [editandoId, setEditandoId] = useState(null)
  const [editNome, setEditNome] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPerfil, setEditPerfil] = useState('usuario')
  const [editSetor, setEditSetor] = useState('')
  const [editStatus, setEditStatus] = useState('Ativo')
  const [editPermissoes, setEditPermissoes] = useState(permissoesDoPerfil('usuario'))

  const [modalSenhaAberto, setModalSenhaAberto] = useState(false)
  const [usuarioSenha, setUsuarioSenha] = useState(null)
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')

  function alterarPerfilNovo(valor) {
    setPerfil(valor)
    setPermissoes(permissoesDoPerfil(valor))
  }

  function alterarPerfilEdicao(valor) {
    setEditPerfil(valor)
    setEditPermissoes(permissoesDoPerfil(valor))
  }

  async function carregarUsuarios() {
    try {
      setLoading(true)

      const response = await api.get('/usuarios')

      setUsuarios(response.data)
    } catch (error) {
      console.error(error)

      toast.error('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  async function cadastrarUsuario(e) {
    e.preventDefault()

    try {
      await api.post('/usuarios', {
        nome,
        email,
        senha,
        perfil,
        setor,
        permissoes
      })

      toast.success('Usuário cadastrado com sucesso 🚀')

      setNome('')
      setEmail('')
      setSenha('')
      setPerfil('usuario')
      setSetor('')
      setPermissoes(permissoesDoPerfil('usuario'))

      carregarUsuarios()
    } catch (error) {
      console.error(error)

      toast.error(
        error.response?.data?.erro ||
        'Erro ao cadastrar usuário'
      )
    }
  }

  function iniciarEdicao(usuario) {
    setEditandoId(usuario.id)

    setEditNome(usuario.nome)
    setEditEmail(usuario.email)
    setEditPerfil(usuario.perfil)
    setEditSetor(usuario.setor || '')
    setEditStatus(usuario.status || 'Ativo')
    setEditPermissoes(usuario.permissoes ? clonarPermissoes(usuario.permissoes) : permissoesDoPerfil(usuario.perfil))
  }

  async function salvarEdicao(id) {
    try {
      await api.put(`/usuarios/${id}`, {
        nome: editNome,
        email: editEmail,
        perfil: editPerfil,
        setor: editSetor,
        status: editStatus,
        permissoes: editPermissoes
      })

      toast.success('Usuário atualizado com sucesso 🚀')

      setEditandoId(null)

      carregarUsuarios()
    } catch (error) {
      console.error(error)

      toast.error(
        error.response?.data?.erro ||
        'Erro ao atualizar usuário'
      )
    }
  }

  function abrirModalSenha(usuario) {
    setUsuarioSenha(usuario)
    setNovaSenha('')
    setConfirmarSenha('')
    setModalSenhaAberto(true)
  }

  function fecharModalSenha() {
    setModalSenhaAberto(false)
    setUsuarioSenha(null)
    setNovaSenha('')
    setConfirmarSenha('')
  }

  async function confirmarRedefinicaoSenha() {
    if (!novaSenha || !confirmarSenha) {
      toast.error('Preencha os dois campos de senha')
      return
    }

    if (novaSenha.length < 6) {
      toast.error('A senha precisa ter pelo menos 6 caracteres')
      return
    }

    if (novaSenha !== confirmarSenha) {
      toast.error('As senhas não conferem')
      return
    }

    try {
      await api.patch(`/usuarios/${usuarioSenha.id}/redefinir-senha`, {
        novaSenha
      })

      toast.success('Senha redefinida com sucesso')

      fecharModalSenha()
    } catch (error) {
      console.error(error)

      toast.error(
        error.response?.data?.erro ||
        'Erro ao redefinir senha'
      )
    }
  }

  async function alterarFotoUsuario(event, id) {
    try {
      const file = event.target.files[0]

      if (!file) return

      const reader = new FileReader()

      reader.readAsDataURL(file)

      reader.onloadend = async () => {
        const base64 = reader.result

        await api.patch(`/usuarios/${id}/foto`, {
          foto_url: base64
        })

        toast.success('Foto atualizada com sucesso 📸')

        carregarUsuarios()
      }
    } catch (error) {
      console.error(error)

      toast.error('Erro ao atualizar foto do usuário')
    }
  }

  useEffect(() => {
    carregarUsuarios()
  }, [])

  const admins = usuarios.filter((item) => item.perfil === 'admin').length
  const diretoria = usuarios.filter((item) => item.perfil === 'diretoria').length
  const gerencia = usuarios.filter((item) => item.perfil === 'gerencia').length
  const gestao = usuarios.filter((item) => item.perfil === 'gestao').length

  return (
    <main className="flex-1 p-8 overflow-auto">
      <Topbar titulo="Usuários do Sistema" />

      <section className="glass-card glow-blue rounded-[32px] p-8 mb-8">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
          <div>
            <p className="text-blue-400 font-bold mb-3">
              Administração do Sistema
            </p>

            <h2 className="text-5xl font-bold leading-tight">
              Gerencie acessos, setores e permissões
            </h2>

            <p className="text-slate-400 mt-4 max-w-2xl">
              Cadastre usuários, vincule setores e defina o perfil de acesso ao Painel BI.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 min-w-[360px]">
            <MiniCard titulo="Usuários" valor={usuarios.length} />
            <MiniCard titulo="Admins" valor={admins} vermelho />
            <MiniCard titulo="Diretoria" valor={diretoria} azul />
            <MiniCard titulo="Gerência" valor={gerencia} verde />
          </div>
        </div>
      </section>

      <section className="glass-card rounded-[32px] p-7 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
            <UserPlus size={26} />
          </div>

          <div>
            <h2 className="text-2xl font-bold">
              Novo Usuário
            </h2>

            <p className="text-slate-400 text-sm">
              Cadastre um novo acesso ao sistema com setor vinculado.
            </p>
          </div>
        </div>

        <form
          onSubmit={cadastrarUsuario}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4"
        >
          <Campo
            icon={User}
            type="text"
            placeholder="Nome"
            value={nome}
            onChange={setNome}
            required
          />

          <Campo
            icon={Mail}
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={setEmail}
            required
          />

          <Campo
            icon={Lock}
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={setSenha}
            required
          />

          <Campo
            icon={Building2}
            type="text"
            placeholder="Setor"
            value={setor}
            onChange={setSetor}
          />

          <CampoSelect
            icon={Shield}
            value={perfil}
            onChange={alterarPerfilNovo}
          >
            {PERFIS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </CampoSelect>

          <div className="xl:col-span-5">
            <PermissoesEditor
              permissoes={permissoes}
              setPermissoes={setPermissoes}
            />
          </div>

          <button
            type="submit"
            className="xl:col-span-5 bg-blue-600 hover:bg-blue-700 transition p-4 rounded-2xl font-bold shadow-lg shadow-blue-500/20"
          >
            Cadastrar Usuário
          </button>
        </form>
      </section>

      <section className="glass-card rounded-[32px] p-7">
        <div className="flex items-center gap-3 mb-7">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
            <Shield size={26} />
          </div>

          <div>
            <h2 className="text-2xl font-bold">
              Usuários Cadastrados
            </h2>

            <p className="text-slate-400 text-sm">
              Lista de acessos cadastrados na plataforma.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="space-y-4">
            {usuarios.map((usuario, index) => (
              <motion.div
                key={usuario.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  delay: index * 0.03
                }}
                className="bg-slate-950/60 soft-border rounded-[28px] p-5 hover:bg-blue-950/20 transition"
              >
                {editandoId === usuario.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
                      <input
                        value={editNome}
                        onChange={(e) => setEditNome(e.target.value)}
                        className="bg-slate-950/70 soft-border rounded-2xl px-4 py-3 outline-none"
                      />

                      <input
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="bg-slate-950/70 soft-border rounded-2xl px-4 py-3 outline-none"
                      />

                      <input
                        value={editSetor}
                        onChange={(e) => setEditSetor(e.target.value)}
                        placeholder="Setor"
                        className="bg-slate-950/70 soft-border rounded-2xl px-4 py-3 outline-none"
                      />

                      <select
                        value={editPerfil}
                        onChange={(e) => alterarPerfilEdicao(e.target.value)}
                        className="bg-slate-950/70 soft-border rounded-2xl px-4 py-3 outline-none"
                      >
                        {PERFIS.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>

                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="bg-slate-950/70 soft-border rounded-2xl px-4 py-3 outline-none"
                      >
                        <option value="Ativo">Ativo</option>
                        <option value="Inativo">Inativo</option>
                      </select>

                      <button
                        onClick={() => abrirModalSenha(usuario)}
                        className="flex items-center gap-2 bg-blue-500/15 text-blue-400 px-4 py-2 rounded-2xl font-bold hover:bg-blue-500/25 transition"
                      >
                        <Lock size={16} />
                        Redefinir senha
                      </button>
                      
                      <button
                        onClick={() => salvarEdicao(usuario.id)}
                        className="bg-green-600 hover:bg-green-700 transition p-3 rounded-2xl font-bold flex items-center justify-center gap-2"
                      >
                        <Save size={16} />
                        Salvar
                      </button>
                    </div>

                    <PermissoesEditor
                      permissoes={editPermissoes}
                      setPermissoes={setEditPermissoes}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-blue-400/20 bg-slate-900">
                          {usuario.foto_url ? (
                            <img
                              src={usuario.foto_url}
                              alt={usuario.nome}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-blue-400 text-2xl font-bold">
                              {usuario.nome?.charAt(0)}
                            </div>
                          )}
                        </div>

                        <label className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 transition flex items-center justify-center cursor-pointer shadow-lg border-2 border-slate-950">
                          <Camera size={15} />

                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) =>
                              alterarFotoUsuario(
                                event,
                                usuario.id
                              )
                            }
                          />
                        </label>
                      </div>

                      <div>
                        <h3 className="text-xl font-bold">
                          {usuario.nome}
                        </h3>

                        <p className="text-slate-400 text-sm mt-1">
                          {usuario.email}
                        </p>

                        <p className="text-slate-500 text-xs mt-1">
                          Setor: {usuario.setor || 'Não informado'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Badge perfil={usuario.perfil} />

                      <span
                        className={`px-4 py-2 rounded-full text-sm font-bold ${
                          usuario.status === 'Ativo'
                            ? 'bg-green-500/15 text-green-400'
                            : 'bg-red-500/15 text-red-400'
                        }`}
                      >
                        {usuario.status}
                      </span>

                      <button
                        onClick={() => iniciarEdicao(usuario)}
                        className="flex items-center gap-2 bg-yellow-500/15 text-yellow-400 px-4 py-2 rounded-2xl font-bold hover:bg-yellow-500/25 transition"
                      >
                        <Edit size={16} />
                        Editar
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {modalSenhaAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-xl bg-[#050b18] border border-blue-500/20 rounded-[32px] p-8 shadow-2xl shadow-blue-500/10">
            <div className="flex items-start justify-between mb-8">
              <div>
                <p className="text-blue-400 font-bold mb-2">
                  Segurança de acesso
                </p>

                <h2 className="text-3xl font-bold text-white">
                  Redefinir senha
                </h2>

                <p className="text-slate-400 text-sm mt-3">
                  Defina uma nova senha para <strong className="text-white">{usuarioSenha?.nome}</strong>.
                </p>
              </div>

              <button
                type="button"
                onClick={fecharModalSenha}
                className="w-11 h-11 rounded-2xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">
                  Nova senha
                </label>

                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-4 top-[18px] text-slate-400"
                  />

                  <input
                    type="password"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Digite a nova senha"
                    className="w-full bg-slate-950/70 soft-border rounded-2xl pl-11 pr-4 py-4 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-2 block">
                  Confirmar senha
                </label>

                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-4 top-[18px] text-slate-400"
                  />

                  <input
                    type="password"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Confirme a nova senha"
                    className="w-full bg-slate-950/70 soft-border rounded-2xl pl-11 pr-4 py-4 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <p className="text-slate-500 text-xs">
                A senha precisa ter no mínimo 6 caracteres e os dois campos precisam ser iguais.
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mt-8">
              <button
                type="button"
                onClick={fecharModalSenha}
                className="flex-1 bg-slate-800 text-slate-300 py-4 rounded-2xl font-bold hover:bg-slate-700 transition"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmarRedefinicaoSenha}
                className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-500 transition shadow-lg shadow-blue-500/25"
              >
                Salvar nova senha
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function PermissoesEditor({ permissoes, setPermissoes }) {
  function moduloEstaAtivo(modulo) {
    const indicadores = TODOS_INDICADORES[modulo] || []

    if (indicadores.length === 0) {
      return Boolean(permissoes[modulo]?.includes('__MODULO__'))
    }

    return indicadores.every((indicador) =>
      (permissoes[modulo] || []).includes(indicador)
    )
  }

  function alternarModulo(modulo) {
    const indicadores = TODOS_INDICADORES[modulo] || []

    setPermissoes((atual) => {
      const novo = clonarPermissoes(atual)
      const ativo = moduloEstaAtivo(modulo)

      if (indicadores.length === 0) {
        novo[modulo] = ativo ? [] : ['__MODULO__']
      } else {
        novo[modulo] = ativo ? [] : [...indicadores]
      }

      return novo
    })
  }

  function alternarIndicador(modulo, indicador) {
    setPermissoes((atual) => {
      const novo = clonarPermissoes(atual)
      const listaAtual = novo[modulo] || []

      if (listaAtual.includes(indicador)) {
        novo[modulo] = listaAtual.filter((item) => item !== indicador)
      } else {
        novo[modulo] = [...listaAtual, indicador]
      }

      return novo
    })
  }

  return (
    <div className="bg-slate-950/50 soft-border rounded-[24px] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-bold text-white">
            Permissões do usuário
          </p>

          <p className="text-slate-500 text-xs mt-1">
            Você pode marcar ou desmarcar cada aba e indicador manualmente.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {Object.entries(TODOS_INDICADORES).map(([modulo, indicadores]) => (
          <div key={modulo} className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800">
            <label className="flex items-center gap-3 font-bold mb-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={moduloEstaAtivo(modulo)}
                onChange={() => alternarModulo(modulo)}
                className="accent-blue-600"
              />
              {modulo}
            </label>

            {indicadores.length === 0 ? (
              <p className="text-slate-500 text-sm ml-6">
                Nenhum indicador cadastrado ainda.
              </p>
            ) : (
              <div className="space-y-2 ml-6">
                {indicadores.map((indicador) => (
                  <label key={indicador} className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={(permissoes[modulo] || []).includes(indicador)}
                      onChange={() => alternarIndicador(modulo, indicador)}
                      className="accent-blue-600"
                    />
                    {indicador}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function MiniCard({ titulo, valor, verde, vermelho }) {
  return (
    <div className="bg-slate-950/60 soft-border rounded-3xl p-5">
      <p className="text-slate-400 text-sm">
        {titulo}
      </p>

      <p
        className={`text-3xl font-bold mt-2 ${
          verde
            ? 'text-green-400'
            : vermelho
            ? 'text-red-400'
            : 'text-blue-400'
        }`}
      >
        {valor}
      </p>
    </div>
  )
}

function Campo({ icon: Icon, value, onChange, ...props }) {
  return (
    <div className="relative">
      <Icon
        size={18}
        className="absolute left-4 top-[18px] text-slate-400"
      />

      <input
        {...props}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-950/70 soft-border rounded-2xl pl-11 pr-4 py-4 outline-none"
      />
    </div>
  )
}

function CampoSelect({ icon: Icon, value, onChange, children }) {
  return (
    <div className="relative">
      <Icon
        size={18}
        className="absolute left-4 top-[18px] text-slate-400"
      />

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-950/70 soft-border rounded-2xl pl-11 pr-4 py-4 outline-none"
      >
        {children}
      </select>
    </div>
  )
}

function Badge({ perfil }) {
  const estilos = {
    admin: 'bg-red-500/15 text-red-400',
    diretoria: 'bg-blue-500/15 text-blue-400',
    gerencia: 'bg-cyan-500/15 text-cyan-400',
    gestao: 'bg-green-500/15 text-green-400',
    supervisao: 'bg-yellow-500/15 text-yellow-400',
    usuario: 'bg-slate-500/15 text-slate-300'
  }

  const labels = {
    admin: 'Administrador',
    diretoria: 'Diretoria',
    gerencia: 'Gerência',
    gestao: 'Gestão',
    supervisao: 'Supervisão',
    usuario: 'Usuário'
  }

  return (
    <span
      className={`px-4 py-2 rounded-full text-sm font-bold ${estilos[perfil] || estilos.usuario}`}
    >
      <BadgeCheck size={15} className="inline mr-2" />
      {labels[perfil] || perfil}
    </span>
  )
}

export default Usuarios
