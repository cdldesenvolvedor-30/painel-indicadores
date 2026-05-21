import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import {
  Users,
  Star,
  Skull,
  CircleUserRound,
  Crown,
  Search,
  Save,
  User,
  CalendarDays,
  MessageSquare,
  Target,
  Maximize2
} from 'lucide-react'

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts'

import api from '../services/api'
import Topbar from '../components/Topbar'
import SkeletonCard from '../components/SkeletonCard'

function MapaPerformance() {
  const [dados, setDados] = useState([])
  const [resumo, setResumo] = useState(null)
  const [colaboradores, setColaboradores] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')

  const [colaboradorId, setColaboradorId] = useState('')
  const [produtividade, setProdutividade] = useState('')
  const [processo, setProcesso] = useState('')
  const [observacao, setObservacao] = useState('')
  const [dataAvaliacao, setDataAvaliacao] = useState('')

  async function carregarDados() {
    try {
      setLoading(true)

      const [mapaResponse, resumoResponse, colaboradoresResponse] =
        await Promise.all([
          api.get('/mapa-performance'),
          api.get('/mapa-performance/resumo'),
          api.get('/colaboradores')
        ])

      setDados(mapaResponse.data)
      setResumo(resumoResponse.data)

      setColaboradores(
        colaboradoresResponse.data.filter((item) => item.status === 'Ativo')
      )
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar mapa de performance')
    } finally {
      setLoading(false)
    }
  }

  async function salvarAvaliacao(e) {
    e.preventDefault()

    try {
      await api.post('/mapa-performance', {
        colaborador_id: colaboradorId,
        produtividade: Number(produtividade),
        processo: Number(processo),
        observacao,
        data_avaliacao: dataAvaliacao || null
      })

      toast.success('Avaliação salva com sucesso 🚀')

      setColaboradorId('')
      setProdutividade('')
      setProcesso('')
      setObservacao('')
      setDataAvaliacao('')

      carregarDados()
    } catch (error) {
      console.error(error)

      toast.error(
        error.response?.data?.erro ||
        'Erro ao salvar avaliação'
      )
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  const dadosFiltrados = useMemo(() => {
    const termo = busca.toLowerCase()

    return dados.filter((item) =>
      item.colaborador?.toLowerCase().includes(termo) ||
      item.setor?.toLowerCase().includes(termo) ||
      item.classificacao?.toLowerCase().includes(termo)
    )
  }, [dados, busca])

  return (
    <main className="flex-1 p-8 overflow-auto">
      <Topbar titulo="Mapa de Performance" />

      {loading ? (
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </section>
      ) : (
        <>
          <section className="mb-6">
            <div>
              <h1 className="text-4xl font-bold uppercase">
                Mapa de Performance
              </h1>

              <p className="text-slate-400 text-lg mt-1">
                Produtividade vs. Processo
              </p>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
            <ResumoCard titulo="Colaboradores" subtitulo="Total" valor={resumo?.total || 0} icon={Users} cor="blue" />
            <ResumoCard titulo="Estrelas" subtitulo={percentual(resumo?.estrelas, resumo?.total)} valor={resumo?.estrelas || 0} icon={Star} cor="green" />
            <ResumoCard titulo="Santos" subtitulo={percentual(resumo?.santos, resumo?.total)} valor={resumo?.santos || 0} icon={Crown} cor="yellow" />
            <ResumoCard titulo="Pecadores" subtitulo={percentual(resumo?.pecadores, resumo?.total)} valor={resumo?.pecadores || 0} icon={CircleUserRound} cor="purple" />
            <ResumoCard titulo="Zumbis" subtitulo={percentual(resumo?.zumbis, resumo?.total)} valor={resumo?.zumbis || 0} icon={Skull} cor="red" />
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6">
            <div className="xl:col-span-7 glass-card rounded-[28px] p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-2xl font-bold uppercase">
                    Mapa de Performance
                  </h2>

                  <div className="flex flex-wrap gap-5 mt-4 text-sm">
                    <LegendaPonto nome="Estrela" cor="bg-green-500" />
                    <LegendaPonto nome="Santo" cor="bg-yellow-400" />
                    <LegendaPonto nome="Pecador" cor="bg-purple-500" />
                    <LegendaPonto nome="Zumbi" cor="bg-red-500" />
                  </div>
                </div>

                <button className="w-12 h-12 rounded-2xl bg-slate-800/80 hover:bg-slate-700 transition flex items-center justify-center text-slate-300">
                  <Maximize2 size={20} />
                </button>
              </div>

              <div className="relative h-[560px] rounded-3xl overflow-hidden bg-slate-950/70 soft-border">
                <div className="absolute inset-[52px_34px_48px_60px] grid grid-cols-2 grid-rows-2 pointer-events-none">
                  <div className="bg-yellow-500/18 p-5">
                    <p className="text-yellow-400 text-2xl font-bold">SANTO</p>
                  </div>

                  <div className="bg-green-500/18 p-5 text-right">
                    <p className="text-green-400 text-2xl font-bold">ESTRELA</p>
                  </div>

                  <div className="bg-red-500/18 p-5 flex items-end">
                    <p className="text-red-400 text-2xl font-bold">ZUMBI</p>
                  </div>

                  <div className="bg-purple-500/18 p-5 flex items-end justify-end">
                    <p className="text-purple-400 text-2xl font-bold">PECADOR</p>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 40, right: 35, bottom: 55, left: 45 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />

                    <XAxis
                      type="number"
                      dataKey="processo"
                      domain={[0, 250]}
                      tick={{ fill: '#cbd5e1' }}
                      stroke="#cbd5e1"
                      label={{
                        value: 'PROCESSO',
                        position: 'insideBottom',
                        offset: -35,
                        fill: '#ffffff',
                        fontSize: 18,
                        fontWeight: 700
                      }}
                    />

                    <YAxis
                      type="number"
                      dataKey="produtividade"
                      domain={[0, 250]}
                      tick={{ fill: '#cbd5e1' }}
                      stroke="#cbd5e1"
                      label={{
                        value: 'PRODUTIVIDADE',
                        angle: -90,
                        position: 'insideLeft',
                        fill: '#ffffff',
                        fontSize: 18,
                        fontWeight: 700
                      }}
                    />

                    <ReferenceLine x={150} stroke="#ffffff" strokeDasharray="7 7" />
                    <ReferenceLine y={150} stroke="#ffffff" strokeDasharray="7 7" />

                    <Tooltip content={<TooltipCustom />} />

                    <Scatter data={dadosFiltrados}>
                      {dadosFiltrados.map((item, index) => (
                        <Cell
                          key={index}
                          fill={corClassificacao(item.classificacao)}
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 border-t border-slate-800 pt-5">
                <CardDescricao icon={Skull} titulo="Zumbi" cor="red" texto="Não segue o processo e não entrega resultados. Precisa ser trabalhado." />
                <CardDescricao icon={Crown} titulo="Santo" cor="yellow" texto="Entrega resultados altos, mas não segue o processo. Muito o que trabalhar." />
                <CardDescricao icon={CircleUserRound} titulo="Pecador" cor="purple" texto="Segue o processo corretamente, mas não entrega resultados. Precisa ser trabalhado." />
                <CardDescricao icon={Star} titulo="Estrela" cor="green" texto="Entrega resultados altos e segue o processo corretamente. Padrão desejado." />
              </div>
            </div>

            <div className="xl:col-span-5 glass-card rounded-[28px] p-6">
              <h2 className="text-2xl font-bold uppercase mb-5">
                Lista de Colaboradores
              </h2>

              <div className="relative mb-6">
                <Search
                  size={20}
                  className="absolute right-4 top-[15px] text-slate-400"
                />

                <input
                  type="text"
                  placeholder="Buscar colaborador..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full bg-slate-950/70 soft-border rounded-2xl px-4 pr-12 py-4 outline-none"
                />
              </div>

              <div className="grid grid-cols-12 text-xs text-slate-400 uppercase pb-3 border-b border-slate-800">
                <span className="col-span-5">Colaborador</span>
                <span className="col-span-2 text-center">Prod.</span>
                <span className="col-span-2 text-center">Proc.</span>
                <span className="col-span-3 text-center">Classificação</span>
              </div>

              <div className="divide-y divide-slate-800 max-h-[610px] overflow-auto">
                {dadosFiltrados.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 items-center py-3 gap-2"
                  >
                    <div className="col-span-5 flex items-center gap-3">
                      <Avatar item={item} />

                      <span className="font-medium truncate">
                        {item.colaborador}
                      </span>
                    </div>

                    <span className="col-span-2 text-center">
                      {item.produtividade}
                    </span>

                    <span className="col-span-2 text-center">
                      {item.processo}
                    </span>

                    <div className="col-span-3 flex justify-center">
                      <Badge tipo={item.classificacao} />
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-center text-slate-400 mt-8">
                {dadosFiltrados.length} de {dados.length} colaborador(es)
              </p>
            </div>
          </section>

          <section className="glass-card rounded-[28px] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                <Save size={24} />
              </div>

              <div>
                <h2 className="text-2xl font-bold">
                  Nova Avaliação
                </h2>

                <p className="text-slate-400 text-sm">
                  Informe produtividade e aderência ao processo.
                </p>
              </div>
            </div>

            <form
              onSubmit={salvarAvaliacao}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4"
            >
              <CampoSelect icon={User} value={colaboradorId} onChange={setColaboradorId} required>
                <option value="">Selecione o colaborador</option>
                {colaboradores.map((colaborador) => (
                  <option key={colaborador.id} value={colaborador.id}>
                    {colaborador.nome}
                  </option>
                ))}
              </CampoSelect>

              <Campo icon={Target} type="number" placeholder="Produtividade" value={produtividade} onChange={setProdutividade} required />
              <Campo icon={Target} type="number" placeholder="Processo" value={processo} onChange={setProcesso} required />
              <Campo icon={CalendarDays} type="date" value={dataAvaliacao} onChange={setDataAvaliacao} />
              <Campo icon={MessageSquare} type="text" placeholder="Observação" value={observacao} onChange={setObservacao} />

              <button
                type="submit"
                className="xl:col-span-5 bg-blue-600 hover:bg-blue-700 transition p-4 rounded-2xl font-bold shadow-lg shadow-blue-500/20"
              >
                Salvar Avaliação
              </button>
            </form>
          </section>
        </>
      )}
    </main>
  )
}

function ResumoCard({ titulo, subtitulo, valor, icon: Icon, cor }) {
  const cores = {
    blue: 'text-blue-400 bg-blue-500/20',
    green: 'text-green-400 bg-green-500/20',
    yellow: 'text-yellow-400 bg-yellow-500/20',
    purple: 'text-purple-400 bg-purple-500/20',
    red: 'text-red-400 bg-red-500/20'
  }

  return (
    <div className="glass-card rounded-2xl p-5 flex items-center gap-5">
      <div className={`w-20 h-20 rounded-full flex items-center justify-center ${cores[cor]}`}>
        <Icon size={38} />
      </div>

      <div>
        <h3 className="text-4xl font-bold">{valor}</h3>
        <p className="text-lg">{titulo}</p>
        <p className="text-slate-400">{subtitulo}</p>
      </div>
    </div>
  )
}

function Avatar({ item }) {
  return (
    <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-800 border border-blue-400/20 flex items-center justify-center text-blue-400 font-bold">
      {item.foto_url ? (
        <img src={item.foto_url} alt={item.colaborador} className="w-full h-full object-cover" />
      ) : (
        item.colaborador?.charAt(0)
      )}
    </div>
  )
}

function Badge({ tipo }) {
  const normalizado = normalizar(tipo)

  const estilos = {
    estrela: 'bg-green-500/30 text-green-100 border-green-400/40',
    santo: 'bg-yellow-500/30 text-yellow-100 border-yellow-400/40',
    pecador: 'bg-purple-500/30 text-purple-100 border-purple-400/40',
    zumbi: 'bg-red-500/30 text-red-100 border-red-400/40'
  }

  return (
    <span className={`w-full text-center px-3 py-2 rounded-lg border text-sm font-bold ${estilos[normalizado] || estilos.zumbi}`}>
      {String(tipo || '').toUpperCase()}
    </span>
  )
}

function LegendaPonto({ nome, cor }) {
  return (
    <span className="flex items-center gap-2 text-slate-200">
      <span className={`w-3 h-3 rounded-full ${cor}`} />
      {nome}
    </span>
  )
}

function CardDescricao({ icon: Icon, titulo, texto, cor }) {
  const cores = {
    red: 'text-red-400',
    yellow: 'text-yellow-400',
    purple: 'text-purple-400',
    green: 'text-green-400'
  }

  return (
    <div className="px-2">
      <div className={`flex items-center gap-2 font-bold text-lg ${cores[cor]}`}>
        <Icon size={28} />
        {titulo.toUpperCase()}
      </div>

      <p className="text-sm text-slate-300 mt-3 leading-relaxed">
        {texto}
      </p>
    </div>
  )
}

function TooltipCustom({ active, payload }) {
  if (!active || !payload?.length) return null

  const item = payload[0].payload

  return (
    <div className="bg-slate-950 border border-blue-500/30 rounded-2xl p-4 shadow-xl">
      <p className="font-bold">{item.colaborador}</p>
      <p className="text-slate-400 text-sm">{item.setor}</p>
      <p className="text-sm mt-2">Produtividade: {item.produtividade}</p>
      <p className="text-sm">Processo: {item.processo}</p>
      <p className="text-blue-400 font-bold mt-2">{item.classificacao}</p>
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

function percentual(valor, total) {
  if (!total || Number(total) === 0) return '0%'
  return `${((Number(valor || 0) / Number(total)) * 100).toFixed(1).replace('.', ',')}%`
}

function normalizar(valor) {
  return String(valor || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function corClassificacao(tipo) {
  const normalizado = normalizar(tipo)

  const cores = {
    estrela: '#22c55e',
    santo: '#eab308',
    pecador: '#a855f7',
    zumbi: '#ef4444'
  }

  return cores[normalizado] || '#3b82f6'
}

export default MapaPerformance