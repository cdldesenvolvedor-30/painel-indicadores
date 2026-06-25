import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'

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
    historico: []
  }
}

function OX360Financeiro() {
  const [editandoFixos, setEditandoFixos] = useState(false)

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
        historico: dadosSalvos.historico || []
      }
    } catch {
      return valorInicial()
    }
  })

  const resumo = useMemo(() => calcularResumo(dados), [dados])

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
      importados: {}
    })
    toast.success('Tabela limpa. Os valores fixos foram mantidos.')
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
      <div className="mb-8 flex items-start justify-between gap-5">
        <div>
          <p className="text-blue-400 font-semibold">Diretoria</p>
          <h1 className="text-4xl font-bold mt-2">OX360 Financeiro</h1>
          <p className="text-slate-400 mt-2">
            Painel financeiro executivo com faturamento, estoque, assessoria técnica, despesas e lucro.
          </p>
        </div>

        <div className="flex gap-3">
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
          subtitulo="Depois serão preenchidos pelas planilhas importadas."
          campos={CAMPOS_IMPORTADOS}
          grupo="importados"
          dados={dados.importados}
          onChange={atualizarGrupo}
          editavel
        />
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
          <h2 className="text-xl font-bold mb-4">Receitas x Despesas</h2>
          <div className="h-72 flex items-center justify-center text-slate-500">
            Gráfico será conectado após leitura real das planilhas.
          </div>
        </div>

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
    ...consolidado
  ])
  wsConsolidado['!cols'] = [
    { wch: 38 },
    { wch: 18 },
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 }
  ]
  XLSX.utils.book_append_sheet(wb, wsConsolidado, 'Consolidado')

  XLSX.writeFile(wb, `OX360_Financeiro_${nomeArquivo(relatorio.mesReferencia)}.xlsx`)
}

function adicionarAba(wb, nomeAba, campos, valores = {}) {
  const linhas = [
    ['Descrição', 'Valor'],
    ...campos.map((campo) => [campo.nome, valores?.[campo.key] || 0])
  ]

  const ws = XLSX.utils.aoa_to_sheet(linhas)
  ws['!cols'] = [{ wch: 38 }, { wch: 18 }]
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
    desenharTabelaPDF(doc, dados, resumo)
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
  // Cabeçalho branco, com logos sem distorção e alinhamento estilo relatório executivo
  if (painelLogo?.dataUrl) {
    adicionarImagemProporcional(doc, painelLogo, 14, 10, 58, 22, 'left')
  } else {
    doc.setFillColor(37, 99, 235)
    doc.roundedRect(14, 10, 14, 14, 3, 3, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(7)
    doc.text('BI', 18, 19)
    doc.setTextColor(15, 23, 42)
    doc.setFontSize(13)
    doc.text('Painel BI', 32, 17)
    doc.setTextColor(71, 85, 105)
    doc.setFontSize(8)
    doc.text('Gestão de Indicadores', 32, 23)
  }

  if (cdlLogo?.dataUrl) {
    adicionarImagemProporcional(doc, cdlLogo, 154, 8, 42, 24, 'right')
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
  doc.line(14, 36, 196, 36)
}

function desenharTituloPDF(doc, relatorio) {
  doc.setTextColor(37, 99, 235)
  doc.setFontSize(9)
  doc.text('DIRETORIA', 14, 47)

  doc.setTextColor(15, 23, 42)
  doc.setFontSize(24)
  doc.text('OX360 FINANCEIRO', 14, 59)

  doc.setTextColor(71, 85, 105)
  doc.setFontSize(9)
  doc.text(`Mês referência: ${relatorio.mesReferencia}`, 14, 70)
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
  const y = 82

  cards.forEach((card) => {
    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(x, y, 34, 28, 3, 3, 'FD')

    doc.setTextColor(...card.cor)
    doc.setFontSize(7)
    doc.text(card.titulo, x + 4, y + 9)

    doc.setTextColor(15, 23, 42)
    doc.setFontSize(10)
    doc.text(card.valor, x + 4, y + 18)

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

  doc.setFillColor(37, 99, 235)
  doc.rect(x, y, 184, rowHeight, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(7)

  let colX = x
  colunas.forEach((col, index) => {
    doc.text(col, colX + 2, y + 4)
    colX += colWidths[index]
  })

  y += rowHeight

  linhas.forEach((linha, index) => {
    if (y > 275) {
      desenharRodapeSimples(doc)
      doc.addPage()
      configurarPaginaPDF(doc)
      y = 18
    }

    const tipo = linha[6]

    if (tipo === 'secaoAzul') {
      doc.setFillColor(239, 246, 255)
      doc.setTextColor(37, 99, 235)
      doc.setFontSize(7)
      doc.rect(x, y, 184, rowHeight, 'F')
      doc.text(linha[0], x + 2, y + 4)
      y += rowHeight
      return
    }

    if (tipo === 'secaoVermelha') {
      doc.setFillColor(254, 242, 242)
      doc.setTextColor(220, 38, 38)
      doc.setFontSize(7)
      doc.rect(x, y, 184, rowHeight, 'F')
      doc.text(linha[0], x + 2, y + 4)
      y += rowHeight
      return
    }

    if (tipo === 'secaoVerde') {
      doc.setFillColor(240, 253, 244)
      doc.setTextColor(22, 163, 74)
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

    const textoLinha = [
      linha[0],
      valorOuTraco(linha[1]),
      linha[2] || '-',
      valorOuTraco(linha[3]),
      valorOuTraco(linha[4]),
      valorOuTraco(linha[5])
    ]

    colX = x
    textoLinha.forEach((texto, colIndex) => {
      const maxWidth = colWidths[colIndex] - 4
      const textoCortado = cortarTexto(String(texto), colIndex === 0 ? 32 : 14)
      doc.text(textoCortado, colX + 2, y + 4, { maxWidth })
      colX += colWidths[colIndex]
    })

    y += rowHeight
  })
}

function desenharRodapePDF(doc, relatorio) {
  doc.setDrawColor(226, 232, 240)
  doc.line(14, 286, 196, 286)
  doc.setTextColor(100, 116, 139)
  doc.setFontSize(7)
  doc.text(`Gerado em: ${relatorio.data}`, 14, 292)
  doc.text('Painel BI • Gestão de Indicadores', 150, 292)
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

function converterNumero(valor) {
  if (typeof valor === 'number') return valor
  return Number(String(valor).replace(',', '.')) || 0
}

function moeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
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
        dataUrl: canvas.toDataURL('image/png'),
        width: canvas.width,
        height: canvas.height
      })
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}

function adicionarImagemProporcional(doc, imagem, x, y, maxWidth, maxHeight, alinhamento = 'left') {
  const proporcao = imagem.width / imagem.height
  let largura = maxWidth
  let altura = largura / proporcao

  if (altura > maxHeight) {
    altura = maxHeight
    largura = altura * proporcao
  }

  const posX = alinhamento === 'right' ? x + maxWidth - largura : x
  const posY = y + (maxHeight - altura) / 2

  doc.addImage(imagem.dataUrl, 'PNG', posX, posY, largura, altura)
}

export default OX360Financeiro
