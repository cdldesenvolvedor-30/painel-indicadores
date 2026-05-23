import { useEffect, useMemo, useState } from 'react'

import toast from 'react-hot-toast'

import {
  Users,
  Phone,
  Clock3,
  DollarSign,
  SmilePlus,
  BadgeDollarSign,
  FlaskConical,
  Activity,
  Search,
  Filter,
  RotateCcw,
  CalendarDays,
  Building2,
  User,
  VenusAndMars,
  MessageCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts'

import api from '../services/api'
import Topbar from '../components/Topbar'
import SkeletonCard from '../components/SkeletonCard'

function CRM() {
  const [loading, setLoading] = useState(true)

  const [resumo, setResumo] = useState(null)
  const [triagem, setTriagem] = useState([])
  const [performance, setPerformance] = useState([])
  const [exames, setExames] = useState([])
  const [atendimentos, setAtendimentos] = useState([])
  const [colaboradores, setColaboradores] = useState([])
  const [unidadesDigisac, setUnidadesDigisac] = useState([])
  const [usuariosDigisac, setUsuariosDigisac] = useState([])
  const [assuntosDigisac, setAssuntosDigisac] = useState([])

  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  const [unidade, setUnidade] = useState('')
  const [colaboradorId, setColaboradorId] = useState('')
  const [motivo, setMotivo] = useState('')
  const [sexo, setSexo] = useState('')
  const [exame, setExame] = useState('')
  const [busca, setBusca] = useState('')

  const filtros = {
    inicio,
    fim,
    unidade,
    colaboradorId,
    motivo,
    sexo,
    exame
  }

  useEffect(() => {
  carregarFiltrosDigisac()
}, [])

async function carregarFiltrosDigisac() {
  try {
    const [unidadesRes, usuariosRes, assuntosRes] = await Promise.all([
      api.get('/digisac/departamentos'),
      api.get('/digisac/usuarios'),
      api.get('/digisac/filas')
    ])

    setUnidadesDigisac(unidadesRes.data || [])
    setUsuariosDigisac(usuariosRes.data || [])
    setAssuntosDigisac(assuntosRes.data || [])
  } catch (error) {
    console.error(error)
    toast.error('Erro ao carregar filtros da Digisac')
  }
}
  
  async function carregarCRM() {
    try {
      setLoading(true)

      const [
        resumoResponse,
        triagemResponse,
        performanceResponse,
        examesResponse,
        atendimentosResponse,
        colaboradoresResponse
      ] = await Promise.all([
        api.get('/crm/resumo', { params: filtros }),
        api.get('/crm/triagem', { params: filtros }),
        api.get('/crm/performance', { params: filtros }),
        api.get('/crm/exames', { params: filtros }),
        api.get('/crm/atendimentos', { params: filtros }),
        api.get('/colaboradores')
      ])

      setResumo(resumoResponse.data)
      setTriagem(triagemResponse.data)
      setPerformance(performanceResponse.data)
      setExames(examesResponse.data)
      setAtendimentos(atendimentosResponse.data)
      setColaboradores(
        colaboradoresResponse.data.filter((item) => item.status === 'Ativo')
      )
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar CRM')
    } finally {
      setLoading(false)
    }
  }

  function limparFiltros() {
    setInicio('')
    setFim('')
    setUnidade('')
    setColaboradorId('')
    setMotivo('')
    setSexo('')
    setExame('')
    setBusca('')
  }

  useEffect(() => {
    carregarCRM()
  }, [inicio, fim, unidade, colaboradorId, motivo, sexo, exame])

  const unidades = useMemo(() => {
    return [...new Set(atendimentos.map((item) => item.unidade).filter(Boolean))]
  }, [atendimentos])

  const motivos = useMemo(() => {
    return [...new Set(atendimentos.map((item) => item.motivo_contato).filter(Boolean))]
  }, [atendimentos])

  const atendimentosFiltrados = atendimentos.filter((item) => {
    const termo = busca.toLowerCase()

    return (
      item.paciente_nome?.toLowerCase().includes(termo) ||
      item.paciente_telefone?.toLowerCase().includes(termo) ||
      item.exame_interesse?.toLowerCase().includes(termo) ||
      item.motivo_contato?.toLowerCase().includes(termo) ||
      item.unidade?.toLowerCase().includes(termo) ||
      item.colaborador?.toLowerCase().includes(termo)
    )
  })

  const cores = [
    '#2563eb',
    '#22c55e',
    '#eab308',
    '#ef4444',
    '#a855f7',
    '#06b6d4'
  ]

  return (
    <main className="flex-1 p-8 overflow-auto">
      <Topbar titulo="CRM Atendimento Virtual" />

      {loading ? (
        <section className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </section>
      ) : (
        <>
          <section className="mb-8">
            <h1 className="text-5xl font-bold">
              CRM Atendimento Virtual
            </h1>

            <p className="text-slate-400 mt-2 text-lg">
              Inteligência comercial, triagem de pacientes e performance do atendimento.
            </p>
          </section>

          <section className="glass-card rounded-[28px] p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                <Filter size={24} />
              </div>

              <div>
                <h2 className="text-2xl font-bold">
                  Filtros Avançados do CRM
                </h2>

                <p className="text-slate-400 text-sm">
                  Filtre por unidade, colaborador, motivo, sexo, exame e período.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <CampoData label="Data inicial" value={inicio} onChange={setInicio} />
              <CampoData label="Data final" value={fim} onChange={setFim} />

              <CampoSelect icon={Building2} value={unidade} onChange={setUnidade}>
                <option value="">Todas as unidades</option>

                {unidades.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </CampoSelect>

              <CampoSelect icon={User} value={colaboradorId} onChange={setColaboradorId}>
                <option value="">Todos colaboradores</option>

                {colaboradores.map((colaborador) => (
                  <option key={colaborador.id} value={colaborador.id}>
                    {colaborador.nome}
                  </option>
                ))}
              </CampoSelect>

              <CampoSelect icon={MessageCircle} value={motivo} onChange={setMotivo}>
                <option value="">Todos os motivos</option>

                {motivos.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </CampoSelect>

              <CampoSelect icon={VenusAndMars} value={sexo} onChange={setSexo}>
                <option value="">Todos os sexos</option>
                <option value="Feminino">Feminino</option>
                <option value="Masculino">Masculino</option>
                <option value="Outro">Outro</option>
                <option value="Não informado">Não informado</option>
              </CampoSelect>

              <Campo icon={FlaskConical} type="text" placeholder="Exame ou interesse" value={exame} onChange={setExame} />

              <button
                type="button"
                onClick={limparFiltros}
                className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 rounded-2xl font-bold transition"
              >
                <RotateCcw size={18} />
                Limpar filtros
              </button>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            <CardCRM titulo="Total de Contatos" valor={resumo?.total_contatos || 0} icon={Users} cor="blue" />
            <CardCRM titulo="Tempo Médio Espera" valor={`${resumo?.tempo_medio_espera || 0}s`} icon={Clock3} cor="yellow" />
            <CardCRM titulo="Tempo Médio Atendimento" valor={`${resumo?.tempo_medio_atendimento || 0}s`} icon={Phone} cor="green" />
            <CardCRM titulo="Receita Gerada" valor={`R$ ${Number(resumo?.valor_total_vendas || 0).toLocaleString('pt-BR')}`} icon={DollarSign} cor="purple" />
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <CardCRM titulo="Conversões" valor={resumo?.total_convertidos || 0} icon={BadgeDollarSign} cor="green" />
            <CardCRM titulo="Satisfação Média" valor={resumo?.satisfacao_media || 0} icon={SmilePlus} cor="yellow" />
            <CardCRM titulo="Total de Chamadas" valor={resumo?.total_chamadas || 0} icon={Activity} cor="blue" />
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
            <div className="glass-card rounded-[28px] p-6">
              <h2 className="text-2xl font-bold mb-6">
                Triagem de Pacientes
              </h2>

              <div className="h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={triagem}
                      dataKey="total"
                      nameKey="motivo_contato"
                      outerRadius={140}
                    >
                      {triagem.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={cores[index % cores.length]}
                        />
                      ))}
                    </Pie>

                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card rounded-[28px] p-6">
              <h2 className="text-2xl font-bold mb-6">
                Exames Mais Procurados
              </h2>

              <div className="space-y-4 max-h-[380px] overflow-auto">
                {exames.map((item, index) => (
                  <div
                    key={index}
                    className="bg-slate-950/60 soft-border rounded-2xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                        <FlaskConical size={22} />
                      </div>

                      <div>
                        <p className="font-bold">
                          {item.exame}
                        </p>

                        <p className="text-slate-400 text-sm">
                          {item.convertidos} convertidos
                        </p>
                      </div>
                    </div>

                    <span className="text-2xl font-bold">
                      {item.total}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="glass-card rounded-[28px] p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6">
              Performance por Unidade e Colaborador
            </h2>

            <div className="h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />

                  <XAxis
                    dataKey="colaborador"
                    stroke="#cbd5e1"
                  />

                  <YAxis stroke="#cbd5e1" />

                  <Tooltip />

                  <Bar
                    dataKey="total_atendimentos"
                    fill="#2563eb"
                    radius={[10, 10, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="glass-card rounded-[28px] p-6">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold">
                  Base de Contatos para Campanhas
                </h2>

                <p className="text-slate-400 text-sm mt-1">
                  Use os filtros para selecionar pacientes com maior chance de conversão.
                </p>
              </div>

              <div className="relative w-full xl:w-[360px]">
                <Search
                  size={18}
                  className="absolute left-4 top-[15px] text-slate-400"
                />

                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar paciente, exame, telefone..."
                  className="w-full bg-slate-950/70 soft-border rounded-2xl pl-11 pr-4 py-3 outline-none"
                />
              </div>
            </div>

            <div className="space-y-4 max-h-[560px] overflow-auto pr-2">
              {atendimentosFiltrados.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-950/60 soft-border rounded-2xl p-5 hover:bg-blue-950/20 transition"
                >
                  <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
                    <div>
                      <h3 className="text-xl font-bold">
                        {item.paciente_nome}
                      </h3>

                      <p className="text-slate-400 text-sm mt-1">
                        {item.paciente_telefone} • {item.unidade} • {item.colaborador || 'Sem atendente'}
                      </p>

                      <p className="text-slate-500 text-sm mt-2">
                        {item.motivo_contato} • {item.exame_interesse || 'Sem exame informado'} • {item.sexo || 'Sexo não informado'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                      <Info titulo="Espera" valor={`${item.tempo_espera_segundos}s`} />
                      <Info titulo="Atendimento" valor={`${item.tempo_atendimento_segundos}s`} />
                      <Info titulo="Satisfação" valor={item.satisfacao || '-'} />
                      <Info titulo="Venda" valor={item.converteu_venda ? 'Sim' : 'Não'} verde={item.converteu_venda} />
                    </div>
                  </div>
                </div>
              ))}

              {atendimentosFiltrados.length === 0 && (
                <div className="bg-slate-950/60 soft-border rounded-2xl p-10 text-center">
                  <p className="text-slate-400">
                    Nenhum contato encontrado com os filtros aplicados.
                  </p>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </main>
  )
}

function CardCRM({ titulo, valor, icon: Icon, cor }) {
  const cores = {
    blue: 'text-blue-400 bg-blue-500/15',
    green: 'text-green-400 bg-green-500/15',
    yellow: 'text-yellow-400 bg-yellow-500/15',
    purple: 'text-purple-400 bg-purple-500/15'
  }

  return (
    <div className="glass-card rounded-[28px] p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm">
            {titulo}
          </p>

          <h2 className="text-4xl font-bold mt-4">
            {valor}
          </h2>
        </div>

        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${cores[cor]}`}>
          <Icon size={30} />
        </div>
      </div>
    </div>
  )
}

function Campo({ icon: Icon, value, onChange, ...props }) {
  return (
    <div className="relative">
      <Icon size={18} className="absolute left-4 top-[18px] text-slate-400" />

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
      <Icon size={18} className="absolute left-4 top-[18px] text-slate-400" />

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

function Info({ titulo, valor, verde }) {
  return (
    <div className="bg-slate-900/60 soft-border rounded-2xl p-4">
      <p className="text-xs text-slate-500">
        {titulo}
      </p>

      <p className={`font-bold ${verde ? 'text-green-400' : ''}`}>
        {valor}
      </p>
    </div>
  )
}

function CampoData({ label, value, onChange }) {
  const [aberto, setAberto] = useState(false)
  const [dataBase, setDataBase] = useState(value ? new Date(value) : new Date())

  const ano = dataBase.getFullYear()
  const mes = dataBase.getMonth()

  const primeiroDia = new Date(ano, mes, 1).getDay()
  const totalDias = new Date(ano, mes + 1, 0).getDate()

  const dias = []

  for (let i = 0; i < primeiroDia; i++) {
    dias.push(null)
  }

  for (let dia = 1; dia <= totalDias; dia++) {
    dias.push(dia)
  }

  function selecionarDia(dia) {
    const data = new Date(ano, mes, dia)
    const formatada = data.toISOString().split('T')[0]

    onChange(formatada)
    setAberto(false)
  }

  function mudarMes(valor) {
    setDataBase(new Date(ano, mes + valor, 1))
  }

  function formatarData(data) {
    if (!data) return label

    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR')
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        className="w-full bg-slate-950/70 soft-border rounded-2xl pl-11 pr-4 py-4 outline-none text-left relative hover:border-blue-500/40 transition"
      >
        <CalendarDays size={18} className="absolute left-4 top-[18px] text-slate-400" />

        <span className={value ? 'text-white' : 'text-slate-400'}>
          {formatarData(value)}
        </span>
      </button>

      {aberto && (
        <div className="absolute z-50 mt-3 w-80 bg-[#020817] border border-blue-500/20 rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.55)] p-5">
          <div className="flex items-center justify-between mb-5">
            <button
              type="button"
              onClick={() => mudarMes(-1)}
              className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 flex items-center justify-center"
            >
              <ChevronLeft size={18} />
            </button>

            <h3 className="font-bold capitalize">
              {dataBase.toLocaleDateString('pt-BR', {
                month: 'long',
                year: 'numeric'
              })}
            </h3>

            <button
              type="button"
              onClick={() => mudarMes(1)}
              className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 flex items-center justify-center"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs text-slate-500 mb-2">
            <span>D</span>
            <span>S</span>
            <span>T</span>
            <span>Q</span>
            <span>Q</span>
            <span>S</span>
            <span>S</span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {dias.map((dia, index) => {
              const selecionado =
                value === new Date(ano, mes, dia).toISOString().split('T')[0]

              return (
                <button
                  key={index}
                  type="button"
                  disabled={!dia}
                  onClick={() => selecionarDia(dia)}
                  className={`h-10 rounded-xl text-sm font-semibold transition ${
                    !dia
                      ? 'opacity-0'
                      : selecionado
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                        : 'bg-slate-900 hover:bg-blue-600/20 text-slate-300'
                  }`}
                >
                  {dia}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              onChange('')
              setAberto(false)
            }}
            className="mt-5 w-full bg-slate-900 hover:bg-slate-800 rounded-2xl py-3 text-sm font-bold text-slate-300"
          >
            Limpar data
          </button>
        </div>
      )}
    </div>
  )
}

export default CRM
