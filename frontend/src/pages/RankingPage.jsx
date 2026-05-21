import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

import {
  Trophy,
  Medal,
  TrendingUp,
  Headphones,
  ShoppingCart,
  AlertTriangle
} from 'lucide-react'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts'

import api from '../services/api'

import Topbar from '../components/Topbar'
import SkeletonCard from '../components/SkeletonCard'
import FiltrosGlobais from '../components/FiltrosGlobais'

import { useFiltros } from '../context/FiltrosContext'

function RankingPage() {
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)

  const { filtros } = useFiltros()

  async function carregarRanking() {
    try {
      setLoading(true)

      const params = {
        inicio: filtros.inicio,
        fim: filtros.fim,
        setor: filtros.setor,
        colaboradorId: filtros.colaboradorId
      }

      const response = await api.get(
        '/indicadores/ranking',
        { params }
      )

      setRanking(response.data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarRanking()
  }, [filtros])

  const primeiro = ranking[0]

  return (
    <main className="flex-1 p-8 overflow-auto">
      <Topbar titulo="Ranking de Performance" />

      <FiltrosGlobais />

      <section className="glass-card glow-blue rounded-[32px] p-8 mb-8">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
          <div>
            <p className="text-blue-400 font-bold mb-3">
              Classificação Operacional
            </p>

            <h2 className="text-5xl font-bold leading-tight">
              Veja quem está liderando a performance
            </h2>

            <p className="text-slate-400 mt-4 max-w-2xl">
              Ranking baseado em atendimentos, vendas, erros e score operacional.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 min-w-[360px]">
            <div className="bg-slate-950/60 soft-border rounded-3xl p-6">
              <p className="text-slate-400 text-sm">
                Melhor Performance
              </p>

              <div className="flex items-center gap-4 mt-4">
                <div className="w-20 h-20 rounded-3xl overflow-hidden border border-yellow-400/30 bg-slate-900">
                  {primeiro?.foto_url ? (
                    <img
                      src={primeiro.foto_url}
                      alt={primeiro.nome}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-yellow-400 text-3xl font-bold">
                      {primeiro?.nome?.charAt(0)}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-3xl font-bold text-yellow-400">
                    {primeiro?.nome || 'Sem dados'}
                  </h3>

                  <p className="text-slate-400 mt-2">
                    Score: {primeiro?.score || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </section>
      ) : (
        <>
          <section className="glass-card rounded-[32px] p-7 mb-8">
            <h2 className="text-2xl font-bold mb-2">
              Gráfico de Score
            </h2>

            <p className="text-slate-400 text-sm mb-8">
              Comparativo visual da pontuação dos colaboradores.
            </p>

            <div className="h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ranking}>
                  <XAxis dataKey="nome" />
                  <YAxis />
                  <Tooltip />

                  <Bar
                    dataKey="score"
                    fill="#2563eb"
                    radius={[12, 12, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="glass-card rounded-[32px] p-7">
            <div className="flex items-center gap-3 mb-7">
              <div className="w-12 h-12 rounded-2xl bg-yellow-500/15 text-yellow-400 flex items-center justify-center">
                <Trophy size={26} />
              </div>

              <div>
                <h2 className="text-2xl font-bold">
                  Ranking de Colaboradores
                </h2>

                <p className="text-slate-400 text-sm">
                  Lista ordenada por score operacional.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {ranking.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.03 }}
                  className="bg-slate-950/60 soft-border rounded-[28px] p-5 hover:bg-blue-950/20 transition"
                >
                  <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
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

                        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-yellow-500 text-slate-950 flex items-center justify-center text-xs font-bold shadow-lg">
                          {index + 1 <= 3 ? (
                            <Medal size={14} />
                          ) : (
                            `#${index + 1}`
                          )}
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

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <Info icon={Headphones} titulo="Atend." valor={item.total_atendimentos} />
                      <Info icon={ShoppingCart} titulo="Vendas" valor={item.total_vendas} />
                      <Info icon={AlertTriangle} titulo="Erros" valor={item.total_erros} vermelho />
                      <Info icon={TrendingUp} titulo="Score" valor={item.score} azul />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  )
}

function Info({ icon: Icon, titulo, valor, vermelho, azul }) {
  return (
    <div className="bg-slate-900/60 soft-border rounded-2xl p-4">
      <div className="flex items-center justify-center gap-2 text-slate-400 text-xs mb-2">
        <Icon size={15} />
        {titulo}
      </div>

      <p
        className={`font-bold ${
          vermelho
            ? 'text-red-400'
            : azul
            ? 'text-blue-400'
            : 'text-white'
        }`}
      >
        {valor}
      </p>
    </div>
  )
}

export default RankingPage