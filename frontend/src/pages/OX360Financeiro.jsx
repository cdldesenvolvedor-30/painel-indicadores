import { useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts'

const STORAGE_KEY = 'ox360_financeiro_valores'
const RAZAO_AREA_PADRAO = 21.92

const LOGO_PAINEL_BI_URL = '/logo-painel.png'
const LOGO_CDL_URL = '/logo-cdl.png'

const CAMPOS_FIXOS = [
  { key: 'iptu', nome: 'IPTU 2025' },
  { key: 'condominio', nome: 'Condomínio' },
  { key: 'aluguel', nome: 'Aluguel' },
  { key: 'servicosGerais', nome: 'Serviços Gerais' },
  { key: 'salarios', nome: 'Salários' },
  { key: 'manutencaoAr', nome: 'Manutenção de Ar Condicionado' },
  { key: 'setorFaturamento', nome: 'Setor Faturamento' }
]

const CAMPOS_MANUAIS = [
  { key: 'materialLimpeza', nome: 'Material Limpeza' },
  { key: 'luz', nome: 'Luz' },
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
    razaoArea: RAZAO_AREA_PADRAO,
    fixos: {
      iptu: 0,
      condominio: 2110.03,
      aluguel: 20000,
      servicosGerais: 1518.78,
      salarios: 19500,
      manutencaoAr: 12800,
      setorFaturamento: 6846.2
    },
    manuais: {},
    importados: {},
    detalhesImportados: {
      faturamento: [],
      estoque: [],
      assessoria: []
    },
    arquivosImportados: [],
    historico: []
  }
}

function OX360Financeiro() {
  const inputArquivosRef = useRef(null)
  const [editandoFixos, setEditandoFixos] = useState(false)
  const [importando, setImportando] = useState(false)

  const [dados, setDados] = useState(() => {
    const salvo = localStorage.getItem(STORAGE_KEY)
    if (!salvo) return valorInicial()

    try {
      const dadosSalvos = JSON.parse(salvo)
      return {
        ...valorInicial(),
        ...dadosSalvos,
        fixos: {
          ...valorInicial().fixos,
          ...(dadosSalvos.fixos || {})
        },
        manuais: dadosSalvos.manuais || {},
        importados: dadosSalvos.importados || {},
        detalhesImportados: {
          ...valorInicial().detalhesImportados,
          ...(dadosSalvos.detalhesImportados || {})
        },
        arquivosImportados: dadosSalvos.arquivosImportados || [],
        historico: dadosSalvos.historico || []
      }
    } catch {
      return valorInicial()
    }
  })

  const resumo = useMemo(() => calcularResumo(dados), [dados])
  const dadosGraficos = useMemo(() => montarDadosGraficos(dados, resumo), [dados, resumo])

  function salvar(novosDados = dados) {
    setDados(novosDados)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(novosDados))
  }

  function atualizarGrupo(grupo, key, valor) {
    salvar({
      ...dados,
      [grupo]: {
        ...dados[grupo],
        [key]: converterNumero(valor)
      }
    })
  }

  function atualizarCampo(key, valor) {
    salvar({
      ...dados,
      [key]: key === 'razaoArea' ? converterNumero(valor) : valor
    })
  }

  function limparTabela() {
    salvar({
      ...dados,
      manuais: {},
      importados: {},
      detalhesImportados: valorInicial().detalhesImportados,
      arquivosImportados: []
    })
    toast.success('Tabela limpa. Os valores fixos foram mantidos.')
  }

  async function processarArquivos(event) {
    const arquivos = Array.from(event.target.files || [])
    if (arquivos.length === 0) return

    setImportando(true)

    try {
      const resultado = {
        importados: {
          faturamentoParticular: 0,
          faturamentoConvenio: 0,
          estoqueMateriais: 0,
          assessoriaTecnica: 0
        },
        detalhesImportados: {
          faturamento: [],
          estoque: [],
          assessoria: []
        },
        arquivosImportados: []
      }

      for (const arquivo of arquivos) {
        const workbook = await lerArquivoExcel(arquivo)
        const tipo = identificarTipoArquivo(arquivo.name, workbook)

        if (tipo === 'faturamento') {
          const parcial = extrairFaturamento(workbook, dados.mesReferencia)
          resultado.importados.faturamentoParticular += parcial.particular
          resultado.importados.faturamentoConvenio += parcial.convenio
          resultado.detalhesImportados.faturamento.push(...parcial.detalhes)
          resultado.arquivosImportados.push({ nome: arquivo.name, tipo: 'Faturamento', registros: parcial.detalhes.length })
        } else if (tipo === 'estoque') {
          const parcial = extrairEstoque(workbook)
          resultado.importados.estoqueMateriais += parcial.total
          resultado.detalhesImportados.estoque.push(...parcial.detalhes)
          resultado.arquivosImportados.push({ nome: arquivo.name, tipo: 'Estoque', registros: parcial.detalhes.length })
        } else if (tipo === 'assessoria') {
          const parcial = extrairAssessoria(workbook, dados.mesReferencia)
          resultado.importados.assessoriaTecnica += parcial.valorFinanceiro
          resultado.detalhesImportados.assessoria.push(...parcial.detalhes)
          resultado.arquivosImportados.push({ nome: arquivo.name, tipo: 'Assessoria Técnica', registros: parcial.detalhes.length })
        } else {
          resultado.arquivosImportados.push({ nome: arquivo.name, tipo: 'Não identificado', registros: 0 })
        }
      }

      salvar({
        ...dados,
        importados: {
          ...dados.importados,
          ...resultado.importados
        },
        detalhesImportados: resultado.detalhesImportados,
        arquivosImportados: resultado.arquivosImportados
      })

      toast.success('Planilhas importadas e valores preenchidos automaticamente.')
    } catch (error) {
      console.error(error)
      toast.error('Erro ao importar planilhas. Verifique o formato dos arquivos.')
    } finally {
      setImportando(false)
      event.target.value = ''
    }
  }

  function montarRelatorio() {
    return {
      id: Date.now(),
      data: new Date().toLocaleString('pt-BR'),
      mesReferencia: dados.mesReferencia,
      receitaTotal: resumo.entradas,
      despesaTotal: resumo.saidas,
      lucroLiquido: resumo.lucro,
      margemLiquida: resumo.margem,
      saldoAcumulado: resumo.saldoAcumulado,
      dados,
      resumo
    }
  }

  async function gerarRelatorio() {
    const relatorio = montarRelatorio()

    salvar({
      ...dados,
      historico: [relatorio, ...(dados.historico || [])]
    })

    await gerarPDFRelatorio(relatorio)
    toast.success('Relatório PDF gerado e salvo no histórico.')
  }

  function removerRelatorio(id) {
    salvar({
      ...dados,
      historico: dados.historico.filter((item) => item.id !== id)
    })
    toast.success('Relatório removido do histórico.')
  }

  function exportarPlanilhaCompleta() {
    gerarExcelRelatorio(montarRelatorio())
    toast.success('Planilha Excel exportada com sucesso.')
  }

  async function baixarRelatorio(relatorio) {
    await gerarPDFRelatorio(relatorio)
    toast.success('PDF baixado novamente.')
  }

  return (
    <main className="min-h-screen bg-[#020817] text-white p-8 overflow-y-auto">
      <div className="mb-8 flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
        <div>
          <p className="text-blue-400 font-semibold">Diretoria</p>
          <h1 className="text-4xl font-bold mt-2">OX360 Financeiro</h1>
          <p className="text-slate-400 mt-2">
            Painel financeiro executivo com faturamento, estoque, assessoria técnica, despesas e lucro.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 xl:items-center">
          <input
            value={dados.mesReferencia}
            onChange={(e) => atualizarCampo('mesReferencia', e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 outline-none focus:border-blue-500"
            placeholder="Mês/Ano"
          />

          <input
            value={dados.razaoArea}
            onChange={(e) => atualizarCampo('razaoArea', e.target.value)}
            className="w-32 bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 outline-none focus:border-blue-500"
            placeholder="% área"
          />

          <button
            onClick={() => inputArquivosRef.current?.click()}
            disabled={importando}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 transition rounded-2xl px-6 py-4 font-bold shadow-lg shadow-blue-500/20 whitespace-nowrap"
          >
            {importando ? 'Importando...' : 'Importar Planilhas'}
          </button>
        </div>
      </div>

      <input
        ref={inputArquivosRef}
        type="file"
        multiple
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={processarArquivos}
      />

      {dados.arquivosImportados?.length > 0 && (
        <section className="bg-slate-900/70 border border-blue-500/10 rounded-3xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Arquivos Importados</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {dados.arquivosImportados.map((arquivo, index) => (
              <div key={`${arquivo.nome}-${index}`} className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                <p className="font-bold truncate">{arquivo.tipo}</p>
                <p className="text-sm text-slate-400 truncate mt-1">{arquivo.nome}</p>
                <p className="text-xs text-blue-300 mt-2">{arquivo.registros} registro(s) lido(s)</p>
              </div>
            ))}
          </div>
        </section>
      )}

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
          subtitulo="Valores fixos mensais. Ficam bloqueados para evitar alteração acidental."
          campos={CAMPOS_FIXOS}
          grupo="fixos"
          dados={dados.fixos}
          onChange={atualizarGrupo}
          editavel={editandoFixos}
          acao={
            <button
              onClick={() => {
                setEditandoFixos(!editandoFixos)
                if (editandoFixos) toast.success('Valores fixos salvos.')
              }}
              className={`px-4 py-2 rounded-xl font-bold transition ${
                editandoFixos
                  ? 'bg-green-600 hover:bg-green-500'
                  : 'bg-yellow-600 hover:bg-yellow-500'
              }`}
            >
              {editandoFixos ? 'Salvar Fixos' : 'Alterar Valores'}
            </button>
          }
        />

        <PainelCampos
          titulo="Valores Manuais do Mês"
          subtitulo="Valores variáveis preenchidos manualmente."
          campos={CAMPOS_MANUAIS}
          grupo="manuais"
          dados={dados.manuais}
          onChange={atualizarGrupo}
          editavel
        />

        <PainelCampos
          titulo="Valores Importados"
          subtitulo="Preenchidos automaticamente pela importação das planilhas."
          campos={CAMPOS_IMPORTADOS}
          grupo="importados"
          dados={dados.importados}
          onChange={atualizarGrupo}
          editavel={false}
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <GraficoReceitasDespesas dados={dadosGraficos.receitasDespesas} />
        <GraficoConsumoComparativo dados={dadosGraficos.consumoComparativo} />
        <GraficoComposicaoDespesas dados={dadosGraficos.composicaoDespesas} />
      </section>

      <section className="bg-slate-900/70 border border-blue-500/10 rounded-3xl p-6 mb-8">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold">Resumo Consolidado - {dados.mesReferencia}</h2>

          <div className="flex gap-3">
            <button
              onClick={limparTabela}
              className="bg-red-600 hover:bg-red-500 transition rounded-xl px-5 py-3 font-bold"
            >
              Limpar Tabela
            </button>

            <button
              onClick={gerarRelatorio}
              className="bg-purple-600 hover:bg-purple-500 transition rounded-xl px-5 py-3 font-bold"
            >
              Gerar Relatório
            </button>
          </div>
        </div>

        <TabelaResumo dados={dados} resumo={resumo} />
      </section>

      <section className="bg-slate-900/70 border border-blue-500/10 rounded-3xl p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Exportações</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={exportarPlanilhaCompleta}
            className="w-full bg-slate-800 hover:bg-slate-700 transition rounded-xl p-4 font-bold"
          >
            Exportar Planilha Completa
          </button>

          <button
            onClick={() => gerarPDFRelatorio(montarRelatorio())}
            className="w-full bg-purple-600 hover:bg-purple-500 transition rounded-xl p-4 font-bold"
          >
            Gerar PDF Completo
          </button>
        </div>
      </section>

      <DetalhesImportados detalhes={dados.detalhesImportados} />

      <section className="bg-slate-900/70 border border-blue-500/10 rounded-3xl p-6 mt-8">
        <h2 className="text-xl font-bold mb-4">Histórico de Relatórios Gerados</h2>

        {dados.historico.length === 0 ? (
          <p className="text-slate-500">Nenhum relatório gerado ainda.</p>
        ) : (
          <div className="space-y-3">
            {dados.historico.map((relatorio) => (
              <div
                key={relatorio.id}
                className="flex items-center justify-between bg-slate-950/70 border border-slate-800 rounded-2xl p-4"
              >
                <div>
                  <p className="font-bold">{relatorio.mesReferencia}</p>
                  <p className="text-sm text-slate-500">{relatorio.data}</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Receita: {moeda(relatorio.receitaTotal)} | Despesa: {moeda(relatorio.despesaTotal)} | Lucro: {moeda(relatorio.lucroLiquido)}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => baixarRelatorio(relatorio)}
                    className="bg-blue-600 hover:bg-blue-500 transition rounded-xl px-4 py-2 font-bold"
                  >
                    Baixar PDF
                  </button>

                  <button
                    onClick={() => gerarExcelRelatorio(relatorio)}
                    className="bg-slate-700 hover:bg-slate-600 transition rounded-xl px-4 py-2 font-bold"
                  >
                    Baixar Excel
                  </button>

                  <button
                    onClick={() => removerRelatorio(relatorio.id)}
                    className="bg-red-600 hover:bg-red-500 transition rounded-xl px-4 py-2 font-bold"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

function montarDadosGraficos(dados, resumo) {
  const historicoAtual = Array.isArray(dados.historico) ? dados.historico : []
  const ultimoRelatorio = historicoAtual[0]

  const despesasFixas = Number(resumo.saidasFixasRateadas || 0)
  const despesasManuais = somaObjeto(dados.manuais)
  const estoque = Number(dados.importados?.estoqueMateriais || 0)
  const assessoria = Number(dados.importados?.assessoriaTecnica || 0)

  const consumoAtual = estoque + assessoria + despesasManuais
  const consumoAnterior = ultimoRelatorio
    ? Number(ultimoRelatorio.despesaTotal || 0)
    : 0

  return {
    receitasDespesas: [
      {
        nome: dados.mesReferencia || 'Mês atual',
        Receitas: Number(resumo.entradas || 0),
        Despesas: Number(resumo.saidas || 0),
        Lucro: Number(resumo.lucro || 0)
      }
    ],
    consumoComparativo: [
      {
        nome: 'Mês anterior',
        Consumo: consumoAnterior
      },
      {
        nome: 'Mês atual',
        Consumo: consumoAtual
      }
    ],
    composicaoDespesas: [
      { name: 'Fixas rateadas', value: despesasFixas },
      { name: 'Manuais', value: despesasManuais },
      { name: 'Estoque', value: estoque },
      { name: 'Assessoria', value: assessoria }
    ].filter((item) => Number(item.value || 0) > 0)
  }
}

function GraficoReceitasDespesas({ dados }) {
  return (
    <CardGrafico titulo="Receitas, Despesas e Lucro" subtitulo="Visão financeira consolidada do mês.">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados}>
          <XAxis dataKey="nome" stroke="#94a3b8" fontSize={12} />
          <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => formatarMoedaCurta(value)} />
          <Tooltip content={<TooltipFinanceiro />} />
          <Legend />
          <Bar dataKey="Receitas" fill="#22c55e" radius={[8, 8, 0, 0]} />
          <Bar dataKey="Despesas" fill="#ef4444" radius={[8, 8, 0, 0]} />
          <Bar dataKey="Lucro" fill="#3b82f6" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </CardGrafico>
  )
}

function GraficoConsumoComparativo({ dados }) {
  return (
    <CardGrafico titulo="Consumo x Mês Anterior" subtitulo="Comparativo com o último relatório gerado.">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dados}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
          <XAxis dataKey="nome" stroke="#94a3b8" fontSize={12} />
          <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => formatarMoedaCurta(value)} />
          <Tooltip content={<TooltipFinanceiro />} />
          <Line type="monotone" dataKey="Consumo" stroke="#f59e0b" strokeWidth={4} dot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </CardGrafico>
  )
}

function GraficoComposicaoDespesas({ dados }) {
  const CORES = ['#3b82f6', '#ef4444', '#f59e0b', '#22c55e', '#a855f7']

  return (
    <CardGrafico titulo="Composição das Despesas" subtitulo="Distribuição das saídas por origem.">
      {dados.length === 0 ? (
        <div className="h-full flex items-center justify-center text-slate-500 text-sm">
          Aguardando valores para montar o gráfico.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dados}
              dataKey="value"
              nameKey="name"
              innerRadius={45}
              outerRadius={85}
              paddingAngle={4}
            >
              {dados.map((_, index) => (
                <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
              ))}
            </Pie>
            <Tooltip content={<TooltipFinanceiro />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </CardGrafico>
  )
}

function CardGrafico({ titulo, subtitulo, children }) {
  return (
    <div className="bg-slate-900/70 border border-blue-500/10 rounded-3xl p-6 min-h-[360px]">
      <h2 className="text-xl font-bold">{titulo}</h2>
      <p className="text-sm text-slate-500 mt-1 mb-5">{subtitulo}</p>
      <div className="h-64">{children}</div>
    </div>
  )
}

function TooltipFinanceiro({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-[#020817] border border-blue-500/20 rounded-2xl p-3 shadow-xl">
      {label && <p className="font-bold text-white mb-2">{label}</p>}
      {payload.map((item) => (
        <p key={item.name} className="text-sm" style={{ color: item.color }}>
          {item.name}: {moeda(item.value)}
        </p>
      ))}
    </div>
  )
}

function calcularResumo(dados) {
  const fixosTotal = somaObjeto(dados.fixos)
  const manuaisTotal = somaObjeto(dados.manuais)

  const entradas =
    Number(dados.importados?.faturamentoParticular || 0) +
    Number(dados.importados?.faturamentoConvenio || 0)

  const saidasFixasRateadas = fixosTotal * (Number(dados.razaoArea || 0) / 100)

  const saidas =
    saidasFixasRateadas +
    manuaisTotal +
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
    fixosTotal,
    saidasFixasRateadas
  }
}

function lerArquivoExcel(arquivo) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result)
        const workbook = XLSX.read(data, { type: 'array', cellDates: true })
        resolve(workbook)
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(arquivo)
  })
}

function identificarTipoArquivo(nome, workbook) {
  const nomeNormalizado = normalizarTexto(nome)
  const sheets = workbook.SheetNames.map(normalizarTexto).join(' ')
  const combinado = `${nomeNormalizado} ${sheets}`

  if (combinado.includes('FATURAMENTO') || combinado.includes('PART') || combinado.includes('CONV') || combinado.includes('BRADE')) {
    return 'faturamento'
  }

  if (combinado.includes('BIOMOL E LIMPEZA') || combinado.includes('CENTRO CUSTO') || combinado.includes('ESTOQUE')) {
    return 'estoque'
  }

  if (combinado.includes('ACOMPANHAMENTO') || combinado.includes('QUANTIDADE DE PACIENTES') || combinado.includes('QUANTID DE EXAME')) {
    return 'assessoria'
  }

  return 'desconhecido'
}

function extrairFaturamento(workbook, mesReferencia) {
  const tokensMes = obterTokensMes(mesReferencia)
  const detalhes = []
  let particular = 0
  let convenio = 0

  let sheets = workbook.SheetNames.filter((sheet) => {
    const nome = normalizarTexto(sheet)
    const ehFaturamento = nome.includes('PART') || nome.includes('PARTICULAR') || nome.includes('CONV') || nome.includes('BRADE') || nome.includes('BRAD')
    const ehMes = tokensMes.some((token) => nome.includes(token))
    return ehFaturamento && ehMes
  })

  if (sheets.length === 0) {
    sheets = workbook.SheetNames.filter((sheet) => {
      const nome = normalizarTexto(sheet)
      return nome.includes('PART') || nome.includes('PARTICULAR') || nome.includes('CONV') || nome.includes('BRADE') || nome.includes('BRAD')
    })
  }

  sheets.forEach((sheetName) => {
    const aoa = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: null })
    const headerIndex = aoa.findIndex((row) => row.some((cell) => normalizarTexto(cell).includes('O.S.')))
    if (headerIndex < 0) return

    const headers = aoa[headerIndex].map((h) => normalizarTexto(h))
    const idx = montarIndiceHeaders(headers)
    const nomeSheet = normalizarTexto(sheetName)
    const tipo = nomeSheet.includes('PART') || nomeSheet.includes('PARTICULAR') ? 'Particular' : 'Convênio'

    aoa.slice(headerIndex + 1).forEach((row) => {
      const os = row[idx.os]
      if (!os) return

      const valor = tipo === 'Particular'
        ? numero(row[idx.liquido] ?? row[idx.valorBruto])
        : numero(row[idx.valorFaturado] ?? row[idx.valorPago] ?? row[idx.liquido])

      if (!valor) return

      if (tipo === 'Particular') particular += valor
      else convenio += valor

      detalhes.push({
        Tipo: tipo,
        Planilha: sheetName,
        Data: formatarDataExcel(row[idx.data]),
        OS: os,
        Fonte: row[idx.fonte] || '',
        Mnemônico: row[idx.mnemonico] || '',
        Procedimento: row[idx.procedimento] || '',
        Valor: valor,
        Desconto: numero(row[idx.desconto]),
        Imposto: numero(row[idx.imposto]),
        Glosado: numero(row[idx.glosado])
      })
    })
  })

  return {
    particular: arredondar(particular),
    convenio: arredondar(convenio),
    detalhes
  }
}

function extrairEstoque(workbook) {
  const detalhes = []
  let totalResumo = 0

  workbook.SheetNames.forEach((sheetName) => {
    const aoa = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: null })
    const headerIndex = aoa.findIndex((row) => normalizarTexto(row.join(' ')).includes('CENTRO CUSTO') && normalizarTexto(row.join(' ')).includes('TOTAL MOVIMENTO'))
    if (headerIndex < 0) return

    const headers = aoa[headerIndex].map((h) => normalizarTexto(h))
    const idx = montarIndiceEstoque(headers)

    aoa.slice(headerIndex + 1).forEach((row) => {
      const descricao = row[idx.descricao]
      const total = numero(row[idx.total])
      const linhaTexto = normalizarTexto(row.join(' '))

      if (linhaTexto.includes('RESUMO DAS MOVIMENTACOES')) return
      if (linhaTexto.includes('ESPECIFICACAO') && linhaTexto.includes('VALOR TOTAL')) return

      if (linhaTexto.startsWith('S ') || row[0] === 'S') {
        const valorResumo = numero(row[3]) || numero(row[8])
        if (valorResumo) totalResumo += valorResumo
        return
      }

      if (!descricao || !total) return

      detalhes.push({
        Planilha: sheetName,
        CentroCusto: row[idx.centroCusto] || '',
        Processo: row[idx.processo] || '',
        Codigo: row[idx.codigo] || '',
        Descricao: descricao,
        Data: formatarDataExcel(row[idx.data]),
        Tipo: row[idx.tipo] || '',
        Requisitante: row[idx.requisitante] || '',
        Quantidade: numero(row[idx.quantidade]),
        Total: total
      })
    })
  })

  const totalDetalhes = detalhes.reduce((acc, item) => acc + Number(item.Total || 0), 0)

  return {
    total: arredondar(totalResumo || totalDetalhes),
    detalhes
  }
}

function extrairAssessoria(workbook, mesReferencia) {
  const detalhes = []
  const tokensMes = obterTokensMes(mesReferencia)

  workbook.SheetNames.forEach((sheetName) => {
    const aoa = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: null })
    const nomeSheet = normalizarTexto(sheetName)

    if (nomeSheet.includes('QUANTIDADE DE PACIENTES')) {
      const linhaMeses = aoa.find((row) => row.some((cell) => tokensMes.some((token) => normalizarTexto(cell).includes(token))))
      const linhaValoresIndex = aoa.findIndex((row) => row === linhaMeses) + 1
      const linhaValores = aoa[linhaValoresIndex] || []

      if (linhaMeses) {
        linhaMeses.forEach((mes, index) => {
          const mesNorm = normalizarTexto(mes)
          if (tokensMes.some((token) => mesNorm.includes(token))) {
            detalhes.push({
              Origem: 'Pacientes por mês',
              Planilha: sheetName,
              Indicador: `Quantidade de pacientes - ${mes}`,
              Valor: numero(linhaValores[index])
            })
          }
        })
      }
    }

    if (nomeSheet.includes('QUANTID DE EXAME') || nomeSheet.includes('EXAME')) {
      const headerIndex = aoa.findIndex((row) => normalizarTexto(row.join(' ')).includes('EXAMES BIOLOGIA MOLECULAR'))
      if (headerIndex >= 0) {
        aoa.slice(headerIndex + 1).forEach((row) => {
          const exame = row[1]
          if (!exame) return

          detalhes.push({
            Origem: 'Quantidade de exames',
            Planilha: sheetName,
            Laboratorio: row[0] || '',
            Exame: exame,
            Shift: numero(row[2]),
            Salus: numero(row[3]),
            Total: numero(row[4])
          })
        })
      }
    }
  })

  return {
    valorFinanceiro: 0,
    detalhes
  }
}

function montarIndiceHeaders(headers) {
  return {
    data: encontrarIndice(headers, ['DATA']),
    os: encontrarIndice(headers, ['O.S', 'OS']),
    fonte: encontrarIndice(headers, ['FONTE']),
    mnemonico: encontrarIndice(headers, ['MNEMONICO', 'MNEMÔNICO']),
    procedimento: encontrarIndice(headers, ['PROCEDIMENTO']),
    valorBruto: encontrarIndice(headers, ['VL BLC BRUTO', 'BRUTO']),
    desconto: encontrarIndice(headers, ['DESCONTO']),
    imposto: encontrarIndice(headers, ['IMPOSTO']),
    liquido: encontrarIndice(headers, ['LIQUIDO', 'LÍQUIDO']),
    valorFaturado: encontrarIndice(headers, ['VL FAT', 'VALOR FAT']),
    valorPago: encontrarIndice(headers, ['VL PAGO', 'PAGO']),
    glosado: encontrarIndice(headers, ['GLOSADO', 'GLOSA'])
  }
}

function montarIndiceEstoque(headers) {
  return {
    centroCusto: encontrarIndice(headers, ['CENTRO CUSTO']),
    processo: encontrarIndice(headers, ['PROCESSO']),
    codigo: encontrarIndice(headers, ['CODIGO ITEM', 'CÓDIGO ITEM']),
    descricao: encontrarIndice(headers, ['DESCRICAO ITEM', 'DESCRIÇÃO ITEM']),
    data: encontrarIndice(headers, ['DATA MOVIMENTO']),
    tipo: encontrarIndice(headers, ['TIPO']),
    requisitante: encontrarIndice(headers, ['REQUISITANTE']),
    quantidade: encontrarIndice(headers, ['QTDE', 'QUANTIDADE']),
    total: encontrarIndice(headers, ['TOTAL MOVIMENTO'])
  }
}

function encontrarIndice(headers, termos) {
  return headers.findIndex((header) => termos.some((termo) => header.includes(normalizarTexto(termo))))
}

function gerarExcelRelatorio(relatorio) {
  const wb = XLSX.utils.book_new()

  const resumo = [
    ['OX360 FINANCEIRO'],
    ['Relatório Executivo CDL'],
    [],
    ['Mês Referência', relatorio.mesReferencia],
    ['Gerado em', relatorio.data],
    [],
    ['Indicador', 'Valor'],
    ['Receita Total', relatorio.receitaTotal],
    ['Despesa Total', relatorio.despesaTotal],
    ['Lucro Líquido', relatorio.lucroLiquido],
    ['Margem Líquida', `${Number(relatorio.margemLiquida || 0).toFixed(2)}%`],
    ['Saldo Acumulado', relatorio.saldoAcumulado]
  ]

  const wsResumo = XLSX.utils.aoa_to_sheet(resumo)
  wsResumo['!cols'] = [{ wch: 30 }, { wch: 24 }]
  XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo Executivo')

  adicionarAba(wb, 'Valores Fixos', CAMPOS_FIXOS, relatorio.dados.fixos)
  adicionarAba(wb, 'Valores Manuais', CAMPOS_MANUAIS, relatorio.dados.manuais)
  adicionarAba(wb, 'Valores Importados', CAMPOS_IMPORTADOS, relatorio.dados.importados)

  const consolidado = montarLinhasConsolidadas(relatorio.dados, relatorio.resumo)
  const wsConsolidado = XLSX.utils.aoa_to_sheet([
    ['Descrição', 'Valor Total', 'Razão Área', 'Valor da Área', 'Saída', 'Entrada'],
    ...consolidado.map((linha) => linha.slice(0, 6))
  ])
  wsConsolidado['!cols'] = [{ wch: 38 }, { wch: 18 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(wb, wsConsolidado, 'Consolidado')

  adicionarAbaDetalhes(wb, 'Detalhe Faturamento', relatorio.dados.detalhesImportados?.faturamento || [])
  adicionarAbaDetalhes(wb, 'Detalhe Estoque', relatorio.dados.detalhesImportados?.estoque || [])
  adicionarAbaDetalhes(wb, 'Detalhe Assessoria', relatorio.dados.detalhesImportados?.assessoria || [])
  adicionarAbaDetalhes(wb, 'Arquivos Importados', relatorio.dados.arquivosImportados || [])

  XLSX.writeFile(wb, `OX360_Financeiro_${nomeArquivo(relatorio.mesReferencia)}.xlsx`)
}

function adicionarAba(wb, nomeAba, campos, valores = {}) {
  const linhas = [['Descrição', 'Valor'], ...campos.map((campo) => [campo.nome, valores?.[campo.key] || 0])]
  const ws = XLSX.utils.aoa_to_sheet(linhas)
  ws['!cols'] = [{ wch: 38 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(wb, ws, nomeAba)
}

function adicionarAbaDetalhes(wb, nomeAba, linhas = []) {
  const dados = linhas.length ? linhas : [{ Aviso: 'Nenhum dado importado para este grupo.' }]
  const ws = XLSX.utils.json_to_sheet(dados)
  ws['!cols'] = Object.keys(dados[0] || {}).map(() => ({ wch: 24 }))
  XLSX.utils.book_append_sheet(wb, ws, nomeAba)
}

async function gerarPDFRelatorio(relatorio) {
  try {
    const doc = new jsPDF('p', 'mm', 'a4')
    const dados = relatorio.dados
    const resumo = relatorio.resumo

    const painelLogo = await carregarImagem(LOGO_PAINEL_BI_URL)
    const cdlLogo = await carregarImagem(LOGO_CDL_URL)

    configurarPaginaPDF(doc)
    desenharCabecalhoPDF(doc, painelLogo, cdlLogo)
    desenharTituloPDF(doc, relatorio)
    desenharCardsPDF(doc, relatorio)
    let y = desenharTabelaPDF(doc, dados, resumo)
    y = desenharDetalhesPDF(doc, 'Detalhamento do Faturamento', dados.detalhesImportados?.faturamento || [], ['Tipo', 'Data', 'OS', 'Fonte', 'Mnemônico', 'Valor'], y + 8)
    y = desenharDetalhesPDF(doc, 'Detalhamento de Materiais / Estoque', dados.detalhesImportados?.estoque || [], ['CentroCusto', 'Processo', 'Descricao', 'Quantidade', 'Total'], y + 8)
    desenharDetalhesPDF(doc, 'Detalhamento da Assessoria Técnica', dados.detalhesImportados?.assessoria || [], ['Origem', 'Indicador', 'Exame', 'Shift', 'Salus', 'Total'], y + 8)
    desenharRodapePDF(doc, relatorio)

    doc.save(`OX360_Financeiro_${nomeArquivo(relatorio.mesReferencia)}.pdf`)
  } catch (error) {
    console.error(error)
    toast.error('Erro ao gerar PDF. Verifique o console do navegador.')
  }
}

function configurarPaginaPDF(doc) {
  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, 210, 297, 'F')
}

function desenharCabecalhoPDF(doc, painelLogo, cdlLogo) {
  if (painelLogo) {
    doc.addImage(painelLogo, 'PNG', 14, 10, 58, 24)
  } else {
    doc.setFillColor(37, 99, 235)
    doc.roundedRect(14, 10, 16, 16, 4, 4, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(7)
    doc.text('BI', 19, 20)
    doc.setTextColor(15, 23, 42)
    doc.setFontSize(13)
    doc.text('Painel BI', 34, 18)
    doc.setTextColor(71, 85, 105)
    doc.setFontSize(8)
    doc.text('Gestão de Indicadores', 34, 25)
  }

  if (cdlLogo) {
    doc.addImage(cdlLogo, 'PNG', 158, 9, 38, 24)
  } else {
    doc.setTextColor(37, 99, 235)
    doc.setFontSize(20)
    doc.text('CDL', 170, 18)
    doc.setTextColor(71, 85, 105)
    doc.setFontSize(7)
    doc.text('Laboratório Santos e Vidal', 160, 25)
  }

  doc.setDrawColor(37, 99, 235)
  doc.setLineWidth(0.6)
  doc.line(14, 38, 196, 38)
}

function desenharTituloPDF(doc, relatorio) {
  doc.setTextColor(37, 99, 235)
  doc.setFontSize(9)
  doc.text('DIRETORIA', 14, 51)

  doc.setTextColor(15, 23, 42)
  doc.setFontSize(24)
  doc.text('OX360 FINANCEIRO', 14, 63)

  doc.setTextColor(71, 85, 105)
  doc.setFontSize(9)
  doc.text(`Mês referência: ${relatorio.mesReferencia}`, 14, 74)
}

function desenharCardsPDF(doc, relatorio) {
  const cards = [
    { titulo: 'Receita Total', valor: moeda(relatorio.receitaTotal), destaque: true },
    { titulo: 'Despesa Total', valor: moeda(relatorio.despesaTotal), destaque: false },
    { titulo: 'Lucro Líquido', valor: moeda(relatorio.lucroLiquido), destaque: true },
    { titulo: 'Margem', valor: `${Number(relatorio.margemLiquida || 0).toFixed(2)}%`, destaque: false },
    { titulo: 'Saldo', valor: moeda(relatorio.saldoAcumulado), destaque: false }
  ]

  let x = 14
  const y = 84

  cards.forEach((card) => {
    doc.setFillColor(card.destaque ? 37 : 248, card.destaque ? 99 : 250, card.destaque ? 235 : 252)
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(x, y, 34, 28, 4, 4, 'FD')
    doc.setTextColor(card.destaque ? 255 : 71, card.destaque ? 255 : 85, card.destaque ? 255 : 105)
    doc.setFontSize(7)
    doc.text(card.titulo, x + 4, y + 9)
    doc.setTextColor(card.destaque ? 255 : 15, card.destaque ? 255 : 23, card.destaque ? 255 : 42)
    doc.setFontSize(10)
    doc.text(card.valor, x + 4, y + 19)
    x += 37
  })
}

function desenharTabelaPDF(doc, dados, resumo) {
  doc.setTextColor(15, 23, 42)
  doc.setFontSize(13)
  doc.text('Resumo consolidado', 14, 124)

  const colunas = ['Descrição', 'Valor Total', 'Razão', 'Valor Área', 'Saída', 'Entrada']
  const linhas = montarLinhasConsolidadas(dados, resumo)

  const x = 14
  let y = 130
  const colWidths = [64, 25, 22, 25, 24, 24]
  const rowHeight = 6

  desenharHeaderTabela(doc, x, y, colunas, colWidths, rowHeight)
  y += rowHeight

  linhas.forEach((linha, index) => {
    if (y > 275) {
      desenharRodapeSimples(doc)
      doc.addPage()
      configurarPaginaPDF(doc)
      y = 18
      desenharHeaderTabela(doc, x, y, colunas, colWidths, rowHeight)
      y += rowHeight
    }

    const tipo = linha[6]

    if (tipo === 'secaoAzul' || tipo === 'secaoVermelha' || tipo === 'secaoVerde') {
      const cor = tipo === 'secaoAzul' ? [239, 246, 255] : tipo === 'secaoVermelha' ? [254, 242, 242] : [240, 253, 244]
      const textoCor = tipo === 'secaoAzul' ? [37, 99, 235] : tipo === 'secaoVermelha' ? [220, 38, 38] : [22, 163, 74]
      doc.setFillColor(...cor)
      doc.setTextColor(...textoCor)
      doc.setFontSize(7)
      doc.rect(x, y, 184, rowHeight, 'F')
      doc.text(linha[0], x + 2, y + 4)
      y += rowHeight
      return
    }

    if (tipo === 'total') {
      doc.setFillColor(30, 64, 175)
      doc.setTextColor(255, 255, 255)
    } else if (tipo === 'lucro') {
      doc.setFillColor(220, 252, 231)
      doc.setTextColor(22, 101, 52)
    } else if (tipo === 'saldo') {
      doc.setFillColor(239, 246, 255)
      doc.setTextColor(37, 99, 235)
    } else if (index % 2 === 0) {
      doc.setFillColor(255, 255, 255)
      doc.setTextColor(15, 23, 42)
    } else {
      doc.setFillColor(248, 250, 252)
      doc.setTextColor(15, 23, 42)
    }

    doc.rect(x, y, 184, rowHeight, 'F')
    doc.setDrawColor(226, 232, 240)
    doc.rect(x, y, 184, rowHeight)
    doc.setFontSize(6.5)

    const textoLinha = [linha[0], valorOuTraco(linha[1]), linha[2] || '-', valorOuTraco(linha[3]), valorOuTraco(linha[4]), valorOuTraco(linha[5])]
    let colX = x
    textoLinha.forEach((texto, colIndex) => {
      doc.text(cortarTexto(String(texto), colIndex === 0 ? 32 : 14), colX + 2, y + 4, { maxWidth: colWidths[colIndex] - 4 })
      colX += colWidths[colIndex]
    })

    y += rowHeight
  })

  return y
}

function desenharHeaderTabela(doc, x, y, colunas, colWidths, rowHeight) {
  doc.setFillColor(37, 99, 235)
  doc.rect(x, y, 184, rowHeight, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(7)
  let colX = x
  colunas.forEach((col, index) => {
    doc.text(col, colX + 2, y + 4)
    colX += colWidths[index]
  })
}

function desenharDetalhesPDF(doc, titulo, linhas, colunas, yInicial) {
  if (!linhas.length) return yInicial

  let y = yInicial
  const x = 14
  const rowHeight = 6
  const tableWidth = 184
  const colWidth = tableWidth / colunas.length

  if (y > 245) {
    desenharRodapeSimples(doc)
    doc.addPage()
    configurarPaginaPDF(doc)
    y = 18
  }

  doc.setTextColor(15, 23, 42)
  doc.setFontSize(12)
  doc.text(titulo, x, y)
  y += 6

  doc.setFillColor(37, 99, 235)
  doc.rect(x, y, tableWidth, rowHeight, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(6)
  colunas.forEach((coluna, index) => doc.text(cortarTexto(coluna, 18), x + 2 + index * colWidth, y + 4))
  y += rowHeight

  linhas.forEach((linha, index) => {
    if (y > 275) {
      desenharRodapeSimples(doc)
      doc.addPage()
      configurarPaginaPDF(doc)
      y = 18
      doc.setFillColor(37, 99, 235)
      doc.rect(x, y, tableWidth, rowHeight, 'F')
      doc.setTextColor(255, 255, 255)
      colunas.forEach((coluna, colIndex) => doc.text(cortarTexto(coluna, 18), x + 2 + colIndex * colWidth, y + 4))
      y += rowHeight
    }

    doc.setFillColor(index % 2 === 0 ? 255 : 248, index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 252)
    doc.setTextColor(15, 23, 42)
    doc.rect(x, y, tableWidth, rowHeight, 'F')
    doc.setDrawColor(226, 232, 240)
    doc.rect(x, y, tableWidth, rowHeight)
    doc.setFontSize(5.8)

    colunas.forEach((coluna, colIndex) => {
      const valor = linha[coluna]
      const texto = typeof valor === 'number' && coluna.toLowerCase().includes('valor') || coluna.toLowerCase().includes('total')
        ? moeda(valor)
        : String(valor ?? '-')
      doc.text(cortarTexto(texto, 22), x + 2 + colIndex * colWidth, y + 4, { maxWidth: colWidth - 3 })
    })

    y += rowHeight
  })

  return y
}

function desenharRodapePDF(doc, relatorio) {
  const totalPaginas = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i)
    doc.setDrawColor(226, 232, 240)
    doc.line(14, 286, 196, 286)
    doc.setTextColor(100, 116, 139)
    doc.setFontSize(7)
    doc.text(`Gerado em: ${relatorio.data}`, 14, 292)
    doc.text(`Página ${i} de ${totalPaginas}`, 90, 292)
    doc.text('Painel BI • Gestão de Indicadores', 150, 292)
  }
}

function desenharRodapeSimples(doc) {
  doc.setDrawColor(226, 232, 240)
  doc.line(14, 286, 196, 286)
  doc.setTextColor(100, 116, 139)
  doc.setFontSize(7)
  doc.text('Painel BI • Gestão de Indicadores', 150, 292)
}

function montarLinhasConsolidadas(dados, resumo) {
  const linhasFixos = CAMPOS_FIXOS.map((campo) => {
    const valor = Number(dados.fixos?.[campo.key] || 0)
    const valorArea = valor * (Number(dados.razaoArea || 0) / 100)
    return [campo.nome, valor, `${dados.razaoArea}%`, valorArea, valorArea, 0, 'normal']
  })

  const totalFixos = linhasFixos.reduce((acc, linha) => acc + Number(linha[4] || 0), 0)

  const linhasManuais = CAMPOS_MANUAIS.map((campo) => {
    const valor = Number(dados.manuais?.[campo.key] || 0)
    const entrada = campo.key === 'saldoAnterior'
    return [campo.nome, valor, 'Não se aplica', 0, entrada ? 0 : valor, entrada ? valor : 0, 'normal']
  })

  const totalManuaisSaida = linhasManuais.reduce((acc, linha) => acc + Number(linha[4] || 0), 0)
  const totalManuaisEntrada = linhasManuais.reduce((acc, linha) => acc + Number(linha[5] || 0), 0)

  const linhasImportados = CAMPOS_IMPORTADOS.map((campo) => {
    const valor = Number(dados.importados?.[campo.key] || 0)
    const entrada = campo.key.includes('faturamento')
    return [campo.nome, valor, 'Importado', 0, entrada ? 0 : valor, entrada ? valor : 0, 'normal']
  })

  const totalImportadosValor = linhasImportados.reduce((acc, linha) => acc + Number(linha[1] || 0), 0)
  const totalImportadosSaida = linhasImportados.reduce((acc, linha) => acc + Number(linha[4] || 0), 0)
  const totalImportadosEntrada = linhasImportados.reduce((acc, linha) => acc + Number(linha[5] || 0), 0)

  return [
    ['DESPESAS FIXAS (Rateadas)', '', '', '', '', '', 'secaoAzul'],
    ...linhasFixos,
    ['Total Despesas Fixas', somaObjeto(dados.fixos), `${dados.razaoArea}%`, resumo.saidasFixasRateadas, totalFixos, 0, 'normal'],
    ['DESPESAS MANUAIS', '', '', '', '', '', 'secaoVermelha'],
    ...linhasManuais,
    ['Total Despesas Manuais', 0, '-', 0, totalManuaisSaida, totalManuaisEntrada, 'normal'],
    ['VALORES IMPORTADOS', '', '', '', '', '', 'secaoVerde'],
    ...linhasImportados,
    ['Total Valores Importados', totalImportadosValor, '-', 0, totalImportadosSaida, totalImportadosEntrada, 'normal'],
    ['TOTAL GERAL', totalImportadosValor + somaObjeto(dados.fixos), `${dados.razaoArea}%`, resumo.saidasFixasRateadas, resumo.saidas, resumo.entradas, 'total'],
    ['LUCRO LÍQUIDO DO MÊS', 0, '-', 0, 0, resumo.lucro, 'lucro'],
    ['SALDO ACUMULADO', 0, '-', 0, 0, resumo.saldoAcumulado, 'saldo']
  ]
}

function TabelaResumo({ dados, resumo }) {
  return (
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
          {CAMPOS_FIXOS.map((campo) => <LinhaResumo key={campo.key} nome={campo.nome} valor={dados.fixos?.[campo.key] || 0} razao={dados.razaoArea} aplicarRazao />)}
          {CAMPOS_MANUAIS.map((campo) => <LinhaResumo key={campo.key} nome={campo.nome} valor={dados.manuais?.[campo.key] || 0} razao={campo.key === 'saldoAnterior' ? null : 'Não se aplica'} entrada={campo.key === 'saldoAnterior'} />)}
          {CAMPOS_IMPORTADOS.map((campo) => <LinhaResumo key={campo.key} nome={campo.nome} valor={dados.importados?.[campo.key] || 0} entrada={campo.key.includes('faturamento')} />)}
          <tr className="bg-slate-950/80 font-bold">
            <td className="p-3">TOTAL</td>
            <td className="p-3 text-right">-</td>
            <td className="p-3 text-right">{dados.razaoArea}%</td>
            <td className="p-3 text-right">{moeda(resumo.saidasFixasRateadas)}</td>
            <td className="p-3 text-right text-red-300">{moeda(resumo.saidas)}</td>
            <td className="p-3 text-right text-green-300">{moeda(resumo.entradas)}</td>
          </tr>
          <tr className="bg-green-900/30 font-bold">
            <td className="p-3">RESULTADO DO MÊS</td>
            <td colSpan="4" className="p-3 text-right">Lucro líquido</td>
            <td className="p-3 text-right text-green-300">{moeda(resumo.lucro)}</td>
          </tr>
          <tr className="bg-blue-900/30 font-bold">
            <td className="p-3">SALDO ACUMULADO</td>
            <td colSpan="4" className="p-3 text-right">Resultado + saldo anterior</td>
            <td className="p-3 text-right text-blue-300">{moeda(resumo.saldoAcumulado)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function DetalhesImportados({ detalhes }) {
  const total =
    (detalhes?.faturamento?.length || 0) +
    (detalhes?.estoque?.length || 0) +
    (detalhes?.assessoria?.length || 0)

  if (!total) return null

  return (
    <section className="bg-slate-900/70 border border-blue-500/10 rounded-3xl p-6">
      <h2 className="text-xl font-bold mb-4">Detalhamentos Importados</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ResumoDetalhe titulo="Faturamento" total={detalhes?.faturamento?.length || 0} />
        <ResumoDetalhe titulo="Estoque / Materiais" total={detalhes?.estoque?.length || 0} />
        <ResumoDetalhe titulo="Assessoria Técnica" total={detalhes?.assessoria?.length || 0} />
      </div>
    </section>
  )
}

function ResumoDetalhe({ titulo, total }) {
  return (
    <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
      <p className="text-slate-400 text-sm">{titulo}</p>
      <p className="text-2xl font-bold mt-2">{total}</p>
      <p className="text-xs text-blue-300 mt-1">registro(s) disponíveis nos relatórios</p>
    </div>
  )
}

function PainelCampos({ titulo, subtitulo, campos, grupo, dados, onChange, editavel, acao }) {
  return (
    <div className="bg-slate-900/70 border border-blue-500/10 rounded-3xl p-6">
      <div className="flex items-start justify-between gap-3 mb-1">
        <h2 className="text-xl font-bold">{titulo}</h2>
        {acao}
      </div>
      <p className="text-slate-500 text-sm mt-1 mb-5">{subtitulo}</p>
      <div className="space-y-4">
        {campos.map((campo) => (
          <div key={campo.key}>
            <label className="text-sm text-slate-400">{campo.nome}</label>
            <div className="relative mt-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
              <input
                type="number"
                value={dados?.[campo.key] || ''}
                onChange={(e) => onChange(grupo, campo.key, e.target.value)}
                disabled={!editavel}
                className={`w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-blue-500 ${!editavel ? 'opacity-70 cursor-not-allowed text-slate-400' : ''}`}
                placeholder="0,00"
              />
            </div>
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
      <td className="p-3 text-right">{razao ? `${razao}%` : '-'}</td>
      <td className="p-3 text-right">{aplicarRazao ? moeda(valorArea) : '-'}</td>
      <td className="p-3 text-right text-red-300">{!entrada ? moeda(valorArea) : '-'}</td>
      <td className="p-3 text-right text-green-300">{entrada ? moeda(valor) : '-'}</td>
    </tr>
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

function obterTokensMes(mesReferencia = '') {
  const mes = normalizarTexto(String(mesReferencia).split('/')[0])
  const mapa = {
    JANEIRO: ['JAN', 'JANEIRO', '01'],
    FEVEREIRO: ['FEV', 'FEVEREIRO', '02'],
    MARCO: ['MAR', 'MARCO', 'MARÇO', '03'],
    ABRIL: ['ABR', 'ABRIL', '04'],
    MAIO: ['MAI', 'MAIO', '05'],
    JUNHO: ['JUN', 'JUNHO', '06'],
    JULHO: ['JUL', 'JULHO', '07'],
    AGOSTO: ['AGO', 'AGOSTO', '08'],
    SETEMBRO: ['SET', 'SETEMBRO', '09'],
    OUTUBRO: ['OUT', 'OUTUBRO', '10'],
    NOVEMBRO: ['NOV', 'NOVEMBRO', '11'],
    DEZEMBRO: ['DEZ', 'DEZEMBRO', '12']
  }

  return mapa[mes] || [mes]
}

function somaObjeto(obj = {}) {
  return Object.values(obj).reduce((acc, valor) => acc + Number(valor || 0), 0)
}

function converterNumero(valor) {
  if (typeof valor === 'number') return valor
  return Number(String(valor).replace(',', '.')) || 0
}

function numero(valor) {
  if (valor === null || valor === undefined || valor === '') return 0
  if (typeof valor === 'number') return valor
  const limpo = String(valor).replace(/[R$\s.]/g, '').replace(',', '.')
  const convertido = Number(limpo)
  return Number.isFinite(convertido) ? convertido : 0
}

function arredondar(valor) {
  return Math.round(Number(valor || 0) * 100) / 100
}

function formatarMoedaCurta(valor) {
  const numero = Number(valor || 0)
  if (Math.abs(numero) >= 1000000) return `R$ ${(numero / 1000000).toFixed(1)}M`
  if (Math.abs(numero) >= 1000) return `R$ ${(numero / 1000).toFixed(0)}k`
  return `R$ ${numero.toFixed(0)}`
}

function moeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function valorOuTraco(valor) {
  const n = Number(valor || 0)
  return n === 0 ? '-' : moeda(n)
}

function cortarTexto(texto, limite) {
  if (texto.length <= limite) return texto
  return `${texto.substring(0, limite - 3)}...`
}

function nomeArquivo(nome) {
  return String(nome || 'Relatorio').replaceAll('/', '_').replaceAll(' ', '_')
}

function normalizarTexto(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim()
}

function formatarDataExcel(valor) {
  if (!valor) return ''
  if (valor instanceof Date) return valor.toLocaleDateString('pt-BR')
  if (typeof valor === 'number') {
    const date = XLSX.SSF.parse_date_code(valor)
    if (!date) return String(valor)
    return `${String(date.d).padStart(2, '0')}/${String(date.m).padStart(2, '0')}/${date.y}`
  }
  return String(valor)
}

function carregarImagem(url) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}

export default OX360Financeiro
