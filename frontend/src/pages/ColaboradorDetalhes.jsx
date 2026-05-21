import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'

import {
  Camera,
  Building2,
  Briefcase,
  Headphones,
  ShoppingCart,
  DollarSign,
  Clock,
  AlertTriangle,
  Phone,
  BadgePercent,
  Trophy
} from 'lucide-react'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

import api from '../services/api'
import Topbar from '../components/Topbar'

function ColaboradorDetalhes() {
  const { id } = useParams()

  const [dados, setDados] = useState(null)
  const [uploading, setUploading] = useState(false)

  async function carregarDados() {
    try {
      const response = await api.get(`/indicadores/colaborador/${id}`)
      setDados(response.data)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar dados do colaborador')
    }
  }

  async function alterarFoto(event) {
    try {
      const file = event.target.files[0]

      if (!file) return

      setUploading(true)

      const reader = new FileReader()

      reader.readAsDataURL(file)

      reader.onloadend = async () => {
        const base64 = reader.result

        await api.patch(`/colaboradores/${id}/foto`, {
          foto_url: base64
        })

        setDados((old) => ({
          ...old,
          foto_url: base64
        }))

        toast.success('Foto atualizada com sucesso 📸')

        setUploading(false)
      }
    } catch (error) {
      console.error(error)
      setUploading(false)

      toast.error('Erro ao enviar foto')
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  if (!dados) {
    return (
      <main className="flex-1 p-8 overflow-auto">
        <Topbar titulo="Perfil do Colaborador" />

        <section className="glass-card rounded-[32px] p-10 text-center">
          <p className="text-slate-400">
            Carregando dados do colaborador...
          </p>
        </section>
      </main>
    )
  }

  const grafico = [
    { nome: 'Atendimentos', valor: Number(dados.total_atendimentos || 0) },
    { nome: 'Vendas', valor: Number(dados.total_vendas || 0) },
    { nome: 'Erros', valor: Number(dados.total_erros || 0) },
    { nome: 'Ligações', valor: Number(dados.total_ligacoes_atendidas || 0) }
  ]

  return (
    <main className="flex-1 p-8 overflow-auto">
      <Topbar titulo="Perfil do Colaborador" />

      <section className="glass-card glow-blue rounded-[36px] p-8 mb-8">
        <div className="flex flex-col xl:flex-row xl:items-center gap-12">
          <div className="relative flex justify-center xl:justify-start">
            <div className="w-72 h-72 rounded-full bg-gradient-to-br from-blue-500 to-blue-900 p-2 shadow-[0_0_55px_rgba(37,99,235,0.55)]">
              <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden border border-blue-400/40">
                {dados.foto_url ? (
                  <img
                    src={dados.foto_url}
                    alt={dados.nome}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-8xl font-bold text-blue-400">
                    {dados.nome?.charAt(0)}
                  </span>
                )}
              </div>
            </div>

            <label
              className="absolute bottom-8 right-6 w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-700 transition flex items-center justify-center shadow-lg shadow-blue-500/40 border-4 border-slate-950 cursor-pointer"
              title="Adicionar foto"
            >
              <Camera size={30} />

              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={alterarFoto}
              />
            </label>
          </div>

          <div className="flex-1 text-center xl:text-left">
            <p className="text-blue-400 font-bold text-xl mb-4">
              {uploading ? 'Enviando foto...' : 'Análise Individual'}
            </p>

            <h2 className="text-6xl lg:text-7xl font-bold leading-tight">
              {dados.nome}
            </h2>

            <div className="flex flex-wrap justify-center xl:justify-start gap-4 mt-8">
              <Tag icon={Building2} texto={dados.setor} />
              <Tag icon={Briefcase} texto={dados.cargo} />
              <Tag icon={Trophy} texto={`Placar ${dados.score}`} destaque />
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <Kpi titulo="Atendimentos" valor={dados.total_atendimentos} icon={Headphones} cor="blue" subtitulo="Total realizado" />
        <Kpi titulo="Vendas" valor={dados.total_vendas} icon={ShoppingCart} cor="green" subtitulo="Total realizado" />
        <Kpi titulo="Valor Vendido" valor={`R$ ${dados.valor_total_vendas}`} icon={DollarSign} cor="yellow" subtitulo="Total registrado" />
        <Kpi titulo="Score" valor={dados.score} icon={Trophy} cor="purple" subtitulo="Pontuação atual" />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 glass-card rounded-[32px] p-7">
          <h2 className="text-2xl font-bold mb-2">
            Performance Individual
          </h2>

          <p className="text-slate-400 text-sm mb-8">
            Comparativo dos principais indicadores do colaborador.
          </p>

          <div className="h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={grafico}>
                <XAxis dataKey="nome" />
                <YAxis />
                <Tooltip />

                <Bar
                  dataKey="valor"
                  fill="#2563eb"
                  radius={[12, 12, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-[32px] p-7">
          <h2 className="text-2xl font-bold mb-6">
            Métricas Operacionais
          </h2>

          <div className="space-y-4">
            <Linha icon={Clock} titulo="T.A.T Médio" valor={`${dados.tat_medio}s`} />
            <Linha icon={AlertTriangle} titulo="Erros" valor={dados.total_erros} vermelho />
            <Linha icon={BadgePercent} titulo="Solicitações de Desconto" valor={dados.total_solicitacoes_desconto} />
            <Linha icon={Phone} titulo="Ligações Atendidas" valor={dados.total_ligacoes_atendidas} />
          </div>
        </div>
      </section>
    </main>
  )
}

function Tag({ icon: Icon, texto, destaque }) {
  return (
    <span
      className={`flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold ${
        destaque
          ? 'bg-blue-500/20 text-blue-400'
          : 'bg-slate-950/60 text-slate-300 soft-border'
      }`}
    >
      <Icon size={17} />
      {texto}
    </span>
  )
}

function Kpi({ titulo, valor, icon: Icon, cor, subtitulo }) {
  const cores = {
    blue: 'text-blue-400 bg-blue-500/10',
    green: 'text-green-400 bg-green-500/10',
    yellow: 'text-yellow-400 bg-yellow-500/10',
    purple: 'text-purple-400 bg-purple-500/10'
  }

  return (
    <div className="glass-card rounded-[28px] p-7 hover:scale-[1.02] transition">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-400 text-xl">
            {titulo}
          </p>

          <h3 className="text-5xl font-bold mt-6">
            {valor}
          </h3>

          <p className="text-slate-400 mt-3">
            {subtitulo}
          </p>
        </div>

        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center ${cores[cor]}`}>
          <Icon size={38} />
        </div>
      </div>
    </div>
  )
}

function Linha({ icon: Icon, titulo, valor, vermelho }) {
  return (
    <div className="bg-slate-950/60 soft-border rounded-2xl p-4 flex justify-between items-center">
      <div className="flex items-center gap-3 text-slate-400">
        <Icon size={18} />
        <span>{titulo}</span>
      </div>

      <p className={`font-bold ${vermelho ? 'text-red-400' : 'text-white'}`}>
        {valor}
      </p>
    </div>
  )
}

export default ColaboradorDetalhes