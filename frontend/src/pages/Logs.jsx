import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileClock,
  User,
  Mail,
  Clock,
  ShieldCheck
} from 'lucide-react'

import api from '../services/api'
import Topbar from '../components/Topbar'
import SkeletonCard from '../components/SkeletonCard'

function Logs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  async function carregarLogs() {
    try {
      setLoading(true)

      const response = await api.get('/logs')

      setLogs(response.data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarLogs()
  }, [])

  return (
    <main className="flex-1 p-8 overflow-auto">
      <Topbar titulo="Auditoria do Sistema" />

      <section className="glass-card glow-blue rounded-[32px] p-8 mb-8">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
          <div>
            <p className="text-blue-400 font-bold mb-3">
              Segurança e Rastreamento
            </p>

            <h2 className="text-5xl font-bold leading-tight">
              Histórico de ações da plataforma
            </h2>

            <p className="text-slate-400 mt-4 max-w-2xl">
              Acompanhe ações realizadas pelos usuários, alterações importantes e registros administrativos do sistema.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 min-w-[360px]">
            <MiniCard titulo="Total de Logs" valor={logs.length} />
            <MiniCard titulo="Monitoramento" valor="Ativo" verde />
          </div>
        </div>
      </section>

      <section className="glass-card rounded-[32px] p-7">
        <div className="flex items-center gap-3 mb-7">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
            <FileClock size={26} />
          </div>

          <div>
            <h2 className="text-2xl font-bold">
              Logs de Ações
            </h2>

            <p className="text-slate-400 text-sm">
              Registros de auditoria do sistema em ordem cronológica.
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
        ) : logs.length === 0 ? (
          <div className="bg-slate-950/60 soft-border rounded-[32px] p-10 text-center">
            <ShieldCheck size={48} className="mx-auto text-blue-400 mb-4" />

            <h2 className="text-3xl font-bold mb-2">
              Nenhum log encontrado
            </h2>

            <p className="text-slate-400">
              As ações administrativas aparecerão aqui quando forem registradas.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.03 }}
                className="bg-slate-950/60 soft-border rounded-[28px] p-5 hover:bg-blue-950/20 transition"
              >
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                      <FileClock size={24} />
                    </div>

                    <div>
                      <h3 className="text-xl font-bold">
                        {log.acao}
                      </h3>

                      <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-400">
                        <Info icon={User} texto={log.usuario || 'Sistema'} />
                        <Info icon={Mail} texto={log.email || 'Sem e-mail'} />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900/60 soft-border rounded-2xl px-4 py-3 flex items-center gap-2 text-slate-300">
                    <Clock size={16} className="text-blue-400" />

                    <span>
                      {new Date(log.data_criacao).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
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

function Info({ icon: Icon, texto }) {
  return (
    <span className="flex items-center gap-2">
      <Icon size={15} />
      {texto}
    </span>
  )
}

export default Logs