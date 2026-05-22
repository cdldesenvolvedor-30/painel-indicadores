import { useState } from 'react'
import api from '../services/api'

import {
  PlugZap,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react'

function Integracoes() {
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState(null)

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">
          Integrações
        </h1>

        <p className="text-slate-400 mt-2">
          Gerencie conexões externas da plataforma.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/15 flex items-center justify-center text-blue-400">
            <PlugZap size={30} />
          </div>

          <div>
            <h2 className="text-2xl font-bold">
              Integração Digisac
            </h2>

            <p className="text-slate-400">
              Verifique a conexão da API da Digisac.
            </p>
          </div>
        </div>

        <button
          onClick={testarDigisac}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 transition px-6 py-4 rounded-2xl font-bold flex items-center gap-3 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Testando conexão...
            </>
          ) : (
            <>
              <PlugZap size={20} />
              Testar conexão
            </>
          )}
        </button>

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
                  ? 'Conexão realizada'
                  : 'Erro na conexão'}
              </h3>

              <p className="mt-1 opacity-90">
                {resultado.mensagem}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Integracoes