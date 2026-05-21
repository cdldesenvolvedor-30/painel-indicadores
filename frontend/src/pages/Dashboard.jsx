import { useEffect, useState } from 'react'

import {
  Headphones,
  ShoppingCart,
  DollarSign,
  Clock,
  TrendingUp,
  AlertTriangle,
  Phone,
  BadgePercent
} from 'lucide-react'

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts'

import api from '../services/api'

import Topbar from '../components/Topbar'
import SkeletonCard from '../components/SkeletonCard'
import FiltrosGlobais from '../components/FiltrosGlobais'

import { useFiltros } from '../context/FiltrosContext'

function Dashboard() {
  const [resumo, setResumo] = useState(null)
  const [ranking, setRanking] = useState([])
  const [alertas, setAlertas] = useState([])
  const [loading, setLoading] = useState(true)

  const { filtros } = useFiltros()

  async function carregarDados() {
    try {
      setLoading(true)

      const params = {
        inicio: filtros.inicio,
        fim: filtros.fim,
        setor: filtros.setor,
        colaboradorId: filtros.colaboradorId
      }

      const [resumoResponse, rankingResponse, alertasResponse] =
        await Promise.all([
          api.get('/indicadores/resumo', { params }),
          api.get('/indicadores/ranking', { params }),
          api.get('/indicadores/alertas', { params })
        ])

      setResumo(resumoResponse.data)
      setRanking(rankingResponse.data)
      setAlertas(alertasResponse.data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [filtros])

  const chartData = ranking.map((item) => ({
    nome: item.nome,
    atendimentos: Number(item.total_atendimentos || 0),
    vendas: Number(item.total_vendas || 0),
    erros: Number(item.total_erros || 0),
    score: Number(item.score || 0)
  }))

  const pieData = [
    { name: 'Vendas', value: Number(resumo?.total_vendas || 0) },
    { name: 'Erros', value: Number(resumo?.total_erros || 0) },
    { name: 'Atendimentos', value: Number(resumo?.total_atendimentos || 0) }
  ]

  const COLORS = ['#22c55e', '#ef4444', '#2563eb']

  return (
    <main className="flex-1 p-8 overflow-auto">
      <Topbar titulo="Dashboard Executivo" />

      <FiltrosGlobais />

      {loading || !resumo ? (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </section>
      ) : (
        <>
          <section className="glass-card glow-blue rounded-[32px] p-8 mb-8">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
              <div>
                <p className="text-blue-400 font-bold mb-3">
                  Visão Geral Operacional
                </p>

                <h2 className="text-5xl font-bold leading-tight">
                  Performance da equipe em tempo real
                </h2>

                <p className="text-slate-400 mt-4 max-w-2xl">
                  Acompanhe atendimentos, vendas, erros, T.A.T, ranking e evolução dos colaboradores em uma visão executiva.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 min-w-[360px]">
                <MiniInfo titulo="Colaboradores" valor={resumo.total_colaboradores || 0} />
                <MiniInfo titulo="Erros" valor={resumo.total_erros || 0} vermelho />
                <MiniInfo titulo="Descontos" valor={resumo.total_solicitacoes_desconto || 0} />
                <MiniInfo titulo="Ligações" valor={resumo.total_ligacoes_atendidas || 0} />
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            <Kpi titulo="Atendimentos" valor={resumo.total_atendimentos || 0} icon={Headphones} cor="blue" />
            <Kpi titulo="Vendas" valor={resumo.total_vendas || 0} icon={ShoppingCart} cor="green" />
            <Kpi titulo="Valor Vendido" valor={`R$ ${Number(resumo.valor_total_vendas || 0).toLocaleString('pt-BR')}`} icon={DollarSign} cor="yellow" />
            <Kpi titulo="T.A.T Médio" valor={`${resumo.tat_medio_geral || 0}s`} icon={Clock} cor="purple" />
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
            <div className="xl:col-span-2 glass-card rounded-[32px] p-7">
              <div className="mb-8">
                <h2 className="text-2xl font-bold">
                  Evolução Operacional
                </h2>

                <p className="text-slate-400 text-sm">
                  Comparativo dos principais indicadores conforme os filtros aplicados.
                </p>
              </div>

              <div className="h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <XAxis dataKey="nome" />
                    <YAxis />
                    <Tooltip />

                    <Area type="monotone" dataKey="atendimentos" stroke="#2563eb" fill="#2563eb33" strokeWidth={3} />
                    <Area type="monotone" dataKey="vendas" stroke="#22c55e" fill="#22c55e22" strokeWidth={3} />
                    <Area type="monotone" dataKey="score" stroke="#38bdf8" fill="#38bdf822" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card rounded-[32px] p-7">
              <h2 className="text-2xl font-bold mb-2">
                Distribuição
              </h2>

              <p className="text-slate-400 text-sm mb-6">
                Resultado geral do período filtrado.
              </p>

              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={75}
                      outerRadius={105}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={COLORS[index]} />
                      ))}
                    </Pie>

                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-4 mt-4">
                <Legenda cor="bg-green-500" titulo="Vendas" valor={resumo.total_vendas || 0} />
                <Legenda cor="bg-red-500" titulo="Erros" valor={resumo.total_erros || 0} />
                <Legenda cor="bg-blue-500" titulo="Atendimentos" valor={resumo.total_atendimentos || 0} />
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 glass-card rounded-[32px] p-7">
              <h2 className="text-2xl font-bold mb-6">
                Ranking de Colaboradores
              </h2>

              <div className="space-y-4">
                {ranking.map((item, index) => (
                  <div
                    key={item.id}
                    className="bg-slate-950/60 soft-border rounded-3xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-5 hover:bg-blue-950/20 transition"
                  >
                    <div className="flex items-center gap-5">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-blue-400/20 bg-slate-900">
                          {item.foto_url ? (
                            <img
                              src={item.foto_url}
                              alt={item.nome}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-blue-400 text-2xl font-bold">
                              {item.nome?.charAt(0)}
                            </div>
                          )}
                        </div>

                        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-yellow-500 text-slate-950 flex items-center justify-center text-xs font-bold">
                          #{index + 1}
                        </div>
                      </div>

                      <div>
                        <a
                          href={`/colaborador/${item.id}`}
                          className="text-xl font-bold hover:text-blue-400 transition"
                        >
                          {item.nome}
                        </a>

                        <p className="text-slate-400 text-sm mt-1">
                          {item.setor}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <InfoBox titulo="Atend." valor={item.total_atendimentos} />
                      <InfoBox titulo="Vendas" valor={item.total_vendas} />
                      <InfoBox titulo="Score" valor={item.score} azul />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-[32px] p-7">
              <h2 className="text-2xl font-bold mb-6">
                Alertas Inteligentes
              </h2>

              <div className="space-y-4">
                {alertas.slice(0, 5).map((alerta) => (
                  <Alerta
                    key={alerta.id}
                    titulo={alerta.nome}
                    descricao={alerta.alerta}
                    tipo={alerta.alerta === 'Dentro do esperado' ? 'blue' : 'red'}
                  />
                ))}

                {alertas.length === 0 && (
                  <p className="text-slate-400">
                    Nenhum alerta encontrado.
                  </p>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  )
}

function Kpi({ titulo, valor, icon: Icon, cor }) {
  const cores = {
    blue: 'text-blue-400 bg-blue-500/10',
    green: 'text-green-400 bg-green-500/10',
    yellow: 'text-yellow-400 bg-yellow-500/10',
    purple: 'text-purple-400 bg-purple-500/10'
  }

  return (
    <div className="glass-card rounded-[28px] p-6 hover:scale-[1.02] transition">
      <div className="flex justify-between">
        <div>
          <p className="text-slate-400">{titulo}</p>
          <h3 className="text-4xl font-bold mt-4">{valor}</h3>
        </div>

        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${cores[cor]}`}>
          <Icon size={30} />
        </div>
      </div>

      <p className="text-green-400 text-sm mt-6 flex items-center gap-2">
        <TrendingUp size={16} />
        Monitoramento ativo
      </p>
    </div>
  )
}

function MiniInfo({ titulo, valor, vermelho }) {
  return (
    <div className="bg-slate-950/60 soft-border rounded-2xl p-4">
      <p className="text-slate-400 text-sm">{titulo}</p>
      <p className={`text-2xl font-bold mt-2 ${vermelho ? 'text-red-400' : 'text-blue-400'}`}>
        {valor}
      </p>
    </div>
  )
}

function Legenda({ cor, titulo, valor }) {
  return (
    <div className="flex justify-between">
      <div className="flex gap-3 items-center">
        <span className={`w-3 h-3 rounded-full ${cor}`} />
        <span className="text-slate-300">{titulo}</span>
      </div>

      <strong>{valor}</strong>
    </div>
  )
}

function InfoBox({ titulo, valor, azul }) {
  return (
    <div className="bg-slate-900/60 soft-border rounded-2xl p-4 min-w-[90px]">
      <p className="text-xs text-slate-500">{titulo}</p>
      <p className={`font-bold ${azul ? 'text-blue-400' : ''}`}>{valor}</p>
    </div>
  )
}

function Alerta({ titulo, descricao, tipo }) {
  const cores = {
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
  }

  return (
    <div className={`border rounded-3xl p-5 ${cores[tipo]}`}>
      <div className="flex gap-4">
        <AlertTriangle />

        <div>
          <p className="font-bold">{titulo}</p>
          <p className="text-sm opacity-80 mt-1">{descricao}</p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard