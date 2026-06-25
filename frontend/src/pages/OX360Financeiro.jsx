import { useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'

const STORAGE_KEY = 'ox360_financeiro_valores'
const RAZAO_AREA_PADRAO = 21.92

const LOGO_PAINEL_BI_URL = '/logo-painel.png'
const LOGO_CDL_URL = '/logo-cdl.png'

const CORES_GRAFICO = {
  azul: '#2563eb',
  verde: '#22c55e',
  vermelho: '#ef4444',
  roxo: '#a855f7',
  amarelo: '#f59e0b',
  ciano: '#06b6d4'
}

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
  { key: 'luz', nome: 'Luz' },
  { key: 'marketing', nome: 'MKT / Tráfego SXT' },
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
  { key: 'materialLimpeza', nome: 'Material Limpeza' },
  { key: 'almoxarifado', nome: 'Almoxarifado' },
  { key: 'assessoriaTecnica', nome: 'Assessoria Técnica' }
]

const LIMPEZA_KEYWORDS = [
  'LIMPEZA',
  'ÁLCOOL',
  'ALCOOL',
  'PAPEL',
  'SACO',
  'MÁSCARA',
  'MASCARA',
  'LUVA',
  'DETERGENTE',
  'DESINFETANTE',
  'SABONETE',
  'SABAO',
  'SABÃO',
  'VASSOURA',
  'ESPONJA',
  'TOALHA',
  'BOM AR',
  'SANITARIA',
  'SANITÁRIA'
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
    historico: [],
    arquivosImportados: {},
    detalhesImportados: {
      faturamento: [],
      estoque: [],
      assessoria: []
    }
  }
}

function OX360Financeiro() {
  const inputRef = useRef(null)
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
        historico: dadosSalvos.historico || [],
        arquivosImportados: dadosSalvos.arquivosImportados || {},
        detalhesImportados: {
          ...valorInicial().detalhesImportados,
          ...(dadosSalvos.detalhesImportados || {})
        }
      }
    } catch {
      return valorInicial()
    }
  })

  const resumo = useMemo(() => calcularResumo(dados), [dados])
  const dadosGraficoFinanceiro = useMemo(() => criarDadosGraficoFinanceiro(dados, resumo), [dados, resumo])
  const dadosGraficoHistorico = useMemo(() => criarDadosGraficoHistorico(dados, resumo), [dados, resumo])
  const dadosGraficoComposicao = useMemo(() => criarDadosGraficoComposicao(dados, resumo), [dados, resumo])

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
      arquivosImportados: {},
      detalhesImportados: valorInicial().detalhesImportados
    })
    toast.success('Tabela limpa. Os valores fixos e o histórico foram mantidos.')
  }

  async function importarPlanilhas(event) {
    const arquivos = Array.from(event.target.files || [])
    event.target.value = ''

    if (arquivos.length === 0) return

    setImportando(true)

    try {
      const resultado = await processarArquivosImportados(arquivos, dados.mesReferencia)

      const novosDados = {
        ...dados,
        importados: somarImportados(dados.importados, resultado.importados),
        detalhesImportados: mesclarDetalhesImportados(dados.detalhesImportados, resultado.detalhesImportados),
        arquivosImportados: mesclarArquivosImportados(dados.arquivosImportados, resultado.arquivosImportados)
      }

      salvar(novosDados)
      toast.success('Planilhas importadas e valores atualizados com sucesso.')
    } catch (error) {
      console.error(error)
      toast.error('Erro ao importar as planilhas. Verifique os arquivos enviados.')
    } finally {
      setImportando(false)
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
      resumo,
      graficos: {
        financeiro: dadosGraficoFinanceiro,
        historico: dadosGraficoHistorico,
        composicao: dadosGraficoComposicao
      }
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
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".xlsx,.xls,.csv"
        onChange={importarPlanilhas}
        className="hidden"
      />

      <div className="mb-8 flex items-start justify-between gap-5">
        <div>
          <p className="text-blue-400 font-semibold">Diretoria</p>
          <h1 className="text-4xl font-bold mt-2">OX360 Financeiro</h1>
          <p className="text-slate-400 mt-2">
            Painel financeiro executivo com faturamento, estoque, assessoria técnica, despesas e lucro.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={importando}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 transition rounded-2xl px-6 py-4 font-bold shadow-lg shadow-blue-500/20"
          >
            {importando ? 'Importando...' : 'Importar Planilhas OX360'}
          </button>

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
        </div>
      </div>

      {Object.keys(dados.arquivosImportados || {}).length > 0 && (
        <section className="bg-slate-900/70 border border-blue-500/10 rounded-3xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Arquivos Importados</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(dados.arquivosImportados).map(([tipo, info]) => (
              <div key={tipo} className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                <p className="font-bold capitalize">{tipo}</p>
                <p className="text-sm text-blue-200 mt-2">{info.nome}</p>
                <p className="text-xs text-blue-400 mt-3">{info.registros} registro(s) lido(s)</p>
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
        <GraficoFinanceiro dados={dadosGraficoFinanceiro} />
        <GraficoHistorico dados={dadosGraficoHistorico} />
        <GraficoComposicao dados={dadosGraficoComposicao} />
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

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-900/70 border border-blue-500/10 rounded-3xl p-6">
          <h2 className="text-xl font-bold mb-4">Exportações</h2>

          <div className="space-y-3">
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
        </div>

        <div className="bg-slate-900/70 border border-blue-500/10 rounded-3xl p-6">
          <h2 className="text-xl font-bold mb-4">Detalhes Importados</h2>
          <p className="text-slate-400 text-sm">
            Os registros detalhados das planilhas são armazenados no relatório PDF e na planilha Excel completa.
          </p>
        </div>
      </section>

      <section className="bg-slate-900/70 border border-blue-500/10 rounded-3xl p-6">
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

function somarImportados(atual = {}, novo = {}) {
  const chaves = new Set([...Object.keys(atual || {}), ...Object.keys(novo || {})])
  const resultado = {}

  chaves.forEach((key) => {
    resultado[key] = Number(atual?.[key] || 0) + Number(novo?.[key] || 0)
  })

  return resultado
}

function mesclarDetalhesImportados(atual = {}, novo = {}) {
  return {
    faturamento: [...(atual.faturamento || []), ...(novo.faturamento || [])],
    estoque: [...(atual.estoque || []), ...(novo.estoque || [])],
    assessoria: [...(atual.assessoria || []), ...(novo.assessoria || [])]
  }
}

function mesclarArquivosImportados(atual = {}, novo = {}) {
  const resultado = { ...(atual || {}) }

  Object.entries(novo || {}).forEach(([tipo, info]) => {
    if (!resultado[tipo]) {
      resultado[tipo] = info
      return
    }

    resultado[tipo] = {
      nome: `${resultado[tipo].nome}; ${info.nome}`,
      registros: Number(resultado[tipo].registros || 0) + Number(info.registros || 0)
    }
  })

  return resultado
}

function calcularResumo(dados) {
  const fixosTotal = somaObjeto(dados.fixos)
  const manuaisTotal = somaCampos(dados.manuais, CAMPOS_MANUAIS.filter((c) => c.key !== 'saldoAnterior'))

  const entradas =
    Number(dados.importados?.faturamentoParticular || 0) +
    Number(dados.importados?.faturamentoConvenio || 0)

  const saidasFixasRateadas = fixosTotal * (Number(dados.razaoArea || 0) / 100)

  const saidasImportadas =
    Number(dados.importados?.materialLimpeza || 0) +
    Number(dados.importados?.almoxarifado || 0) +
    Number(dados.importados?.assessoriaTecnica || 0)

  const saidas = saidasFixasRateadas + manuaisTotal + saidasImportadas
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
    manuaisTotal,
    saidasImportadas,
    saidasFixasRateadas
  }
}

async function processarArquivosImportados(arquivos, mesReferencia) {
  const importados = {
    faturamentoParticular: 0,
    faturamentoConvenio: 0,
    materialLimpeza: 0,
    almoxarifado: 0,
    assessoriaTecnica: 0
  }

  const detalhesImportados = {
    faturamento: [],
    estoque: [],
    assessoria: []
  }

  const arquivosImportados = {}

  for (const arquivo of arquivos) {
    const workbook = await lerWorkbook(arquivo)
    const tipo = classificarArquivo(arquivo.name)

    if (tipo === 'faturamento') {
      const resultado = processarFaturamento(workbook, mesReferencia)
      importados.faturamentoParticular += resultado.particular
      importados.faturamentoConvenio += resultado.convenio
      detalhesImportados.faturamento.push(...resultado.detalhes)
      arquivosImportados.faturamento = {
        nome: arquivo.name,
        registros: resultado.detalhes.length
      }
    } else if (tipo === 'estoque') {
      const resultado = processarEstoque(workbook)
      importados.materialLimpeza += resultado.materialLimpeza
      importados.almoxarifado += resultado.almoxarifado
      detalhesImportados.estoque.push(...resultado.detalhes)
      arquivosImportados.estoque = {
        nome: arquivo.name,
        registros: resultado.detalhes.length
      }
    } else {
      const resultado = processarAssessoria(workbook)
      importados.assessoriaTecnica += resultado.valor
      detalhesImportados.assessoria.push(...resultado.detalhes)
      arquivosImportados.assessoria = {
        nome: arquivo.name,
        registros: resultado.detalhes.length
      }
    }
  }

  return {
    importados,
    detalhesImportados,
    arquivosImportados
  }
}

function lerWorkbook(arquivo) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result)
        resolve(XLSX.read(data, { type: 'array', cellDates: true }))
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(arquivo)
  })
}

function classificarArquivo(nome) {
  const normalizado = normalizarTexto(nome)

  if (normalizado.includes('FATURAMENTO') || normalizado.includes('PART') || normalizado.includes('CONV')) {
    return 'faturamento'
  }

  if (normalizado.includes('ESTOQUE') || normalizado.includes('LIMPEZA') || normalizado.includes('BIOMOL E LIMPEZA')) {
    return 'estoque'
  }

  return 'assessoria'
}

function processarFaturamento(workbook, mesReferencia) {
  const meses = aliasesMes(mesReferencia)
  const sheetsDoMes = workbook.SheetNames.filter((name) => {
    const n = normalizarTexto(name)
    return meses.some((m) => n.includes(m))
  })

  const sheets = sheetsDoMes.length > 0 ? sheetsDoMes : workbook.SheetNames
  let particular = 0
  let convenio = 0
  const detalhes = []

  sheets.forEach((sheetName) => {
    const ws = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })
    const headers = localizarCabecalho(rows)
    if (!headers) return

    const sheetNormal = normalizarTexto(sheetName)
    const isParticular = sheetNormal.includes('PART') || sheetNormal.includes('PARTICULAR')
    const isConvenio = sheetNormal.includes('CONV') || sheetNormal.includes('BRADE') || sheetNormal.includes('BRAD')

    const valorFatIndex = localizarColuna(headers.header, ['VL FAT', 'VL. FAT', 'VALOR FAT', 'FATURADO'])
    const valorPagoIndex = localizarColuna(headers.header, ['VL PAGO', 'VL. PAGO', 'VALOR PAGO', 'PAGO'])
    const valorLiquidoIndex = localizarColuna(headers.header, ['VL. BLC LÍQUIDO', 'VL BLC LIQUIDO', 'BLC LIQUIDO', 'LIQUIDO'])

    const valorIndex = isConvenio
      ? escolherPrimeiraColunaValida([valorPagoIndex, valorLiquidoIndex, valorFatIndex])
      : escolherPrimeiraColunaValida([valorLiquidoIndex, valorPagoIndex, valorFatIndex])

    const procedimentoIndex = localizarColuna(headers.header, ['PROCEDIMENTO'])
    const dataIndex = localizarColuna(headers.header, ['DATA'])
    const osIndex = localizarColuna(headers.header, ['O.S.', 'OS'])
    const fonteIndex = localizarColuna(headers.header, ['FONTE PAG', 'FONTE'])
    const mnemonicoIndex = localizarColuna(headers.header, ['MNEMÔNICO', 'MNEMONICO'])
    const codAmbIndex = localizarColuna(headers.header, ['COD. AMB', 'COD AMB', 'CÓD. AMB'])
    const glosaIndex = localizarColuna(headers.header, ['VL GLOSADO', 'VL. GLOSADO', 'GLOSADO'])

    if (valorIndex < 0) return

    rows.slice(headers.index + 1).forEach((row) => {
      const valorRecebido = converterNumero(row[valorIndex])
      if (!valorRecebido) return

      if (isParticular) particular += valorRecebido
      if (isConvenio) convenio += valorRecebido

      detalhes.push({
        origem: isParticular ? 'Particular' : isConvenio ? 'Convênio' : 'Faturamento',
        planilha: sheetName,
        data: formatarDataCelula(row[dataIndex]),
        os: row[osIndex] || '',
        fonte: row[fonteIndex] || '',
        mnemonico: row[mnemonicoIndex] || '',
        descricao: row[procedimentoIndex] || '',
        codAmb: row[codAmbIndex] || '',
        valorFaturado: converterNumero(row[valorFatIndex]),
        valorPago: converterNumero(row[valorPagoIndex]),
        valorGlosado: converterNumero(row[glosaIndex]),
        valorOriginal: valorRecebido,
        valorConsiderado: valorRecebido
      })
    })
  })

  return {
    particular,
    convenio,
    detalhes
  }
}

function processarEstoque(workbook) {
  let materialLimpeza = 0
  let almoxarifado = 0
  const detalhes = []

  workbook.SheetNames.forEach((sheetName) => {
    const ws = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })
    const headers = localizarCabecalho(rows)
    if (!headers) return

    const descIndex = localizarColuna(headers.header, ['DESCRIÇÃO ITEM', 'DESCRICAO ITEM', 'DESCRIÇÃO', 'DESCRICAO'])
    const totalIndex = localizarColuna(headers.header, ['TOTAL MOVIMENTO', 'TOTAL', 'VALOR'])
    const processoIndex = localizarColuna(headers.header, ['PROCESSO'])
    const quantidadeIndex = localizarColuna(headers.header, ['QTDE', 'QUANTIDADE'])
    const dataIndex = localizarColuna(headers.header, ['DATA MOVIMENTO', 'DATA'])

    if (descIndex < 0 || totalIndex < 0) return

    rows.slice(headers.index + 1).forEach((row) => {
      const descricao = row[descIndex]
      const valor = converterNumero(row[totalIndex])

      if (!descricao || !valor) return

      const descNormal = normalizarTexto(descricao)
      const isLimpeza = LIMPEZA_KEYWORDS.some((palavra) => descNormal.includes(normalizarTexto(palavra)))

      if (isLimpeza) materialLimpeza += valor
      else almoxarifado += valor

      detalhes.push({
        origem: isLimpeza ? 'Material Limpeza' : 'Almoxarifado',
        planilha: sheetName,
        data: formatarDataCelula(row[dataIndex]),
        processo: row[processoIndex] || '',
        descricao,
        quantidade: row[quantidadeIndex] || '',
        valor
      })
    })
  })

  return {
    materialLimpeza,
    almoxarifado,
    detalhes
  }
}

function processarAssessoria(workbook) {
  const detalhes = []
  let valor = 0

  workbook.SheetNames.forEach((sheetName) => {
    const ws = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })

    rows.forEach((row, index) => {
      const preenchidos = row.filter((cell) => cell !== null && cell !== undefined && cell !== '')
      if (preenchidos.length === 0) return

      const textoLinha = preenchidos.join(' | ')
      const nums = preenchidos.filter((cell) => typeof cell === 'number')
      const somaLinha = nums.reduce((acc, n) => acc + Number(n || 0), 0)

      if (normalizarTexto(textoLinha).includes('TOTAL') && somaLinha > 0) {
        valor += somaLinha
      }

      if (detalhes.length < 300) {
        detalhes.push({
          planilha: sheetName,
          linha: index + 1,
          descricao: textoLinha,
          valor: somaLinha || 0
        })
      }
    })
  })

  return {
    valor,
    detalhes
  }
}

function localizarCabecalho(rows) {
  for (let i = 0; i < rows.length; i++) {
    const normalizado = rows[i].map((cell) => normalizarTexto(cell))
    const temDescricao = normalizado.some((cell) => cell.includes('DESCR') || cell.includes('PROCEDIMENTO'))
    const temValor = normalizado.some((cell) => cell.includes('VALOR') || cell.includes('VL') || cell.includes('TOTAL'))

    if (temDescricao && temValor) {
      return {
        index: i,
        header: rows[i]
      }
    }
  }

  return null
}

function escolherPrimeiraColunaValida(indices = []) {
  return indices.find((index) => Number(index) >= 0) ?? -1
}

function localizarColuna(header, possibilidades) {
  const normalizado = header.map((cell) => normalizarTexto(cell))

  return normalizado.findIndex((cell) =>
    possibilidades.some((possibilidade) => cell.includes(normalizarTexto(possibilidade)))
  )
}

function criarDadosGraficoFinanceiro(dados, resumo) {
  return [
    {
      mes: dados.mesReferencia,
      Receitas: arredondar(resumo.entradas),
      Despesas: arredondar(resumo.saidas),
      Lucro: arredondar(resumo.lucro)
    }
  ]
}

function criarDadosGraficoHistorico(dados, resumo) {
  const historico = [...(dados.historico || [])]
    .slice(0, 5)
    .reverse()
    .map((item) => ({
      mes: item.mesReferencia,
      Consumo: arredondar(item.despesaTotal || 0),
      Lucro: arredondar(item.lucroLiquido || 0)
    }))

  historico.push({
    mes: dados.mesReferencia,
    Consumo: arredondar(resumo.saidas),
    Lucro: arredondar(resumo.lucro)
  })

  return historico.slice(-6)
}

function criarDadosGraficoComposicao(dados, resumo) {
  return [
    { name: 'Fixas rateadas', value: arredondar(resumo.saidasFixasRateadas), color: CORES_GRAFICO.azul },
    { name: 'Manuais', value: arredondar(resumo.manuaisTotal), color: CORES_GRAFICO.vermelho },
    { name: 'Material Limpeza', value: arredondar(dados.importados?.materialLimpeza || 0), color: CORES_GRAFICO.verde },
    { name: 'Almoxarifado', value: arredondar(dados.importados?.almoxarifado || 0), color: CORES_GRAFICO.amarelo },
    { name: 'Assessoria Técnica', value: arredondar(dados.importados?.assessoriaTecnica || 0), color: CORES_GRAFICO.roxo }
  ].filter((item) => item.value > 0)
}

function GraficoFinanceiro({ dados }) {
  return (
    <div className="bg-slate-900/70 border border-blue-500/10 rounded-3xl p-6">
      <h2 className="text-xl font-bold">Receitas, Despesas e Lucro</h2>
      <p className="text-slate-500 text-sm mt-1 mb-5">Visão financeira consolidada do mês.</p>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dados}>
            <XAxis dataKey="mes" stroke="#93c5fd" fontSize={12} />
            <YAxis stroke="#93c5fd" fontSize={12} tickFormatter={(v) => moedaCompacta(v)} />
            <Tooltip content={<TooltipFinanceiro />} />
            <Legend />
            <Bar dataKey="Receitas" fill={CORES_GRAFICO.verde} radius={[8, 8, 0, 0]} />
            <Bar dataKey="Despesas" fill={CORES_GRAFICO.vermelho} radius={[8, 8, 0, 0]} />
            <Bar dataKey="Lucro" fill={CORES_GRAFICO.azul} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function GraficoHistorico({ dados }) {
  return (
    <div className="bg-slate-900/70 border border-blue-500/10 rounded-3xl p-6">
      <h2 className="text-xl font-bold">Consumo x Últimos 6 Meses</h2>
      <p className="text-slate-500 text-sm mt-1 mb-5">Baseado no histórico de relatórios gerados.</p>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dados}>
            <XAxis dataKey="mes" stroke="#93c5fd" fontSize={11} />
            <YAxis stroke="#93c5fd" fontSize={12} tickFormatter={(v) => moedaCompacta(v)} />
            <Tooltip content={<TooltipFinanceiro />} />
            <Legend />
            <Line type="monotone" dataKey="Consumo" stroke={CORES_GRAFICO.amarelo} strokeWidth={3} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="Lucro" stroke={CORES_GRAFICO.verde} strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function GraficoComposicao({ dados }) {
  return (
    <div className="bg-slate-900/70 border border-blue-500/10 rounded-3xl p-6">
      <h2 className="text-xl font-bold">Composição das Despesas</h2>
      <p className="text-slate-500 text-sm mt-1 mb-5">Distribuição das saídas por origem.</p>

      <div className="h-72">
        {dados.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500">Sem dados de despesa.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={dados} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                {dados.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<TooltipFinanceiro />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

function TooltipFinanceiro({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-slate-950 border border-blue-500/20 rounded-xl p-3 shadow-xl">
      {label && <p className="text-blue-300 text-sm font-bold mb-2">{label}</p>}
      {payload.map((item) => (
        <p key={item.name} className="text-sm" style={{ color: item.color }}>
          {item.name}: {moeda(item.value)}
        </p>
      ))}
    </div>
  )
}

function gerarExcelRelatorio(relatorio) {
  const wb = XLSX.utils.book_new()
  const linhas = montarLinhasExcelUnico(relatorio)
  const ws = XLSX.utils.aoa_to_sheet(linhas)
  aplicarDesignExcel(ws, linhas)

  ws['!cols'] = [
    { wch: 42 },
    { wch: 20 },
    { wch: 16 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 18 },
    { wch: 36 }
  ]

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Relatório OX360')
  XLSX.writeFile(wb, `OX360_Financeiro_${nomeArquivo(relatorio.mesReferencia)}.xlsx`)
}


function aplicarDesignExcel(ws, linhas) {
  const range = XLSX.utils.decode_range(ws['!ref'])

  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C })
      const cell = ws[cellRef]
      if (!cell) continue

      const valor = String(cell.v || '')
      const isTitulo = R === 0
      const isSubtitulo = R === 1
      const isSecao = [
        'RESUMO EXECUTIVO',
        'GRÁFICOS - DADOS PARA VISUALIZAÇÃO',
        'RESUMO CONSOLIDADO',
        'SUBTOTAIS DO FATURAMENTO',
        'DETALHE FATURAMENTO',
        'SUBTOTAIS DO ESTOQUE / MATERIAIS',
        'DETALHE ESTOQUE / MATERIAIS',
        'DETALHE ASSESSORIA TÉCNICA'
      ].includes(valor)
      const isCabecalho = ['Indicador', 'Mês', 'Histórico 6 meses', 'Composição das Despesas', 'Descrição', 'Origem', 'Tipo', 'Planilha'].includes(valor)
      const isTotal = valor.startsWith('TOTAL') || valor.startsWith('Total') || valor.includes('LUCRO') || valor.includes('SALDO')

      cell.s = {
        font: {
          name: 'Arial',
          sz: isTitulo ? 18 : isSecao ? 13 : isCabecalho ? 11 : 10,
          bold: isTitulo || isSecao || isCabecalho || isTotal,
          color: { rgb: isTitulo || isSecao || isCabecalho ? 'FFFFFF' : '0F172A' }
        },
        fill: {
          fgColor: {
            rgb: isTitulo ? '1D4ED8' : isSubtitulo ? 'DBEAFE' : isSecao ? '2563EB' : isCabecalho ? '1E40AF' : isTotal ? 'EAF2FF' : 'FFFFFF'
          }
        },
        alignment: {
          vertical: 'center',
          horizontal: C === 0 ? 'left' : 'center',
          wrapText: true
        },
        border: {
          top: { style: 'thin', color: { rgb: 'CBD5E1' } },
          bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
          left: { style: 'thin', color: { rgb: 'CBD5E1' } },
          right: { style: 'thin', color: { rgb: 'CBD5E1' } }
        }
      }
    }
  }

  ws['!rows'] = linhas.map((linha, index) => {
    const primeiro = String(linha?.[0] || '')
    if (index === 0) return { hpt: 28 }
    if (primeiro.startsWith('DETALHE') || primeiro.startsWith('SUBTOTAIS') || primeiro === 'RESUMO CONSOLIDADO') return { hpt: 24 }
    return { hpt: 20 }
  })

  ws['!autofilter'] = { ref: 'A1:H1' }
}

function montarSubtotaisDetalhes(lista = [], campoGrupo = 'origem', campoValor = 'valor') {
  const totais = {}

  ;(lista || []).forEach((item) => {
    const grupo = item?.[campoGrupo] || 'Não classificado'
    const valor = Number(item?.[campoValor] || 0)
    totais[grupo] = Number(totais[grupo] || 0) + valor
  })

  return Object.entries(totais).map(([nome, valor]) => [nome, arredondar(valor)])
}

function montarLinhasExcelUnico(relatorio) {
  const linhas = [
    ['OX360 FINANCEIRO - RELATÓRIO EXECUTIVO CDL'],
    ['Painel BI • Gestão de Indicadores'],
    [],
    ['Mês Referência', relatorio.mesReferencia, '', 'Gerado em', relatorio.data],
    [],
    ['RESUMO EXECUTIVO'],
    ['Indicador', 'Valor'],
    ['Receita Total', relatorio.receitaTotal],
    ['Despesa Total', relatorio.despesaTotal],
    ['Lucro Líquido', relatorio.lucroLiquido],
    ['Margem Líquida', `${Number(relatorio.margemLiquida || 0).toFixed(2)}%`],
    ['Saldo Acumulado', relatorio.saldoAcumulado],
    [],
    ['GRÁFICOS - DADOS PARA VISUALIZAÇÃO'],
    ['Mês', 'Receitas', 'Despesas', 'Lucro'],
    ...relatorio.graficos.financeiro.map((item) => [item.mes, item.Receitas, item.Despesas, item.Lucro]),
    [],
    ['Histórico 6 meses', 'Consumo', 'Lucro'],
    ...relatorio.graficos.historico.map((item) => [item.mes, item.Consumo, item.Lucro]),
    [],
    ['Composição das Despesas', 'Valor'],
    ...relatorio.graficos.composicao.map((item) => [item.name, item.value]),
    [],
    ['RESUMO CONSOLIDADO'],
    ['Descrição', 'Valor Total', 'Razão Área', 'Valor da Área', 'Saída', 'Entrada'],
    ...montarLinhasConsolidadas(relatorio.dados, relatorio.resumo).map((linha) => linha.slice(0, 6)),
    [],
    ['SUBTOTAIS DO FATURAMENTO'],
    ['Origem', 'Valor Considerado'],
    ...montarSubtotaisDetalhes(relatorio.dados.detalhesImportados?.faturamento, 'origem', 'valorConsiderado'),
    [],
    ['DETALHE FATURAMENTO'],
    ['Origem', 'Planilha', 'Data', 'OS', 'Fonte', 'Mnemônico', 'Descrição', 'Valor Faturado', 'Valor Pago', 'Valor Glosado', 'Valor Considerado'],
    ...limitarDetalhes(relatorio.dados.detalhesImportados?.faturamento).map((item) => [
      item.origem,
      item.planilha,
      item.data,
      item.os,
      item.fonte,
      item.mnemonico,
      item.descricao,
      item.valorFaturado,
      item.valorPago,
      item.valorGlosado,
      item.valorConsiderado
    ]),
    [],
    ['SUBTOTAIS DO ESTOQUE / MATERIAIS'],
    ['Origem', 'Valor'],
    ...montarSubtotaisDetalhes(relatorio.dados.detalhesImportados?.estoque, 'origem', 'valor'),
    [],
    ['DETALHE ESTOQUE / MATERIAIS'],
    ['Origem', 'Planilha', 'Data', 'Processo', 'Descrição', 'Quantidade', 'Valor'],
    ...limitarDetalhes(relatorio.dados.detalhesImportados?.estoque).map((item) => [
      item.origem,
      item.planilha,
      item.data,
      item.processo,
      item.descricao,
      item.quantidade,
      item.valor
    ]),
    [],
    ['DETALHE ASSESSORIA TÉCNICA'],
    ['Planilha', 'Linha', 'Descrição', 'Valor'],
    ...limitarDetalhes(relatorio.dados.detalhesImportados?.assessoria).map((item) => [
      item.planilha,
      item.linha,
      item.descricao,
      item.valor
    ])
  ]

  return linhas
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
    desenharGraficosPDF(doc, relatorio)
    desenharTabelaPDF(doc, dados, resumo, 198)
    desenharSecaoDetalhesPDF(doc, relatorio)
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
  if (painelLogo?.data) {
    const logoPainel = ajustarImagemProporcional(painelLogo, 64, 24)
    doc.addImage(painelLogo.data, 'PNG', 14, 11, logoPainel.w, logoPainel.h)
  } else {
    doc.setFillColor(37, 99, 235)
    doc.roundedRect(14, 11, 16, 16, 4, 4, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(7)
    doc.text('BI', 20, 21)
    doc.setTextColor(15, 23, 42)
    doc.setFontSize(14)
    doc.text('Painel BI', 35, 18)
    doc.setTextColor(71, 85, 105)
    doc.setFontSize(8)
    doc.text('Gestão de Indicadores', 35, 25)
  }

  if (cdlLogo?.data) {
    const logoCDL = ajustarImagemProporcional(cdlLogo, 44, 24)
    doc.addImage(cdlLogo.data, 'PNG', 196 - logoCDL.w, 10, logoCDL.w, logoCDL.h)
  } else {
    doc.setTextColor(37, 99, 235)
    doc.setFontSize(20)
    doc.text('CDL', 170, 20)
    doc.setTextColor(71, 85, 105)
    doc.setFontSize(7)
    doc.text('Laboratório Santos e Vidal', 154, 27)
  }

  doc.setDrawColor(37, 99, 235)
  doc.setLineWidth(0.6)
  doc.line(14, 44, 196, 44)
}

function ajustarImagemProporcional(img, maxW, maxH) {
  const proporcao = img.width / img.height
  let w = maxW
  let h = w / proporcao

  if (h > maxH) {
    h = maxH
    w = h * proporcao
  }

  return { w, h }
}

function desenharTituloPDF(doc, relatorio) {
  doc.setTextColor(37, 99, 235)
  doc.setFontSize(10)
  doc.text('DIRETORIA', 14, 58)

  doc.setTextColor(15, 23, 42)
  doc.setFontSize(25)
  doc.text('OX360 FINANCEIRO', 14, 72)

  doc.setTextColor(71, 85, 105)
  doc.setFontSize(10)
  doc.text(`Mês referência: ${relatorio.mesReferencia}`, 14, 84)
}

function desenharCardsPDF(doc, relatorio) {
  const cards = [
    { titulo: 'Receita Total', valor: moeda(relatorio.receitaTotal), cor: [37, 99, 235] },
    { titulo: 'Despesa Total', valor: moeda(relatorio.despesaTotal), cor: [220, 38, 38] },
    { titulo: 'Lucro Líquido', valor: moeda(relatorio.lucroLiquido), cor: [22, 163, 74] },
    { titulo: 'Margem Líquida', valor: `${Number(relatorio.margemLiquida || 0).toFixed(2)}%`, cor: [124, 58, 237] },
    { titulo: 'Saldo Acumulado', valor: moeda(relatorio.saldoAcumulado), cor: [37, 99, 235] }
  ]

  let x = 14
  const y = 96

  cards.forEach((card) => {
    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(x, y, 34, 31, 3, 3, 'FD')
    doc.setTextColor(...card.cor)
    doc.setFontSize(7.5)
    doc.text(card.titulo, x + 4, y + 9)
    doc.setTextColor(15, 23, 42)
    doc.setFontSize(10.8)
    doc.setFont(undefined, 'bold')
    doc.text(cortarTexto(card.valor, 15), x + 4, y + 21)
    doc.setFont(undefined, 'normal')
    x += 37
  })
}

function desenharGraficosPDF(doc, relatorio) {
  const yTitulo = 135
  const yGrafico = 142

  doc.setTextColor(15, 23, 42)
  doc.setFontSize(8.5)
  doc.text('Receitas x Despesas x Lucro', 14, yTitulo)
  doc.text('Consumo dos últimos 6 meses', 77, yTitulo)
  doc.text('Composição das despesas', 140, yTitulo)

  desenharBarChartPDF(doc, 14, yGrafico, 56, 35, relatorio.graficos.financeiro?.[0])
  desenharLineChartPDF(doc, 77, yGrafico, 56, 35, relatorio.graficos.historico || [])
  desenharComposicaoPDF(doc, 140, yGrafico, 56, 35, relatorio.graficos.composicao || [])
}

function desenharBarChartPDF(doc, x, y, w, h, item = {}) {
  const dados = [
    { nome: 'Receita', valor: Number(item.Receitas || 0), cor: [34, 197, 94] },
    { nome: 'Despesa', valor: Number(item.Despesas || 0), cor: [239, 68, 68] },
    { nome: 'Lucro', valor: Number(item.Lucro || 0), cor: [37, 99, 235] }
  ]

  const max = Math.max(...dados.map((d) => Math.abs(d.valor)), 1)
  const chartX = x + 9
  const chartY = y + 6
  const chartW = w - 14
  const chartH = h - 14

  desenharCaixaGrafico(doc, x, y, w, h)
  desenharEixosGrafico(doc, chartX, chartY, chartW, chartH)

  doc.setTextColor(100, 116, 139)
  doc.setFontSize(4.6)
  doc.text(moedaCompacta(max), x + 1.5, chartY + 2)
  doc.text('0', x + 4.5, chartY + chartH)

  dados.forEach((dado, index) => {
    const bh = Math.max(2, Math.abs(dado.valor) / max * (chartH - 4))
    const bx = chartX + 7 + index * 13
    const by = chartY + chartH - bh

    doc.setFillColor(...dado.cor)
    doc.roundedRect(bx, by, 7, bh, 1.3, 1.3, 'F')

    doc.setTextColor(...dado.cor)
    doc.setFontSize(4.6)
    doc.text(moedaCompacta(dado.valor), bx - 3, by - 1.8)
    doc.text(dado.nome.substring(0, 4), bx - 1, y + h - 2.4)
  })
}

function desenharLineChartPDF(doc, x, y, w, h, itens = []) {
  desenharCaixaGrafico(doc, x, y, w, h)

  if (!itens.length) {
    doc.setTextColor(148, 163, 184)
    doc.setFontSize(6)
    doc.text('Sem histórico suficiente', x + 10, y + 18)
    return
  }

  const chartX = x + 10
  const chartY = y + 6
  const chartW = w - 15
  const chartH = h - 14
  const valores = itens.map((item) => Number(item.Consumo || 0))
  const max = Math.max(...valores, 1)
  const min = Math.min(...valores, 0)
  const range = Math.max(max - min, 1)

  desenharEixosGrafico(doc, chartX, chartY, chartW, chartH)

  doc.setTextColor(100, 116, 139)
  doc.setFontSize(4.6)
  doc.text(moedaCompacta(max), x + 1.5, chartY + 2)
  doc.text(moedaCompacta(min), x + 1.5, chartY + chartH)

  doc.setDrawColor(245, 158, 11)
  doc.setLineWidth(0.7)

  let anterior = null
  itens.forEach((item, index) => {
    const px = chartX + (index / Math.max(itens.length - 1, 1)) * chartW
    const py = chartY + chartH - ((Number(item.Consumo || 0) - min) / range) * chartH
    const mes = String(item.mes || '').split('/')[0].substring(0, 3)

    if (anterior) doc.line(anterior.x, anterior.y, px, py)
    doc.setFillColor(245, 158, 11)
    doc.circle(px, py, 1.3, 'F')
    doc.setTextColor(100, 116, 139)
    doc.setFontSize(4.5)
    doc.text(mes, px - 3, y + h - 2.4)
    anterior = { x: px, y: py }
  })
}

function desenharComposicaoPDF(doc, x, y, w, h, dados = []) {
  desenharCaixaGrafico(doc, x, y, w, h)

  const total = dados.reduce((acc, item) => acc + Number(item.value || 0), 0)
  if (!total) {
    doc.setTextColor(148, 163, 184)
    doc.setFontSize(6)
    doc.text('Sem dados de despesas', x + 10, y + 18)
    return
  }

  let atualY = y + 7
  dados.slice(0, 5).forEach((item) => {
    const percentual = Number(item.value || 0) / total
    const cor = hexToRgb(item.color || '#2563eb')
    const barraW = Math.max(2, (w - 27) * percentual)

    doc.setTextColor(71, 85, 105)
    doc.setFontSize(4.8)
    doc.text(cortarTexto(item.name, 18), x + 4, atualY)
    doc.text(`${(percentual * 100).toFixed(1)}%`, x + w - 13, atualY)

    doc.setFillColor(226, 232, 240)
    doc.roundedRect(x + 4, atualY + 2, w - 12, 2.3, 0.8, 0.8, 'F')
    doc.setFillColor(cor[0], cor[1], cor[2])
    doc.roundedRect(x + 4, atualY + 2, barraW, 2.3, 0.8, 0.8, 'F')

    atualY += 6
  })
}

function desenharCaixaGrafico(doc, x, y, w, h) {
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.45)
  doc.roundedRect(x, y, w, h, 2.5, 2.5)
}

function desenharEixosGrafico(doc, chartX, chartY, chartW, chartH) {
  doc.setDrawColor(148, 163, 184)
  doc.setLineWidth(0.45)
  doc.line(chartX, chartY, chartX, chartY + chartH)
  doc.line(chartX, chartY + chartH, chartX + chartW, chartY + chartH)
}

function desenharTabelaPDF(doc, dados, resumo, startY = 130) {
  doc.setTextColor(15, 23, 42)
  doc.setFontSize(13)
  doc.text('Resumo consolidado', 14, startY - 6)

  const colunas = ['Descrição', 'Valor Total', 'Razão', 'Valor Área', 'Saída', 'Entrada']
  const linhas = montarLinhasConsolidadas(dados, resumo)

  const x = 14
  let y = startY
  const colWidths = [64, 25, 22, 25, 24, 24]
  const rowHeight = 6

  desenharCabecalhoTabela(doc, x, y, colunas, colWidths, rowHeight)
  y += rowHeight

  linhas.forEach((linha, index) => {
    if (y > 275) {
      desenharRodapeSimples(doc)
      doc.addPage()
      configurarPaginaPDF(doc)
      y = 18
      desenharCabecalhoTabela(doc, x, y, colunas, colWidths, rowHeight)
      y += rowHeight
    }

    y = desenharLinhaTabela(doc, x, y, linha, index, colWidths, rowHeight)
  })
}

function desenharCabecalhoTabela(doc, x, y, colunas, colWidths, rowHeight) {
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

function desenharLinhaTabela(doc, x, y, linha, index, colWidths, rowHeight) {
  const tipo = linha[6]

  if (tipo === 'secaoAzul' || tipo === 'secaoVermelha' || tipo === 'secaoVerde') {
    const config = {
      secaoAzul: { fill: [239, 246, 255], text: [37, 99, 235] },
      secaoVermelha: { fill: [254, 242, 242], text: [220, 38, 38] },
      secaoVerde: { fill: [240, 253, 244], text: [22, 163, 74] }
    }[tipo]

    doc.setFillColor(...config.fill)
    doc.setTextColor(...config.text)
    doc.setFontSize(7)
    doc.rect(x, y, 184, rowHeight, 'F')
    doc.text(linha[0], x + 2, y + 4)
    return y + rowHeight
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

  const textoLinha = [
    linha[0],
    valorOuTraco(linha[1]),
    linha[2] || '-',
    valorOuTraco(linha[3]),
    valorOuTraco(linha[4]),
    valorOuTraco(linha[5])
  ]

  let colX = x
  textoLinha.forEach((texto, colIndex) => {
    const textoCortado = cortarTexto(String(texto), colIndex === 0 ? 32 : 14)
    doc.text(textoCortado, colX + 2, y + 4, { maxWidth: colWidths[colIndex] - 4 })
    colX += colWidths[colIndex]
  })

  return y + rowHeight
}

function desenharSecaoDetalhesPDF(doc, relatorio) {
  const detalhes = relatorio.dados.detalhesImportados || {}

  desenharDetalheFaturamentoPDF(doc, detalhes.faturamento || [])
  desenharDetalheEstoquePDF(doc, detalhes.estoque || [])
  desenharDetalheAssessoriaPDF(doc, detalhes.assessoria || [])
}

function desenharDetalheFaturamentoPDF(doc, itens = []) {
  if (!itens.length) return

  iniciarPaginaDetalhe(doc, 'Detalhamento do Faturamento')
  let y = 34

  const subtotais = montarSubtotaisDetalhes(itens, 'origem', 'valorConsiderado')
  y = desenharSubtotaisPDF(doc, 'Subtotais por origem', subtotais, y)

  const colunas = ['Tipo', 'Data', 'OS', 'Fonte', 'Mnemônico', 'Valor Pago']
  const widths = [21, 21, 24, 48, 25, 28]
  y = desenharTabelaDetalheCabecalho(doc, colunas, widths, y)

  itens.forEach((item, index) => {
    if (y > 274) {
      desenharRodapeSimples(doc)
      iniciarPaginaDetalhe(doc, 'Detalhamento do Faturamento')
      y = desenharTabelaDetalheCabecalho(doc, colunas, widths, 32)
    }

    y = desenharTabelaDetalheLinha(doc, [
      item.origem,
      item.data,
      item.os,
      item.fonte,
      item.mnemonico,
      valorOuTraco(item.valorConsiderado)
    ], widths, y, index)
  })
}

function desenharDetalheEstoquePDF(doc, itens = []) {
  if (!itens.length) return

  iniciarPaginaDetalhe(doc, 'Detalhamento do Estoque / Materiais')
  let y = 34

  const subtotais = montarSubtotaisDetalhes(itens, 'origem', 'valor')
  y = desenharSubtotaisPDF(doc, 'Subtotais por categoria', subtotais, y)

  const colunas = ['Origem', 'Data', 'Processo', 'Descrição', 'Qtd.', 'Valor']
  const widths = [28, 20, 25, 62, 12, 22]
  y = desenharTabelaDetalheCabecalho(doc, colunas, widths, y)

  itens.forEach((item, index) => {
    if (y > 274) {
      desenharRodapeSimples(doc)
      iniciarPaginaDetalhe(doc, 'Detalhamento do Estoque / Materiais')
      y = desenharTabelaDetalheCabecalho(doc, colunas, widths, 32)
    }

    y = desenharTabelaDetalheLinha(doc, [
      item.origem,
      item.data,
      item.processo,
      item.descricao,
      item.quantidade,
      valorOuTraco(item.valor)
    ], widths, y, index)
  })
}

function desenharDetalheAssessoriaPDF(doc, itens = []) {
  if (!itens.length) return

  iniciarPaginaDetalhe(doc, 'Detalhamento da Assessoria Técnica')
  let y = 34

  const colunas = ['Planilha', 'Linha', 'Descrição', 'Valor']
  const widths = [35, 15, 95, 25]
  y = desenharTabelaDetalheCabecalho(doc, colunas, widths, y)

  itens.forEach((item, index) => {
    if (y > 274) {
      desenharRodapeSimples(doc)
      iniciarPaginaDetalhe(doc, 'Detalhamento da Assessoria Técnica')
      y = desenharTabelaDetalheCabecalho(doc, colunas, widths, 32)
    }

    y = desenharTabelaDetalheLinha(doc, [
      item.planilha,
      item.linha,
      item.descricao,
      valorOuTraco(item.valor)
    ], widths, y, index)
  })
}

function iniciarPaginaDetalhe(doc, titulo) {
  doc.addPage()
  configurarPaginaPDF(doc)
  doc.setTextColor(15, 23, 42)
  doc.setFontSize(15)
  doc.text(titulo, 14, 18)
  doc.setDrawColor(37, 99, 235)
  doc.setLineWidth(0.4)
  doc.line(14, 24, 196, 24)
}

function desenharSubtotaisPDF(doc, titulo, subtotais, y) {
  if (!subtotais.length) return y

  doc.setTextColor(37, 99, 235)
  doc.setFontSize(9)
  doc.text(titulo, 14, y)
  y += 5

  subtotais.forEach(([nome, valor]) => {
    doc.setFillColor(239, 246, 255)
    doc.setDrawColor(226, 232, 240)
    doc.rect(14, y, 86, 6, 'FD')
    doc.setTextColor(15, 23, 42)
    doc.setFontSize(6.5)
    doc.text(cortarTexto(nome, 35), 16, y + 4)
    doc.text(moeda(valor), 74, y + 4)
    y += 6
  })

  return y + 4
}

function desenharTabelaDetalheCabecalho(doc, colunas, widths, y) {
  const x = 14
  doc.setFillColor(37, 99, 235)
  doc.rect(x, y, widths.reduce((a, b) => a + b, 0), 7, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(6.3)

  let colX = x
  colunas.forEach((col, index) => {
    doc.text(col, colX + 1.5, y + 4.5)
    colX += widths[index]
  })

  return y + 7
}

function desenharTabelaDetalheLinha(doc, valores, widths, y, index) {
  const x = 14
  const altura = 7
  doc.setFillColor(index % 2 === 0 ? 248 : 255, 250, 252)
  doc.setDrawColor(226, 232, 240)
  doc.rect(x, y, widths.reduce((a, b) => a + b, 0), altura, 'FD')
  doc.setTextColor(15, 23, 42)
  doc.setFontSize(5.7)

  let colX = x
  valores.forEach((valor, colIndex) => {
    const limite = colIndex === 3 || colIndex === 2 ? 32 : 18
    doc.text(cortarTexto(String(valor || '-'), limite), colX + 1.5, y + 4.5, { maxWidth: widths[colIndex] - 2 })
    colX += widths[colIndex]
  })

  return y + altura
}

function desenharRodapePDF(doc, relatorio) {
  const totalPages = doc.internal.getNumberOfPages()

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setDrawColor(226, 232, 240)
    doc.line(14, 286, 196, 286)
    doc.setTextColor(100, 116, 139)
    doc.setFontSize(7)
    doc.text(`Gerado em: ${relatorio.data}`, 14, 292)
    doc.text(`Página ${i} de ${totalPages}`, 95, 292)
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

  const linhasManuais = CAMPOS_MANUAIS.map((campo) => {
    const valor = Number(dados.manuais?.[campo.key] || 0)
    const entrada = campo.key === 'saldoAnterior'
    return [campo.nome, valor, 'Não se aplica', 0, entrada ? 0 : valor, entrada ? valor : 0, 'normal']
  })

  const linhasImportados = CAMPOS_IMPORTADOS.map((campo) => {
    const valor = Number(dados.importados?.[campo.key] || 0)
    const entrada = campo.key.includes('faturamento')
    return [campo.nome, valor, 'Importado', 0, entrada ? 0 : valor, entrada ? valor : 0, 'normal']
  })

  const totalFixos = linhasFixos.reduce((acc, linha) => acc + Number(linha[4] || 0), 0)
  const totalManuaisSaida = linhasManuais.reduce((acc, linha) => acc + Number(linha[4] || 0), 0)
  const totalManuaisEntrada = linhasManuais.reduce((acc, linha) => acc + Number(linha[5] || 0), 0)
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
          {montarLinhasConsolidadas(dados, resumo).map((linha, index) => (
            <LinhaResumoCompleta key={`${linha[0]}-${index}`} linha={linha} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function LinhaResumoCompleta({ linha }) {
  const tipo = linha[6]

  if (tipo === 'secaoAzul' || tipo === 'secaoVermelha' || tipo === 'secaoVerde') {
    const classe = {
      secaoAzul: 'bg-blue-900/30 text-blue-300',
      secaoVermelha: 'bg-red-900/30 text-red-300',
      secaoVerde: 'bg-green-900/30 text-green-300'
    }[tipo]

    return (
      <tr className={`${classe} font-bold`}>
        <td colSpan="6" className="p-3">{linha[0]}</td>
      </tr>
    )
  }

  const classe = tipo === 'total'
    ? 'bg-blue-950 text-white font-bold'
    : tipo === 'lucro'
      ? 'bg-green-900/30 text-green-300 font-bold'
      : tipo === 'saldo'
        ? 'bg-blue-900/30 text-blue-300 font-bold'
        : 'border-b border-slate-800'

  return (
    <tr className={classe}>
      <td className="p-3">{linha[0]}</td>
      <td className="p-3 text-right">{valorOuTraco(linha[1])}</td>
      <td className="p-3 text-right">{linha[2] || '-'}</td>
      <td className="p-3 text-right">{valorOuTraco(linha[3])}</td>
      <td className="p-3 text-right text-red-300">{valorOuTraco(linha[4])}</td>
      <td className="p-3 text-right text-green-300">{valorOuTraco(linha[5])}</td>
    </tr>
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
                className={`w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-blue-500 ${
                  !editavel ? 'opacity-70 cursor-not-allowed text-slate-400' : ''
                }`}
                placeholder="0,00"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
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

function somaCampos(obj = {}, campos = []) {
  return campos.reduce((acc, campo) => acc + Number(obj?.[campo.key] || 0), 0)
}

function converterNumero(valor) {
  if (typeof valor === 'number') return valor
  if (valor instanceof Date) return 0
  return Number(String(valor || '').replace('R$', '').replace(/\./g, '').replace(',', '.')) || 0
}

function moeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

function moedaCompacta(valor) {
  const numero = Number(valor || 0)
  if (Math.abs(numero) >= 1000000) return `R$ ${(numero / 1000000).toFixed(1)} mi`
  if (Math.abs(numero) >= 1000) return `R$ ${(numero / 1000).toFixed(0)}k`
  return moeda(numero)
}

function valorOuTraco(valor) {
  const numero = Number(valor || 0)
  return numero === 0 ? '-' : moeda(numero)
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

function aliasesMes(mesReferencia) {
  const texto = normalizarTexto(mesReferencia)

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

  const chave = Object.keys(mapa).find((mes) => texto.includes(mes))
  return chave ? mapa[chave].map(normalizarTexto) : []
}

function formatarDataCelula(valor) {
  if (!valor) return ''
  if (valor instanceof Date) return valor.toLocaleDateString('pt-BR')
  return String(valor)
}

function arredondar(valor) {
  return Number(Number(valor || 0).toFixed(2))
}

function limitarDetalhes(lista = []) {
  return (lista || []).slice(0, 500)
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '')
  return [
    parseInt(clean.substring(0, 2), 16),
    parseInt(clean.substring(2, 4), 16),
    parseInt(clean.substring(4, 6), 16)
  ]
}

function carregarImagem(url) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth || img.width
      canvas.height = img.naturalHeight || img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      resolve({
        data: canvas.toDataURL('image/png'),
        width: canvas.width,
        height: canvas.height
      })
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}

export default OX360Financeiro
