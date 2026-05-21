import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

import {
  Target,
  User,
  CalendarDays,
  Headphones,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  PlusCircle
} from 'lucide-react'

import api from '../services/api'
import Topbar from '../components/Topbar'
import SkeletonCard from '../components/SkeletonCard'

function Metas() {
  const [metas, setMetas] = useState([])
  const [colaboradores, setColaboradores] = useState([])
  const [loading, setLoading] = useState(true)

  const [colaboradorId, setColaboradorId] = useState('')
  const [mes, setMes] = useState('')
  const [ano, setAno] = useState('')
  const [metaAtendimentos, setMetaAtendimentos] = useState('')
  const [metaVendas, setMetaVendas] = useState('')
  const [metaValorVendas, setMetaValorVendas] = useState('')
  const [limiteErros, setLimiteErros] = useState('')

  async function carregarMetas() {
    try {
      setLoading(true)
      const response = await api.get('/metas')
      setMetas(response.data)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar metas')
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

  async function cadastrarMeta(e) {
    e.preventDefault()

    try {
      await api.post('/metas', {
        colaborador_id: colaboradorId,
        mes: Number(mes),
        ano: Number(ano),
        meta_atendimentos: Number(metaAtendimentos || 0),
        meta_vendas: Number(metaVendas || 0),
        meta_valor_vendas: Number(metaValorVendas || 0),
        limite_erros: Number(limiteErros || 0)
      })

      toast.success('Meta cadastrada com sucesso 🚀')

      setColaboradorId('')
      setMes('')
      setAno('')
      setMetaAtendimentos('')
      setMetaVendas('')
      setMetaValorVendas('')
      setLimiteErros('')

      carregarMetas()
    } catch (error) {
      console.error(error)

      toast.error(
        error.response?.data?.erro ||
        'Erro ao cadastrar meta'
      )
    }
  }

  useEffect(() => {
    carregarMetas()
    carregarColaboradores()
  }, [])

  const totalMetas = metas.length
  const colaboradoresComMeta = new Set(metas.map((meta) => meta.colaborador_id)).size

  return (
    <main className="flex-1 p-8 overflow-auto">
      <Topbar titulo="Metas / KPIs" />

      <section className="glass-card glow-blue rounded-[32px] p-8 mb-8">
        <h2 className="text-5xl font-bold leading-tight">
          Defina metas claras para acompanhar resultados
        </h2>

        <p className="text-slate-400 mt-4 max-w-2xl">
          Configure metas mensais por colaborador.
        </p>
      </section>

      <section className="glass-card rounded-[32px] p-7 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
            <PlusCircle size={26} />
          </div>

          <div>
            <h2 className="text-2xl font-bold">Nova Meta</h2>
            <p className="text-slate-400 text-sm">Cadastre uma meta mensal.</p>
          </div>
        </div>

        <form
          onSubmit={cadastrarMeta}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
        >
          <CampoSelect icon={User} value={colaboradorId} onChange={setColaboradorId} required>
            <option value="">Selecione o colaborador</option>

            {colaboradores.map((colaborador) => (
              <option key={colaborador.id} value={colaborador.id}>
                {colaborador.nome}
              </option>
            ))}
          </CampoSelect>

          <Campo icon={CalendarDays} type="number" placeholder="Mês" value={mes} onChange={setMes} required />
          <Campo icon={CalendarDays} type="number" placeholder="Ano" value={ano} onChange={setAno} required />
          <Campo icon={Headphones} type="number" placeholder="Meta de atendimentos" value={metaAtendimentos} onChange={setMetaAtendimentos} />
          <Campo icon={ShoppingCart} type="number" placeholder="Meta de vendas" value={metaVendas} onChange={setMetaVendas} />
          <Campo icon={DollarSign} type="number" step="0.01" placeholder="Meta em valor vendido" value={metaValorVendas} onChange={setMetaValorVendas} />
          <Campo icon={AlertTriangle} type="number" placeholder="Limite máximo de erros" value={limiteErros} onChange={setLimiteErros} />

          <button
            type="submit"
            className="xl:col-span-4 bg-blue-600 hover:bg-blue-700 transition p-4 rounded-2xl font-bold shadow-lg shadow-blue-500/20"
          >
            Salvar Meta
          </button>
        </form>
      </section>

      <section className="glass-card rounded-[32px] p-7">
        <h2 className="text-2xl font-bold mb-6">Metas Cadastradas</h2>

        {loading ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : metas.length === 0 ? (
          <div className="bg-slate-950/60 soft-border rounded-[32px] p-10 text-center">
            <Target size={48} className="mx-auto text-blue-400 mb-4" />
            <h2 className="text-3xl font-bold mb-2">Nenhuma meta encontrada</h2>
            <p className="text-slate-400">Cadastre metas para começar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {metas.map((meta, index) => (
              <motion.div
                key={meta.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.03 }}
                className="bg-slate-950/60 soft-border rounded-[28px] p-6 hover:bg-blue-950/20 transition"
              >
                <div className="flex justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-2xl font-bold">{meta.colaborador}</h3>
                    <p className="text-slate-400 text-sm mt-1">{meta.setor}</p>
                  </div>

                  <span className="bg-blue-500/15 text-blue-400 px-4 py-2 rounded-full text-sm font-bold">
                    {meta.mes}/{meta.ano}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Info titulo="Atendimentos" valor={meta.meta_atendimentos} />
                  <Info titulo="Vendas" valor={meta.meta_vendas} />
                  <Info titulo="Valor" valor={`R$ ${meta.meta_valor_vendas}`} />
                  <Info titulo="Limite Erros" valor={meta.limite_erros} vermelho />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </main>
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
      <p className={`text-xl font-bold ${vermelho ? 'text-red-400' : 'text-white'}`}>
        {valor}
      </p>
    </div>
  )
}

export default Metas