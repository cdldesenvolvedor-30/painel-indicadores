import { useMemo, useState } from 'react'

const STORAGE_KEY = 'ox360_financeiro_valores'

const RAZAO_AREA = 21.92

const CAMPOS_FIXOS = [
  { key: 'iptu', nome: 'IPTU 2025' },
  { key: 'condominio', nome: 'Condomínio' },
  { key: 'aluguel', nome: 'Aluguel' },
  { key: 'servicosGerais', nome: 'Serviços Gerais' },
  { key: 'manutencaoAr', nome: 'Manutenção de Ar Condicionado' },
  { key: 'setorFaturamento', nome: 'Setor Faturamento' }
]

const CAMPOS_MANUAIS = [
  { key: 'materialLimpeza', nome: 'Material Limpeza' },
  { key: 'luz', nome: 'Luz' },
  { key: 'salarios', nome: 'Salários' },
  { key: 'marketing', nome: 'MKT / Tráfego SXT' },
  { key: 'almoxarifado', nome: 'Almoxarifado' },
  { key: 'impostos', nome: 'Impostos' },
  { key: 'examesUrgencia', nome: 'PGTO Exames de Urgência' },
  { key: 'precoColeta', nome: 'Preço Coleta' },
  { key: 'obra', nome: 'Obra' },
  { key: 'reagentes', nome: 'Reagentes' },
  { key: 'saldoAnterior', nome: 'Saldo Anterior' }
]

const CAMPOS_IMPORTADOS = [
  { key: 'faturamentoParticular', nome: 'Faturamento Particular' },
  { key: 'faturamentoConvenio', nome: 'Faturamento Convênio' },
  { key: 'estoqueMateriais', nome: 'Materiais / Estoque' },
  { key: 'assessoriaTecnica', nome: 'Assessoria Técnica' }
]

function valorInicial() {
  return {
    mesReferencia: 'Agosto/2025',
    razaoArea: RAZAO_AREA,
    fixos: {},
    manuais: {},
    importados: {},
    historico: []
  }
}

function OX360Financeiro() {
  const [dados, setDados] = useState(() => {
    const salvo = localStorage.getItem(STORAGE_KEY)
    return salvo ? JSON.parse(salvo) : valorInicial()
  })

  function salvar(novosDados = dados) {
    setDados(novosDados)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(novosDados))
  }

  function atualizarGrupo(grupo, key, valor) {
    const novosDados = {
      ...dados,
      [grupo]: {
        ...dados[grupo],
        [key]: Number(valor) || 0
      }
    }

    salvar(novosDados)
  }

  function atualizarCampo(key, valor) {
    const novosDados = {
      ...dados,
      [key]: valor
    }

    salvar(novosDados)
  }

  const resumo = useMemo(() => {
    const fixos = somaObjeto(dados.fixos)
    const manuais = somaObjeto(dados.manuais)
    const importados = somaObjeto(dados.importados)

    const entradas =
      Number(dados.importados?.faturamentoParticular || 0) +
      Number(dados.importados?.faturamentoConvenio || 0)

    const saidasFixasRateadas = fixos * (Number(dados.razaoArea) / 100)

    const saidas =
      saidasFixasRateadas +
      manuais +
      Number(dados.importados?.estoqueMateriais || 0) +
      Number(dados.importados?.assessoriaTecnica || 0)

    const lucro = entradas - saidas
    const saldoAcumulado = lucro + Number(dados.manuais?.saldoAnterior || 0)
    const margem = entradas > 0 ? (lucro / entradas) * 100 : 0

    return {
      entradas,
      saidas,
      lucro,
      saldoAcumulado,
      margem,
      saidasFixasRateadas
    }
  }, [dados])

  return (
    <main className="min-h-screen bg-[#020817] text-white p-8 overflow-y-auto">
      <div className="mb-8 flex items-start justify-between gap-5">
        <div>
          <p className="text-blue-400 font-semibold">Diretoria</p>
          <h1 className="text-4xl font-bold mt-2">OX360 Financeiro</h1>
          <p className="text-slate-400 mt-2">
            Painel financeiro executivo com faturamento, estoque, assessoria técnica, despesas e lucro.
          </p>
        </div>

        <input
          value={dados.mesReferencia}
          onChange={(e) => atualizarCampo('mesReferencia', e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 outline-none focus:border-blue-500"
          placeholder="Mês/Ano"
        />
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <BotaoUpload texto="Importar Faturamento" />
        <BotaoUpload texto="Importar Estoque" />
        <BotaoUpload texto="Importar Assessoria Técnica" />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-5 gap-5 mb-8">
        <Card titulo="Receita Total" valor={moeda(resumo.entradas)} />
        <Card titulo="Despesa Total" valor={moeda(resumo.saidas)} />
        <Card titulo="Lucro Líquido" valor={moeda(resumo.lucro)} />
        <Card titulo="Margem Líquida" valor={`${resumo.margem.toFixed(2)}%`} />
        <Card titulo="Saldo Acumulado" valor={moeda(resumo.saldoAcumulado)} />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <PainelCampos
          titulo="Valores Fixos Configuráveis"
          subtitulo="Valores mensais fixos. A razão da área será aplicada."
          campos={CAMPOS_FIXOS}
          grupo="fixos"
          dados={dados.fixos}
          onChange={atualizarGrupo}
        />

        <PainelCampos
          titulo="Valores Manuais do Mês"
          subtitulo="Valores variáveis preenchidos manualmente."
          campos={CAMPOS_MANUAIS}
          grupo="manuais"
          dados={dados.manuais}
          onChange={atualizarGrupo}
        />

        <PainelCampos
          titulo="Valores Importados"
          subtitulo="Depois serão preenchidos pelas planilhas importadas."
          campos={CAMPOS_IMPORTADOS}
          grupo="importados"
          dados={dados.importados}
          onChange={atualizarGrupo}
        />
      </section>

      <section className="bg-slate-900/70 border border-blue-500/10 rounded-3xl p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Resumo Consolidado - {dados.mesReferencia}</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-950/70 text-blue-300">
              <tr>
                <th className="text-left p-3">Descrição</th>
                <th className="text-right p-3">Valor Total</th>
                <th className="text-right p-3">Razão Área</th>
                <th className="text-right p-3">Valor da Área</th>
                <th className="text-right p-3">Saída</th>
                <th className="text-right p-3">Entrada</th>
              </tr>
            </thead>

            <tbody>
              {CAMPOS_FIXOS.map((campo) => (
                <LinhaResumo
                  key={campo.key}
                  nome={campo.nome}
                  valor={dados.fixos?.[campo.key] || 0}
                  razao={dados.razaoArea}
                  aplicarRazao
                />
              ))}

              {CAMPOS_MANUAIS.map((campo) => (
                <LinhaResumo
                  key={campo.key}
                  nome={campo.nome}
                  valor={dados.manuais?.[campo.key] || 0}
                  razao={campo.key === 'saldoAnterior' ? null : 'Não se aplica'}
                  entrada={campo.key === 'saldoAnterior'}
                />
              ))}

              {CAMPOS_IMPORTADOS.map((campo) => (
                <LinhaResumo
                  key={campo.key}
                  nome={campo.nome}
                  valor={dados.importados?.[campo.key] || 0}
                  entrada={campo.key.includes('faturamento')}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/70 border border-blue-500/10 rounded-3xl p-6">
          <h2 className="text-xl font-bold mb-4">Receitas x Despesas</h2>
          <div className="h-72 flex items-center justify-center text-slate-500">
            Gráfico será conectado após leitura real das planilhas.
          </div>
        </div>

        <div className="bg-slate-900/70 border border-blue-500/10 rounded-3xl p-6">
          <h2 className="text-xl font-bold mb-4">Exportações</h2>

          <div className="space-y-3">
            <button className="w-full bg-slate-800 hover:bg-slate-700 transition rounded-xl p-4 font-bold">
              Exportar Planilha Completa
            </button>

            <button className="w-full bg-purple-600 hover:bg-purple-500 transition rounded-xl p-4 font-bold">
              Gerar PDF Completo
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}

function PainelCampos({ titulo, subtitulo, campos, grupo, dados, onChange }) {
  return (
    <div className="bg-slate-900/70 border border-blue-500/10 rounded-3xl p-6">
      <h2 className="text-xl font-bold">{titulo}</h2>
      <p className="text-slate-500 text-sm mt-1 mb-5">{subtitulo}</p>

      <div className="space-y-4">
        {campos.map((campo) => (
          <div key={campo.key}>
            <label className="text-sm text-slate-400">{campo.nome}</label>
            <input
              type="number"
              value={dados?.[campo.key] || ''}
              onChange={(e) => onChange(grupo, campo.key, e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
              placeholder="R$ 0,00"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function LinhaResumo({ nome, valor, razao, aplicarRazao, entrada }) {
  const valorArea = aplicarRazao ? valor * (Number(razao) / 100) : valor

  return (
    <tr className="border-b border-slate-800">
      <td className="p-3">{nome}</td>
      <td className="p-3 text-right">{moeda(valor)}</td>
      <td className="p-3 text-right">
        {razao ? `${razao}%` : '-'}
      </td>
      <td className="p-3 text-right">{aplicarRazao ? moeda(valorArea) : '-'}</td>
      <td className="p-3 text-right text-red-300">
        {!entrada ? moeda(valorArea) : '-'}
      </td>
      <td className="p-3 text-right text-green-300">
        {entrada ? moeda(valor) : '-'}
      </td>
    </tr>
  )
}

function BotaoUpload({ texto }) {
  return (
    <button className="bg-blue-600 hover:bg-blue-500 transition rounded-2xl p-5 font-bold">
      {texto}
    </button>
  )
}

function Card({ titulo, valor }) {
  return (
    <div className="bg-slate-900/70 border border-blue-500/10 rounded-3xl p-6">
      <p className="text-slate-400 text-sm">{titulo}</p>
      <h3 className="text-3xl font-bold mt-3">{valor}</h3>
    </div>
  )
}

function somaObjeto(obj = {}) {
  return Object.values(obj).reduce((acc, valor) => acc + Number(valor || 0), 0)
}

function moeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

export default OX360Financeiro
