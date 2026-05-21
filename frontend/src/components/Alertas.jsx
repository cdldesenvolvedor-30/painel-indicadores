function Alertas({ alertas }) {
  return (
    <section className="mt-10 bg-slate-900 p-6 rounded-2xl border border-slate-800">
      <h2 className="text-2xl font-bold mb-6">
        Alertas de Desempenho
      </h2>

      <div className="space-y-4">
        {alertas.map((item, index) => (
          <div
            key={index}
            className="flex justify-between bg-slate-800 p-4 rounded-xl"
          >
            <div>
              <p className="font-bold">{item.nome}</p>
              <p className="text-sm text-slate-400">{item.setor}</p>
            </div>

            <span
              className={`px-4 py-2 rounded-full text-sm font-bold ${
                item.alerta === 'Dentro do esperado'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {item.alerta}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Alertas