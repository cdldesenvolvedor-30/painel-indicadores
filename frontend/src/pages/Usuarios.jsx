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

function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [perfil, setPerfil] = useState('usuario')
  const [setor, setSetor] = useState('')

  const [editandoId, setEditandoId] = useState(null)
  const [editNome, setEditNome] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPerfil, setEditPerfil] = useState('usuario')
  const [editSetor, setEditSetor] = useState('')
  const [editStatus, setEditStatus] = useState('Ativo')

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
        setor
      })

      toast.success('Usuário cadastrado com sucesso 🚀')

      setNome('')
      setEmail('')
      setSenha('')
      setPerfil('usuario')
      setSetor('')

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
  }

  async function salvarEdicao(id) {
    try {
      await api.put(`/usuarios/${id}`, {
        nome: editNome,
        email: editEmail,
        perfil: editPerfil,
        setor: editSetor,
        status: editStatus
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

  const diretoria = usuarios.filter(
    (item) => item.perfil === 'diretoria'
  ).length

  const gestores = usuarios.filter(
    (item) => item.perfil === 'gestor'
  ).length

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
              Cadastre usuários, vincule setores e prepare permissões futuras por perfil.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 min-w-[360px]">
            <MiniCard titulo="Usuários" valor={usuarios.length} />
            <MiniCard titulo="Admins" valor={admins} vermelho />
            <MiniCard titulo="Diretoria" valor={diretoria} azul />
            <MiniCard titulo="Gestores" valor={gestores} verde />
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
            onChange={setPerfil}
          >
            <option value="usuario">Usuário</option>
            <option value="gestor">Gestor</option>
            <option value="supervisor">Supervisor</option>
            <option value="diretoria">Diretoria</option>
            <option value="admin">Administrador</option>
          </CampoSelect>

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
                      onChange={(e) => setEditPerfil(e.target.value)}
                      className="bg-slate-950/70 soft-border rounded-2xl px-4 py-3 outline-none"
                    >
                      <option value="usuario">Usuário</option>
                      <option value="gestor">Gestor</option>
                      <option value="supervisor">Supervisor</option>
                      <option value="diretoria">Diretoria</option>
                      <option value="admin">Administrador</option>
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
                      onClick={() => salvarEdicao(usuario.id)}
                      className="bg-green-600 hover:bg-green-700 transition p-3 rounded-2xl font-bold flex items-center justify-center gap-2"
                    >
                      <Save size={16} />
                      Salvar
                    </button>
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
    </main>
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
    gestor: 'bg-green-500/15 text-green-400',
    supervisor: 'bg-yellow-500/15 text-yellow-400',
    usuario: 'bg-slate-500/15 text-slate-300'
  }

  return (
    <span
      className={`px-4 py-2 rounded-full text-sm font-bold ${estilos[perfil] || estilos.usuario}`}
    >
      <BadgeCheck size={15} className="inline mr-2" />
      {perfil}
    </span>
  )
}

export default Usuarios