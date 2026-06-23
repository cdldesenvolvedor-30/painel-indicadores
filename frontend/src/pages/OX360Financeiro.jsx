function OX360Financeiro() {
  return (
    <main className="min-h-screen bg-[#020817] text-white p-8 overflow-y-auto">
      <div className="mb-8">
        <p className="text-blue-400 font-semibold">Diretoria</p>
        <h1 className="text-4xl font-bold mt-2">OX360 Financeiro</h1>
        <p className="text-slate-400 mt-2">
          Painel financeiro executivo com faturamento, estoque, assessoria técnica, despesas e lucro.
        </p>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button className="bg-blue-600 hover:bg-blue-500 transition rounded-2xl p-5 font-bold">
          Importar Faturamento
        </button>

        <button className="bg-blue-600 hover:bg-blue-500 transition rounded-2xl p-5 font-bold">
          Importar Estoque
        </button>

        <button className="bg-blue-600 hover:bg-blue-500 transition rounded-2xl p-5 font-bold">
          Importar Assessoria Técnica
        </button>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <Card titulo="Receita Total" valor="R$ 0,00" />
        <Card titulo="Despesa Total" valor="R$ 0,00" />
        <Card titulo="Lucro Líquido" valor="R$ 0,00" />
        <Card titulo="Margem Líquida" valor="0%" />
      </section>

      <section className="bg-slate-900/70 border border-blue-500/10 rounded-3xl p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Receitas x Despesas</h2>
        <div className="h-72 flex items-center justify-center text-slate-500">
          Gráfico será carregado após importação das planilhas.
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/70 border border-blue-500/10 rounded-3xl p-6">
          <h2 className="text-xl font-bold mb-4">Resumo Financeiro</h2>
          <p className="text-slate-500">Aguardando importação.</p>
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

function Card({ titulo, valor }) {
  return (
    <div className="bg-slate-900/70 border border-blue-500/10 rounded-3xl p-6">
      <p className="text-slate-400 text-sm">{titulo}</p>
      <h3 className="text-3xl font-bold mt-3">{valor}</h3>
    </div>
  )
}

export default OX360Financeiro
