import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Droplets,
  Flame,
  Recycle,
  ShieldCheck,
  SprayCan,
  Save,
  Search,
  XCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

const STORAGE_KEY = 'painel_bi_compliance_unidades'

const UNIDADES_PADRAO = [
  'Centro',
  'Vieiralves',
  'The Office',
  'The Place',
  'Milênio',
  'Cristal',
  'Atlantic',
  'Zona Leste'
]

const OBRIGACOES = [
  {
    chave: 'residuo',
    titulo: 'Lixo Biológico',
    descricao: 'Controle da coleta de resíduos biológicos.',
    periodicidadeMeses: 3,
    responsavel: 'Operações',
    icon: Recycle
  },
  {
    chave: 'dedetizacao',
    titulo: 'Dedetização',
    descricao: 'Controle de dedetização preventiva da unidade.',
    periodicidadeMeses: 3,
    responsavel: 'Operações / Marcelo',
    icon: SprayCan
  },
  {
    chave: 'extintor',
    titulo: 'Extintor',
    descricao: 'Controle de validade, troca e recarga dos extintores.',
    periodicidadeMeses: 12,
    responsavel: 'Operações',
    icon: Flame
  },
  {
    chave: 'reservatorio',
    titulo: "Reservatório / Caixa d'água",
    descricao: 'Controle de limpeza dos reservatórios da unidade.',
    periodicidadeMeses: 6,
    responsavel: 'Unidade',
    icon: Droplets
  }
]

function adicionarMeses(dataISO, meses) {
  if (!dataISO) return ''

  const data = new Date(`${dataISO}T00:00:00`)
  data.setMonth(data.getMonth() + meses)

  return data.toISOString().substring(0, 10)
}

function diferencaDias(dataISO) {
  if (!dataISO) return null

  const hoje = new Date()
  const vencimento = new Date(`${dataISO}T00:00:00`)

  hoje.setHours(0, 0, 0, 0)
  vencimento.setHours(0, 0, 0, 0)

  return Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24))
}

function formatarData(dataISO) {
  if (!dataISO) return 'Não informado'

  const [ano, mes, dia] = dataISO.split('-')

  return `${dia}/${mes}/${ano}`
}

function statusPorVencimento(proximoVencimento) {
  const dias = diferencaDias(proximoVencimento)

  if (dias === null) {
    return {
      tipo: 'pendente',
      texto: 'Pendente',
      classe: 'bg-slate-500/15 text-slate-300 border-slate-500/25',
      ponto: 'bg-slate-400',
      icon: AlertTriangle
    }
  }

  if (dias < 0) {
    return {
      tipo: 'vencido',
      texto: `Vencido há ${Math.abs(dias)} dia(s)`,
      classe: 'bg-red-500/15 text-red-300 border-red-500/25',
      ponto: 'bg-red-400',
      icon: XCircle
    }
  }

  if (dias <= 30) {
    return {
      tipo: 'proximo',
      texto: `Vence em ${dias} dia(s)`,
      classe: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/25',
      ponto: 'bg-yellow-400',
      icon: AlertTriangle
    }
  }

  return {
    tipo: 'em_dia',
    texto: `Em dia • ${dias} dia(s)`,
    classe: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    ponto: 'bg-emerald-400',
    icon: CheckCircle2
  }
}

function criarDadosIniciais() {
  const dados = {}

  for (const unidade of UNIDADES_PADRAO) {
    dados[unidade] = {}

    for (const obrigacao of OBRIGACOES) {
      dados[unidade][obrigacao.chave] = {
        ultimaRealizacao: '',
        proximoVencimento: '',
        responsavel: obrigacao.responsavel,
        observacao: '',
        atualizadoEm: ''
      }
    }
  }

  return dados
}

function AtendimentoCompliance() {
  const [dados, setDados] = useState(() => {
    const salvo = localStorage.getItem(STORAGE_KEY)

    if (salvo) {
      try {
        return JSON.parse(salvo)
      } catch {
        return criarDadosIniciais()
      }
    }

    return criarDadosIniciais()
  })

  const [busca, setBusca] = useState('')
  const [unidadeSelecionada, setUnidadeSelecionada] = useState('Todas')
  const [obrigacaoSelecionada, setObrigacaoSelecionada] = useState(OBRIGACOES[0])
  const [editando, setEditando] = useState(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dados))
  }, [dados])

  const resumo = useMemo(() => {
    let emDia = 0
    let proximo = 0
    let vencido = 0
    let pendente = 0

    for (const unidade of Object.keys(dados)) {
      for (const obrigacao of OBRIGACOES) {
        const item = dados[unidade]?.[obrigacao.chave]
        const status = statusPorVencimento(item?.proximoVencimento)

        if (status.tipo === 'em_dia') emDia++
        if (status.tipo === 'proximo') proximo++
        if (status.tipo === 'vencido') vencido++
        if (status.tipo === 'pendente') pendente++
      }
    }

    return { emDia, proximo, vencido, pendente }
  }, [dados])

  const unidadesFiltradas = useMemo(() => {
    return Object.keys(dados).filter((unidade) => {
      const passaBusca = unidade.toLowerCase().includes(busca.toLowerCase())
      const passaUnidade = unidadeSelecionada === 'Todas' || unidade === unidadeSelecionada

      return passaBusca && passaUnidade
    })
  }, [dados, busca, unidadeSelecionada])

  function abrirEdicao(unidade, obrigacao) {
    const atual = dados[unidade][obrigacao.chave]

    setObrigacaoSelecionada(obrigacao)

    setEditando({
      unidade,
      chave: obrigacao.chave,
      titulo: obrigacao.titulo,
      periodicidadeMeses: obrigacao.periodicidadeMeses,
      ultimaRealizacao: atual.ultimaRealizacao || '',
      proximoVencimento: atual.proximoVencimento || '',
      responsavel: atual.responsavel || obrigacao.responsavel,
      observacao: atual.observacao || ''
    })
  }

  function atualizarCampo(campo, valor) {
    setEditando((atual) => {
      const novo = {
        ...atual,
        [campo]: valor
      }

      if (campo === 'ultimaRealizacao') {
        novo.proximoVencimento = adicionarMeses(valor, atual.periodicidadeMeses)
      }

      return novo
    })
  }

  function salvarEdicao() {
    if (!editando) return

    setDados((atual) => ({
      ...atual,
      [editando.unidade]: {
        ...atual[editando.unidade],
        [editando.chave]: {
          ultimaRealizacao: editando.ultimaRealizacao,
          proximoVencimento: editando.proximoVencimento,
          responsavel: editando.responsavel,
          observacao: editando.observacao,
          atualizadoEm: new Date().toISOString()
        }
      }
    }))

    toast.success('Controle atualizado com sucesso')
    setEditando(null)
  }

  return (
    <main className="min-h-screen bg-[#020817] text-white p-8 overflow-y-auto">
      <section className="mb-8">
        <p className="text-blue-400 font-semibold mb-2">
          Atendimento
        </p>

        <h1 className="text-5xl font-black tracking-tight">
          Compliance das Unidades
        </h1>

        <p className="text-slate-400 mt-3 text-lg max-w-4xl">
          Controle de lixo biológico, dedetização, extintores e limpeza de reservatórios por unidade.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <CardResumo titulo="Em dia" valor={resumo.emDia} icon={CheckCircle2} cor="emerald" />
        <CardResumo titulo="Próximo do vencimento" valor={resumo.proximo} icon={AlertTriangle} cor="yellow" />
        <CardResumo titulo="Vencidos" valor={resumo.vencido} icon={XCircle} cor="red" />
        <CardResumo titulo="Pendentes" valor={resumo.pendente} icon={Bell} cor="blue" />
      </section>

      <section className="bg-slate-900/60 border border-blue-500/15 rounded-[28px] p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <ClipboardCheck className="text-blue-400" />
              Painel de acompanhamento
            </h2>

            <p className="text-slate-400 mt-1">
              Clique em qualquer item para atualizar a última realização, vencimento e observações.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 min-w-[260px]">
              <Search size={18} className="text-slate-400" />
              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Pesquisar unidade..."
                className="bg-transparent outline-none w-full text-white placeholder:text-slate-500"
              />
            </div>

            <select
              value={unidadeSelecionada}
              onChange={(event) => setUnidadeSelecionada(event.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white outline-none"
            >
              <option>Todas</option>
              {Object.keys(dados).map((unidade) => (
                <option key={unidade}>{unidade}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="bg-slate-900/50 border border-slate-800 rounded-[28px] overflow-hidden">
        <div className="grid grid-cols-[1.1fr_repeat(4,1fr)] gap-0 bg-slate-950/80 border-b border-slate-800 px-6 py-4 text-sm font-bold text-slate-300">
          <div>Unidade</div>
          {OBRIGACOES.map((obrigacao) => (
            <div key={obrigacao.chave}>{obrigacao.titulo}</div>
          ))}
        </div>

        {unidadesFiltradas.map((unidade) => (
          <div
            key={unidade}
            className="grid grid-cols-[1.1fr_repeat(4,1fr)] gap-0 px-6 py-5 border-b border-slate-800/70 hover:bg-slate-900/70 transition"
          >
            <div className="font-bold text-lg">
              {unidade}
            </div>

            {OBRIGACOES.map((obrigacao) => {
              const item = dados[unidade][obrigacao.chave]
              const status = statusPorVencimento(item.proximoVencimento)
              const Icon = obrigacao.icon

              return (
                <button
                  key={obrigacao.chave}
                  onClick={() => abrirEdicao(unidade, obrigacao)}
                  className="text-left pr-4 group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`w-3.5 h-3.5 rounded-full shadow-lg ${status.ponto}`} />
                    <Icon size={17} className="text-slate-400 group-hover:text-blue-400 transition" />
                  </div>

                  <p className="text-sm text-slate-300">
                    {status.texto}
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    Venc.: {formatarData(item.proximoVencimento)}
                  </p>
                </button>
              )
            })}
          </div>
        ))}
      </section>

      {editando && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-2xl bg-[#050b18] border border-blue-500/20 rounded-[32px] p-8 shadow-2xl shadow-blue-500/10">
            <div className="flex justify-between items-start mb-7">
              <div>
                <p className="text-blue-400 font-bold mb-1">
                  {editando.unidade}
                </p>

                <h2 className="text-3xl font-black">
                  {editando.titulo}
                </h2>

                <p className="text-slate-400 mt-2">
                  Periodicidade: a cada {editando.periodicidadeMeses} mês(es).
                </p>
              </div>

              <button
                onClick={() => setEditando(null)}
                className="w-11 h-11 rounded-2xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CampoData
                label="Última realização"
                value={editando.ultimaRealizacao}
                onChange={(value) => atualizarCampo('ultimaRealizacao', value)}
              />

              <CampoData
                label="Próximo vencimento"
                value={editando.proximoVencimento}
                onChange={(value) => atualizarCampo('proximoVencimento', value)}
              />

              <CampoTexto
                label="Responsável"
                value={editando.responsavel}
                onChange={(value) => atualizarCampo('responsavel', value)}
              />

              <div>
                <label className="text-sm text-slate-400 mb-2 block">
                  Status atual
                </label>

                <div className={`border rounded-2xl px-4 py-4 font-bold ${statusPorVencimento(editando.proximoVencimento).classe}`}>
                  {statusPorVencimento(editando.proximoVencimento).texto}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="text-sm text-slate-400 mb-2 block">
                Observação
              </label>

              <textarea
                value={editando.observacao}
                onChange={(event) => atualizarCampo('observacao', event.target.value)}
                rows={4}
                placeholder="Ex.: Unidade informou que coleta será realizada na próxima semana..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <div className="flex flex-col md:flex-row gap-4 mt-8">
              <button
                onClick={() => setEditando(null)}
                className="flex-1 bg-slate-800 text-slate-300 py-4 rounded-2xl font-bold hover:bg-slate-700 transition"
              >
                Cancelar
              </button>

              <button
                onClick={salvarEdicao}
                className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-500 transition shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Salvar controle
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function CardResumo({ titulo, valor, icon: Icon, cor }) {
  const cores = {
    emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
    red: 'bg-red-500/10 text-red-300 border-red-500/20',
    blue: 'bg-blue-500/10 text-blue-300 border-blue-500/20'
  }

  return (
    <div className={`border rounded-[26px] p-6 ${cores[cor]}`}>
      <div className="flex items-center justify-between">
        <p className="font-semibold">{titulo}</p>
        <Icon size={24} />
      </div>

      <p className="text-4xl font-black text-white mt-4">
        {valor}
      </p>
    </div>
  )
}

function CampoData({ label, value, onChange }) {
  return (
    <div>
      <label className="text-sm text-slate-400 mb-2 block">
        {label}
      </label>

      <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 focus-within:border-blue-500">
        <CalendarDays size={18} className="text-slate-400" />
        <input
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="bg-transparent outline-none text-white w-full"
        />
      </div>
    </div>
  )
}

function CampoTexto({ label, value, onChange }) {
  return (
    <div>
      <label className="text-sm text-slate-400 mb-2 block">
        {label}
      </label>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-blue-500"
      />
    </div>
  )
}

export default AtendimentoCompliance
