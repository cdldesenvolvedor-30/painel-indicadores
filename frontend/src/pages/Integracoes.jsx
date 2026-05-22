import { useState } from 'react'
import api from '../services/api'

import {
  PlugZap,
  CheckCircle2,
  XCircle,
  Loader2,
  Database,
  MessageSquareMore,
  RefreshCw
} from 'lucide-react'

function Integracoes() {
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [sincronizando, setSincronizando] = useState(false)

  async function testarDigisac() {
    try {
      setLoading(true)
      setResultado(null)

      const response = await api.get('/digisac/testar-conexao')

      setResultado({
        sucesso: true,
        mensagem: response.data.mensagem
      })
    } catch (error) {
      console.error(error)

      setResultado({
        sucesso: false,
        mensagem:
          error.response?.data?.erro ||
          'Erro ao conectar com a Digisac'
      })
    } finally {
      setLoading(false)
    }
  }

  async function sincronizarCRM() {
    try {
      setSincronizando(true)

      const response = await api.post('/digisac/sincronizar-crm')

      setResultado({
        sucesso: true,
        mensagem: `${response.data.total_importados} contatos sincronizados com sucesso`
      })
    } catch (error) {
      console.error(error)

      setResultado({
        sucesso: false,
        mensagem:
          error.response?.data?.erro ||
          'Erro ao sincronizar CRM'
      })
    } finally {
      setSincronizando(false)
    }
  }

  return (
    <div className="px-8 py-6 space-y-8">
      <div>
        <h1 className="text-4xl font-bold">
          Integrações
        </h1>

        <p className="text-slate-400 mt-2">
          Gerencie integrações externas da plataforma.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/15 flex items-center justify-center text-blue-400">
                <MessageSquareMore size={30} />
              </div>

              <div>
                <h2 className="text-2xl font-bold">
                  Digisac CRM
                </h2>

                <p className="text-slate-400 mt-1">
                  Integração de atendimentos e CRM.
                </p>
              </div>
            </div>

            <span className="bg-green-500/10 text-green-400 text-xs px-3 py-1 rounded-full font-bold">
              API
            </span>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Database
                  size={18}
                  className="text-blue-400"
                />

                <span className="font-semibold">
                  Status
                </span>
              </div>

              <p className="text-sm text-slate-400">
                Aguardando teste de conexão.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <RefreshCw
                  size={18}
                  className="text-blue-400"
                />

                <span className="font-semibold">
                  Sincronização
                </span>
              </div>

              <p className="text-sm text-slate-400">
                Manual
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={testarDigisac}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 transition px-6 py-4 rounded-2xl font-bold flex items-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2
                    size={20}
                    className="animate-spin"
                  />

                  Testando conexão...
                </>
              ) : (
                <>
                  <PlugZap size={20} />
                  Testar conexão
                </>
              )}
            </button>

            <button
              onClick={sincronizarCRM}
              disabled={sincronizando}
              className="bg-green-600 hover:bg-green-700 transition px-6 py-4 rounded-2xl font-bold flex items-center gap-3 disabled:opacity-50"
            >
              {sincronizando ? (
                <>
                  <Loader2
                    size={20}
                    className="animate-spin"
                  />

                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw size={20} />
                  Sincronizar CRM
                </>
              )}
            </button>
          </div>

          {resultado && (
            <div
              className={`mt-6 rounded-2xl p-5 border flex items-start gap-4 ${
                resultado.sucesso
                  ? 'bg-green-500/10 border-green-500/20 text-green-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}
            >
              {resultado.sucesso ? (
                <CheckCircle2 size={24} />
              ) : (
                <XCircle size={24} />
              )}

              <div>
                <h3 className="font-bold text-lg">
                  {resultado.sucesso
                    ? 'Operação realizada'
                    : 'Erro na operação'}
                </h3>

                <p className="mt-1 opacity-90">
                  {resultado.mensagem}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Integracoes