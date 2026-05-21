function Ranking({ ranking }) {

  return (

    <section className="mt-10 bg-slate-900 p-6 rounded-2xl border border-slate-800">

      <h2 className="text-2xl font-bold mb-6">
        Ranking de Colaboradores
      </h2>

      <div className="space-y-4">

        {
          ranking.map((item, index) => (

            <div
              key={index}
              className="flex justify-between bg-slate-800 p-4 rounded-xl"
            >

              <div>

                <p className="font-bold">
                  #{index + 1} {item.nome}
                </p>

                <p className="text-sm text-slate-400">
                  {item.setor}
                </p>

              </div>

              <div className="text-right">

                <p className="text-xl font-bold text-blue-400">
                  {item.score}
                </p>

                <p className="text-sm text-slate-400">
                  Score
                </p>

              </div>

            </div>

          ))
        }

      </div>

    </section>

  )

}

export default Ranking