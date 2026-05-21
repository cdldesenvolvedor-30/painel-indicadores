import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Target,
  CalendarDays,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

import api from '../services/api'
import Topbar from '../components/Topbar'
import SkeletonCard from '../components/SkeletonCard'

function ComparativoMetas() {
  const [dados, setDados] = useState([])
  const [loading, setLoading] = useState(true)

  const dataAtual = new Date()
  const [mes, setMes] = useState(dataAtual.getMonth() + 1)
  const [ano, setAno] = useState(dataAtual.getFullYear())

  async function carregarComparativo() {
    try {
      setLoading(true)

      const response = await api.get(
        `/metas/comparativo?mes=${mes}&ano=${ano}`
      )

      setDados(response.data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarComparativo()
  }, [])

  const totalColaboradores = dados.length
  const metasBatidas = dados.filter(
    (item) =>
      Number(item.percentual_vendas || 0) >= 100 ||
      Number(item.percentual_atendimentos || 0) >= 100
  ).length

  return (
    <main className="flex-1 p-8 overflow-auto">
      <Topbar titulo="Meta x Resultado" />

      <section className="glass-card glow-blue rounded-[32px] p-8 mb-8">
        <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-8">
          <div>
            <p className="text-blue-400 font-bold mb-3">
              Gestão de Performance
            </p>

            <h2 className="text-5xl font-bold leading-tight">
              Acompanhe metas e resultados em tempo real
            </h2>

            <p className="text-slate-400 mt-4 max-w-2xl">
              Visualize o desempenho dos colaboradores por competência, comparando metas definidas com resultados alcançados.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-[360px]">
            <MiniCard titulo="Colaboradores" valor={totalColaboradores} />
            <MiniCard titulo="Metas Batidas" valor={metasBatidas} verde />
          </div>
        </div>
      </section>

      <section className="glass-card rounded-[28px] p-6 mb-8">
        <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold">
              Filtro de Competência
            </h2>

            <p className="text-slate-400 text-sm mt-1">
              Selecione mês e ano para comparar os resultados.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 xl:w-[620px]">
            <div className="relative">
              <CalendarDays
                size={18}
                className="absolute left-4 top-4 text-slate-400"
              />

              <input
                type="number"
                placeholder="Mês"
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                className="w-full bg-slate-950/70 soft-border rounded-2xl pl-11 pr-4 py-4 outline-none"
              />
            </div>

            <input
              type="number"
              placeholder="Ano"
              value={ano}
              onChange={(e) => setAno(e.target.value)}
              className="bg-slate-950/70 soft-border rounded-2xl px-4 py-4 outline-none"
            />

            <button
              onClick={carregarComparativo}
              className="bg-blue-600 hover:bg-blue-700 rounded-2xl font-bold transition"
            >
              Aplicar
            </button>
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
      ) : dados.length === 0 ? (
        <section className="glass-card rounded-[32px] p-10 text-center">
          <Target size={48} className="mx-auto text-blue-400 mb-4" />

          <h2 className="text-3xl font-bold mb-2">
            Nenhuma meta encontrada
          </h2>

          <p className="text-slate-400">
            Cadastre metas para esta competência ou altere o filtro.
          </p>
        </section>
      ) : (
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {dados.map((item, index) => (
            <motion.div
              key={item.colaborador_id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              className="glass-card rounded-[32px] p-7"
            >
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
                <div>
                  <h2 className="text-3xl font-bold">
                    {item.colaborador}
                  </h2>

                  <p className="text-slate-400 mt-1">
                    {item.setor}
                  </p>
                </div>

                <span className="bg-blue-500/15 text-blue-400 px-4 py-2 rounded-full text-sm font-bold">
                  {mes}/{ano}
                </span>
              </div>

              <div className="space-y-5">
                <KpiPremium
                  titulo="Atendimentos"
                  resultado={item.total_atendimentos}
                  meta={item.meta_atendimentos}
                  percentual={item.percentual_atendimentos}
                  cor="blue"
                />

                <KpiPremium
                  titulo="Vendas"
                  resultado={item.total_vendas}
                  meta={item.meta_vendas}
                  percentual={item.percentual_vendas}
                  cor="green"
                />

                <KpiPremium
                  titulo="Valor em Vendas"
                  resultado={`R$ ${item.valor_vendas}`}
                  meta={`R$ ${item.meta_valor_vendas}`}
                  percentual={item.percentual_valor_vendas}
                  cor="yellow"
                />
              </div>

              <div className="mt-6 bg-slate-950/60 soft-border rounded-3xl p-5 flex justify-between items-center">
                <div>
                  <p className="text-slate-400 text-sm">
                    Controle de Erros
                  </p>

                  <h3 className="text-2xl font-bold mt-1">
                    {item.total_erros} / {item.limite_erros}
                  </h3>
                </div>

                {Number(item.total_erros) <= Number(item.limite_erros) ? (
                  <span className="bg-green-500/15 text-green-400 px-4 py-2 rounded-full font-bold flex items-center gap-2">
                    <CheckCircle size={18} />
                    Dentro do limite
                  </span>
                ) : (
                  <span className="bg-red-500/15 text-red-400 px-4 py-2 rounded-full font-bold flex items-center gap-2">
                    <AlertTriangle size={18} />
                    Acima do limite
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </section>
      )}
    </main>
  )
}

function MiniCard({ titulo, valor, verde }) {
  return (
    <div className="bg-slate-950/60 soft-border rounded-3xl p-5">
      <p className="text-slate-400 text-sm">
        {titulo}
      </p>

      <p className={`text-3xl font-bold mt-2 ${verde ? 'text-green-400' : 'text-blue-400'}`}>
        {valor}
      </p>
    </div>
  )
}

function KpiPremium({ titulo, resultado, meta, percentual, cor }) {
  const valorPercentual = Math.min(Number(percentual || 0), 100)
  const bateuMeta = Number(percentual || 0) >= 100

  const cores = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500'
  }

  return (
    <div className="bg-slate-950/60 soft-border rounded-3xl p-5">
      <div className="flex justify-between gap-4 mb-5">
        <div>
          <p className="text-slate-400 text-sm">
            {titulo}
          </p>

          <h3 className="text-3xl font-bold mt-2">
            {resultado}
          </h3>
        </div>

        <div className="text-right">
          <p className="text-slate-400 text-sm">
            Meta
          </p>

          <p className="text-xl font-bold mt-2">
            {meta}
          </p>
        </div>
      </div>

      <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden">
        <div
          className={`${cores[cor]} h-full rounded-full transition-all duration-700`}
          style={{ width: `${valorPercentual}%` }}
        />
      </div>

      <div className="flex justify-between items-center mt-4">
        <p className="text-slate-400 text-sm">
          {percentual}% da meta
        </p>

        <span
          className={`text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 ${
            bateuMeta
              ? 'bg-green-500/15 text-green-400'
              : 'bg-yellow-500/15 text-yellow-400'
          }`}
        >
          <TrendingUp size={14} />
          {bateuMeta ? 'Meta batida' : 'Em andamento'}
        </span>
      </div>
    </div>
  )
}

export default ComparativoMetas