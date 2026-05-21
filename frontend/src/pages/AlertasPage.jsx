import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

import {
  Bell,
  CheckCircle,
  Clock,
  ShoppingCart,
  ShieldAlert
} from 'lucide-react'

import api from '../services/api'

import Topbar from '../components/Topbar'
import SkeletonCard from '../components/SkeletonCard'
import FiltrosGlobais from '../components/FiltrosGlobais'

import { useFiltros } from '../context/FiltrosContext'

function AlertasPage() {
  const [alertas, setAlertas] = useState([])
  const [loading, setLoading] = useState(true)

  const { filtros } = useFiltros()

  async function carregarAlertas() {
    try {
      setLoading(true)

      const params = {
        inicio: filtros.inicio,
        fim: filtros.fim,
        setor: filtros.setor,
        colaboradorId: filtros.colaboradorId
      }

      const response = await api.get('/indicadores/alertas', {
        params
      })

      setAlertas(response.data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarAlertas()
  }, [filtros])

  const dentroEsperado = alertas.filter(
    (item) => item.alerta === 'Dentro do esperado'
  ).length

  const foraEsperado = alertas.length - dentroEsperado

  return (
    <main className="flex-1 p-8 overflow-auto">
      <Topbar titulo="Alertas de Desempenho" />

      <FiltrosGlobais />

      <section className="glass-card glow-blue rounded-[32px] p-8 mb-8">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
          <div>
            <p className="text-blue-400 font-bold mb-3">
              Monitoramento Inteligente
            </p>

            <h2 className="text-5xl font-bold leading-tight">
              Identifique pontos de atenção rapidamente
            </h2>

            <p className="text-slate-400 mt-4 max-w-2xl">
              Acompanhe colaboradores com baixo volume de vendas, T.A.T acima do ideal,
              erros elevados ou desempenho dentro do esperado.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 min-w-[360px]">
            <MiniCard titulo="Total" valor={alertas.length} />
            <MiniCard titulo="Dentro do esperado" valor={dentroEsperado} verde />
            <MiniCard titulo="Pontos de atenção" valor={foraEsperado} vermelho />
            <MiniCard titulo="Monitorados" valor={alertas.length} />
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
      ) : alertas.length === 0 ? (
        <section className="glass-card rounded-[32px] p-10 text-center">
          <Bell size={48} className="mx-auto text-blue-400 mb-4" />

          <h2 className="text-3xl font-bold mb-2">
            Nenhum alerta encontrado
          </h2>

          <p className="text-slate-400">
            Nenhum colaborador foi encontrado com os filtros aplicados.
          </p>
        </section>
      ) : (
        <section className="glass-card rounded-[32px] p-7">
          <div className="flex items-center gap-3 mb-7">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <Bell size={26} />
            </div>

            <div>
              <h2 className="text-2xl font-bold">
                Lista de Alertas
              </h2>

              <p className="text-slate-400 text-sm">
                Avaliação automática baseada nos indicadores filtrados.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {alertas.map((item, index) => (
              <motion.div
                key={item.id || index}
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

                      <div className="absolute -bottom-2 -right-2">
                        <IconeAlerta alerta={item.alerta} pequeno />
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
                    <Info titulo="Atend." valor={item.total_atendimentos} />
                    <Info titulo="Vendas" valor={item.total_vendas} />
                    <Info titulo="Erros" valor={item.total_erros} vermelho />
                    <Info titulo="T.A.T" valor={`${item.tat_medio}s`} />
                  </div>

                  <StatusAlerta alerta={item.alerta} />
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}
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

function IconeAlerta({ alerta, pequeno }) {
  const tamanho = pequeno ? 'w-8 h-8' : 'w-14 h-14'
  const iconeTamanho = pequeno ? 16 : 26

  if (alerta === 'Dentro do esperado') {
    return (
      <div className={`${tamanho} rounded-full bg-green-500 text-slate-950 flex items-center justify-center shadow-lg`}>
        <CheckCircle size={iconeTamanho} />
      </div>
    )
  }

  if (alerta === 'T.A.T acima do ideal') {
    return (
      <div className={`${tamanho} rounded-full bg-yellow-500 text-slate-950 flex items-center justify-center shadow-lg`}>
        <Clock size={iconeTamanho} />
      </div>
    )
  }

  if (alerta === 'Baixo volume de vendas') {
    return (
      <div className={`${tamanho} rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg`}>
        <ShoppingCart size={iconeTamanho} />
      </div>
    )
  }

  return (
    <div className={`${tamanho} rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg`}>
      <ShieldAlert size={iconeTamanho} />
    </div>
  )
}

function StatusAlerta({ alerta }) {
  const dentro = alerta === 'Dentro do esperado'

  return (
    <span
      className={`px-4 py-2 rounded-full text-sm font-bold text-center ${
        dentro
          ? 'bg-green-500/15 text-green-400'
          : 'bg-red-500/15 text-red-400'
      }`}
    >
      {alerta}
    </span>
  )
}

function Info({ titulo, valor, vermelho }) {
  return (
    <div className="bg-slate-900/60 soft-border rounded-2xl p-4">
      <p className="text-xs text-slate-500">
        {titulo}
      </p>

      <p className={`font-bold ${vermelho ? 'text-red-400' : ''}`}>
        {valor}
      </p>
    </div>
  )
}

export default AlertasPage