import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

import toast from 'react-hot-toast'

import {
  Users,
  UserPlus,
  Briefcase,
  Building2,
  User,
  Edit,
  Power
} from 'lucide-react'

import api from '../services/api'
import Topbar from '../components/Topbar'
import SkeletonCard from '../components/SkeletonCard'

function Colaboradores() {
  const [colaboradores, setColaboradores] = useState([])
  const [loading, setLoading] = useState(true)

  const [nome, setNome] = useState('')
  const [setor, setSetor] = useState('')
  const [cargo, setCargo] = useState('')

  const [editandoId, setEditandoId] = useState(null)
  const [editNome, setEditNome] = useState('')
  const [editSetor, setEditSetor] = useState('')
  const [editCargo, setEditCargo] = useState('')
  const [editStatus, setEditStatus] = useState('Ativo')

  async function carregarColaboradores() {
    try {
      setLoading(true)
      const response = await api.get('/colaboradores')
      setColaboradores(response.data)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar colaboradores')
    } finally {
      setLoading(false)
    }
  }

  async function cadastrarColaborador(e) {
    e.preventDefault()

    try {
      await api.post('/colaboradores', {
        nome,
        setor,
        cargo
      })

      toast.success('Colaborador cadastrado com sucesso 🚀')

      setNome('')
      setSetor('')
      setCargo('')

      carregarColaboradores()
    } catch (error) {
      console.error(error)

      toast.error(
        error.response?.data?.erro ||
        'Erro ao cadastrar colaborador'
      )
    }
  }

  function iniciarEdicao(colaborador) {
    setEditandoId(colaborador.id)
    setEditNome(colaborador.nome)
    setEditSetor(colaborador.setor)
    setEditCargo(colaborador.cargo)
    setEditStatus(colaborador.status)
  }

  async function salvarEdicao(id) {
    try {
      await api.put(`/colaboradores/${id}`, {
        nome: editNome,
        setor: editSetor,
        cargo: editCargo,
        status: editStatus
      })

      toast.success('Colaborador atualizado com sucesso 🚀')

      setEditandoId(null)
      carregarColaboradores()
    } catch (error) {
      console.error(error)

      toast.error(
        error.response?.data?.erro ||
        'Erro ao atualizar colaborador'
      )
    }
  }

  async function alterarStatus(id, statusAtual) {
    try {
      const novoStatus =
        statusAtual === 'Ativo'
          ? 'Inativo'
          : 'Ativo'

      await api.patch(`/colaboradores/${id}/status`, {
        status: novoStatus
      })

      toast.success(`Colaborador ${novoStatus.toLowerCase()} com sucesso`)

      carregarColaboradores()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao alterar status')
    }
  }

  useEffect(() => {
    carregarColaboradores()
  }, [])

  const ativos = colaboradores.filter(
    (item) => item.status === 'Ativo'
  ).length

  const inativos = colaboradores.filter(
    (item) => item.status === 'Inativo'
  ).length

  return (
    <main className="flex-1 p-8 overflow-auto">
      <Topbar titulo="Colaboradores" />

      <section className="glass-card glow-blue rounded-[32px] p-8 mb-8">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
          <div>
            <p className="text-blue-400 font-bold mb-3">
              Gestão de Pessoas
            </p>

            <h2 className="text-5xl font-bold leading-tight">
              Cadastre, edite e acompanhe sua equipe
            </h2>

            <p className="text-slate-400 mt-4 max-w-2xl">
              Mantenha os colaboradores organizados por setor, cargo e status para alimentar os indicadores operacionais.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 min-w-[360px]">
            <MiniCard titulo="Total" valor={colaboradores.length} />
            <MiniCard titulo="Ativos" valor={ativos} verde />
            <MiniCard titulo="Inativos" valor={inativos} vermelho />
            <MiniCard
              titulo="Setores"
              valor={new Set(colaboradores.map((i) => i.setor)).size}
            />
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
              Novo Colaborador
            </h2>

            <p className="text-slate-400 text-sm">
              Adicione um novo membro para acompanhamento de desempenho.
            </p>
          </div>
        </div>

        <form
          onSubmit={cadastrarColaborador}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <Campo
            icon={User}
            type="text"
            placeholder="Nome do colaborador"
            value={nome}
            onChange={setNome}
            required
          />

          <Campo
            icon={Building2}
            type="text"
            placeholder="Setor"
            value={setor}
            onChange={setSetor}
            required
          />

          <Campo
            icon={Briefcase}
            type="text"
            placeholder="Cargo"
            value={cargo}
            onChange={setCargo}
            required
          />

          <button
            type="submit"
            className="md:col-span-3 bg-blue-600 hover:bg-blue-700 transition p-4 rounded-2xl font-bold shadow-lg shadow-blue-500/20"
          >
            Cadastrar Colaborador
          </button>
        </form>
      </section>

      <section className="glass-card rounded-[32px] p-7">
        <div className="flex items-center gap-3 mb-7">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
            <Users size={26} />
          </div>

          <div>
            <h2 className="text-2xl font-bold">
              Lista de Colaboradores
            </h2>

            <p className="text-slate-400 text-sm">
              Visualize, edite e ative/inative membros da equipe.
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
        ) : colaboradores.length === 0 ? (
          <div className="bg-slate-950/60 soft-border rounded-[32px] p-10 text-center">
            <Users size={48} className="mx-auto text-blue-400 mb-4" />

            <h2 className="text-3xl font-bold mb-2">
              Nenhum colaborador encontrado
            </h2>

            <p className="text-slate-400">
              Cadastre colaboradores para iniciar o acompanhamento de performance.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {colaboradores.map((colaborador, index) => (
              <motion.div
                key={colaborador.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.03 }}
                className="bg-slate-950/60 soft-border rounded-[28px] p-5 hover:bg-blue-950/20 transition"
              >
                {editandoId === colaborador.id ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                    <input
                      value={editNome}
                      onChange={(e) => setEditNome(e.target.value)}
                      className="bg-slate-950/70 soft-border rounded-2xl px-4 py-3 outline-none"
                    />

                    <input
                      value={editSetor}
                      onChange={(e) => setEditSetor(e.target.value)}
                      className="bg-slate-950/70 soft-border rounded-2xl px-4 py-3 outline-none"
                    />

                    <input
                      value={editCargo}
                      onChange={(e) => setEditCargo(e.target.value)}
                      className="bg-slate-950/70 soft-border rounded-2xl px-4 py-3 outline-none"
                    />

                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="bg-slate-950/70 soft-border rounded-2xl px-4 py-3 outline-none"
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Inativo">Inativo</option>
                    </select>

                    <button
                      onClick={() => salvarEdicao(colaborador.id)}
                      className="bg-green-600 hover:bg-green-700 transition p-3 rounded-2xl font-bold"
                    >
                      Salvar
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border border-blue-400/20 bg-slate-900">
                        {colaborador.foto_url ? (
                          <img
                            src={colaborador.foto_url}
                            alt={colaborador.nome}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-blue-400 text-2xl font-bold">
                            {colaborador.nome?.charAt(0)}
                          </div>
                        )}
                      </div>

                      <div>
                        <a
                          href={`/colaborador/${colaborador.id}`}
                          className="text-xl font-bold hover:text-blue-400 transition"
                        >
                          {colaborador.nome}
                        </a>

                        <p className="text-slate-400 text-sm mt-1">
                          {colaborador.setor} • {colaborador.cargo}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Status status={colaborador.status} />

                      <button
                        onClick={() => iniciarEdicao(colaborador)}
                        className="flex items-center gap-2 bg-yellow-500/15 text-yellow-400 px-4 py-2 rounded-2xl font-bold hover:bg-yellow-500/25 transition"
                      >
                        <Edit size={16} />
                        Editar
                      </button>

                      <button
                        onClick={() =>
                          alterarStatus(
                            colaborador.id,
                            colaborador.status
                          )
                        }
                        className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold transition ${
                          colaborador.status === 'Ativo'
                            ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25'
                            : 'bg-green-500/15 text-green-400 hover:bg-green-500/25'
                        }`}
                      >
                        <Power size={16} />
                        {colaborador.status === 'Ativo'
                          ? 'Inativar'
                          : 'Ativar'}
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

function Status({ status }) {
  const ativo = status === 'Ativo'

  return (
    <span
      className={`px-4 py-2 rounded-full text-sm font-bold ${
        ativo
          ? 'bg-green-500/15 text-green-400'
          : 'bg-red-500/15 text-red-400'
      }`}
    >
      {status}
    </span>
  )
}

export default Colaboradores