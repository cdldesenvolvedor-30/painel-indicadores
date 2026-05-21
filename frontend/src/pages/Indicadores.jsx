import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

import {
  BarChart3,
  FileDown,
  CalendarDays,
  User,
  Headphones,
  ShoppingCart,
  DollarSign,
  Clock,
  AlertTriangle,
  Phone,
  BadgePercent
} from 'lucide-react'

import api from '../services/api'
import Topbar from '../components/Topbar'
import SkeletonCard from '../components/SkeletonCard'
import FiltrosGlobais from '../components/FiltrosGlobais'
import { useFiltros } from '../context/FiltrosContext'

function Indicadores() {
  const [searchParams] = useSearchParams()
  const busca = searchParams.get('busca') || ''
  const { filtros } = useFiltros()

  const [indicadores, setIndicadores] = useState([])
  const [colaboradores, setColaboradores] = useState([])
  const [loading, setLoading] = useState(true)

  const [colaboradorId, setColaboradorId] = useState('')
  const [dataRegistro, setDataRegistro] = useState('')
  const [totalAtendimentos, setTotalAtendimentos] = useState('')
  const [totalVendas, setTotalVendas] = useState('')
  const [valorVendas, setValorVendas] = useState('')
  const [tatMedioSegundos, setTatMedioSegundos] = useState('')
  const [erros, setErros] = useState('')
  const [solicitacoesDesconto, setSolicitacoesDesconto] = useState('')
  const [ligacoesAtendidas, setLigacoesAtendidas] = useState('')

  async function carregarIndicadores() {
    try {
      setLoading(true)

      const response = await api.get('/indicadores', {
        params: {
          inicio: filtros.inicio,
          fim: filtros.fim,
          setor: filtros.setor,
          colaboradorId: filtros.colaboradorId
        }
      })

      let dados = response.data

      if (busca.trim()) {
        const termo = busca.toLowerCase()

        dados = dados.filter((item) =>
          item.colaborador?.toLowerCase().includes(termo) ||
          item.setor?.toLowerCase().includes(termo)
        )
      }

      setIndicadores(dados)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar indicadores')
    } finally {
      setLoading(false)
    }
  }

  async function carregarColaboradores() {
    try {
      const response = await api.get('/colaboradores')
      setColaboradores(response.data.filter((item) => item.status === 'Ativo'))
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar colaboradores')
    }
  }

  async function cadastrarIndicador(e) {
    e.preventDefault()

    try {
      await api.post('/indicadores', {
        colaborador_id: colaboradorId,
        data_registro: dataRegistro,
        total_atendimentos: Number(totalAtendimentos || 0),
        total_vendas: Number(totalVendas || 0),
        valor_vendas: Number(valorVendas || 0),
        tat_medio_segundos: Number(tatMedioSegundos || 0),
        erros: Number(erros || 0),
        solicitacoes_desconto: Number(solicitacoesDesconto || 0),
        ligacoes_atendidas: Number(ligacoesAtendidas || 0)
      })

      toast.success('Indicador cadastrado com sucesso 🚀')

      setColaboradorId('')
      setDataRegistro('')
      setTotalAtendimentos('')
      setTotalVendas('')
      setValorVendas('')
      setTatMedioSegundos('')
      setErros('')
      setSolicitacoesDesconto('')
      setLigacoesAtendidas('')

      carregarIndicadores()
    } catch (error) {
      console.error(error)

      toast.error(
        error.response?.data?.erro ||
        'Erro ao cadastrar indicador'
      )
    }
  }

  function exportarCSV() {
    if (indicadores.length === 0) {
      toast.error('Não há indicadores para exportar')
      return
    }

    const cabecalho = [
      'Colaborador',
      'Setor',
      'Data',
      'Atendimentos',
      'Vendas',
      'Valor em Vendas',
      'TAT em Segundos',
      'Erros',
      'Solicitações de Desconto',
      'Ligações Atendidas'
    ]

    const linhas = indicadores.map((item) => [
      item.colaborador,
      item.setor,
      new Date(item.data_registro).toLocaleDateString('pt-BR'),
      item.total_atendimentos,
      item.total_vendas,
      item.valor_vendas,
      item.tat_medio_segundos,
      item.erros,
      item.solicitacoes_desconto,
      item.ligacoes_atendidas
    ])

    const conteudo = [cabecalho, ...linhas]
      .map((linha) =>
        linha
          .map((campo) => `"${String(campo ?? '').replace(/"/g, '""')}"`)
          .join(';')
      )
      .join('\n')

    const blob = new Blob([`\uFEFF${conteudo}`], {
      type: 'text/csv;charset=utf-8;'
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'indicadores.csv'
    link.click()

    URL.revokeObjectURL(url)

    toast.success('CSV exportado com sucesso 📊')
  }

  useEffect(() => {
    carregarIndicadores()
  }, [filtros, busca])

  useEffect(() => {
    carregarColaboradores()
  }, [])

  return (
    <main className="flex-1 p-8 overflow-auto">
      <Topbar titulo="Indicadores Operacionais" />

      <FiltrosGlobais />

      <section className="glass-card glow-blue rounded-[32px] p-8 mb-8">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
          <div>
            <p className="text-blue-400 font-bold mb-3">
              Lançamento Operacional
            </p>

            <h2 className="text-5xl font-bold leading-tight">
              Registre os dados de performance da equipe
            </h2>

            <p className="text-slate-400 mt-4 max-w-2xl">
              Lance indicadores manuais por colaborador e acompanhe os resultados filtrados.
            </p>

            {busca && (
              <p className="text-blue-400 mt-4 font-bold">
                Resultado da pesquisa: "{busca}"
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 min-w-[360px]">
            <MiniCard titulo="Registros" valor={indicadores.length} />
            <MiniCard titulo="Colaboradores ativos" valor={colaboradores.length} />
          </div>
        </div>
      </section>

      <section className="glass-card rounded-[32px] p-7 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
            <BarChart3 size={26} />
          </div>

          <div>
            <h2 className="text-2xl font-bold">
              Novo Indicador
            </h2>

            <p className="text-slate-400 text-sm">
              Preencha os campos abaixo para registrar um novo lançamento.
            </p>
          </div>
        </div>

        <form
          onSubmit={cadastrarIndicador}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          <CampoSelect icon={User} value={colaboradorId} onChange={setColaboradorId} required>
            <option value="">Selecione o colaborador</option>

            {colaboradores.map((colaborador) => (
              <option key={colaborador.id} value={colaborador.id}>
                {colaborador.nome}
              </option>
            ))}
          </CampoSelect>

          <Campo icon={CalendarDays} type="date" value={dataRegistro} onChange={setDataRegistro} required />
          <Campo icon={Headphones} type="number" placeholder="Total de atendimentos" value={totalAtendimentos} onChange={setTotalAtendimentos} />
          <Campo icon={ShoppingCart} type="number" placeholder="Total de vendas" value={totalVendas} onChange={setTotalVendas} />
          <Campo icon={DollarSign} type="number" step="0.01" placeholder="Valor em vendas" value={valorVendas} onChange={setValorVendas} />
          <Campo icon={Clock} type="number" placeholder="T.A.T médio em segundos" value={tatMedioSegundos} onChange={setTatMedioSegundos} />
          <Campo icon={AlertTriangle} type="number" placeholder="Erros" value={erros} onChange={setErros} />
          <Campo icon={BadgePercent} type="number" placeholder="Solicitações de desconto" value={solicitacoesDesconto} onChange={setSolicitacoesDesconto} />
          <Campo icon={Phone} type="number" placeholder="Ligações atendidas" value={ligacoesAtendidas} onChange={setLigacoesAtendidas} />

          <button
            type="submit"
            className="xl:col-span-3 bg-blue-600 hover:bg-blue-700 transition p-4 rounded-2xl font-bold shadow-lg shadow-blue-500/20"
          >
            Salvar Indicador
          </button>
        </form>
      </section>

      <section className="glass-card rounded-[32px] p-7">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7">
          <div>
            <h2 className="text-2xl font-bold">
              Histórico de Indicadores
            </h2>

            <p className="text-slate-400 text-sm mt-1">
              Registros filtrados por período, setor, colaborador ou pesquisa.
            </p>
          </div>

          <button
            onClick={exportarCSV}
            className="flex items-center justify-center gap-2 bg-green-500/15 text-green-400 hover:bg-green-500/25 transition px-5 py-3 rounded-2xl font-bold"
          >
            <FileDown size={18} />
            Exportar CSV
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : indicadores.length === 0 ? (
          <div className="bg-slate-950/60 soft-border rounded-[32px] p-10 text-center">
            <BarChart3 size={48} className="mx-auto text-blue-400 mb-4" />

            <h2 className="text-3xl font-bold mb-2">
              Nenhum indicador encontrado
            </h2>

            <p className="text-slate-400">
              Nenhum registro corresponde aos filtros ou pesquisa aplicada.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {indicadores.map((indicador, index) => (
              <motion.div
                key={indicador.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.03 }}
                className="bg-slate-950/60 soft-border rounded-[28px] p-5 hover:bg-blue-950/20 transition"
              >
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border border-blue-400/20 bg-slate-900">
                      {indicador.foto_url ? (
                        <img
                          src={indicador.foto_url}
                          alt={indicador.colaborador}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-blue-400 text-2xl font-bold">
                          {indicador.colaborador?.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div>
                      <a
                        href={`/colaborador/${indicador.colaborador_id}`}
                        className="text-xl font-bold hover:text-blue-400 transition"
                      >
                        {indicador.colaborador}
                      </a>

                      <p className="text-slate-400 text-sm mt-1">
                        {indicador.setor}
                      </p>

                      <p className="text-slate-500 text-sm mt-2">
                        {new Date(indicador.data_registro).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4 text-center">
                    <Info titulo="Atend." valor={indicador.total_atendimentos} />
                    <Info titulo="Vendas" valor={indicador.total_vendas} />
                    <Info titulo="Valor" valor={`R$ ${indicador.valor_vendas}`} />
                    <Info titulo="T.A.T" valor={`${indicador.tat_medio_segundos}s`} />
                    <Info titulo="Erros" valor={indicador.erros} vermelho />
                    <Info titulo="Descontos" valor={indicador.solicitacoes_desconto} />
                    <Info titulo="Ligações" valor={indicador.ligacoes_atendidas} />
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

function MiniCard({ titulo, valor }) {
  return (
    <div className="bg-slate-950/60 soft-border rounded-3xl p-5">
      <p className="text-slate-400 text-sm">{titulo}</p>
      <p className="text-3xl font-bold mt-2 text-blue-400">{valor}</p>
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

function CampoSelect({ icon: Icon, value, onChange, children, required }) {
  return (
    <div className="relative">
      <Icon size={18} className="absolute left-4 top-[18px] text-slate-400" />

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full bg-slate-950/70 soft-border rounded-2xl pl-11 pr-4 py-4 outline-none"
      >
        {children}
      </select>
    </div>
  )
}

function Info({ titulo, valor, vermelho }) {
  return (
    <div className="bg-slate-900/60 soft-border rounded-2xl p-4">
      <p className="text-xs text-slate-500">{titulo}</p>
      <p className={`font-bold ${vermelho ? 'text-red-400' : ''}`}>
        {valor}
      </p>
    </div>
  )
}

export default Indicadores