import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

function GraficoVendas({ ranking }) {

  return (

    <section className="mt-10 bg-slate-900 p-6 rounded-2xl border border-slate-800">

      <h2 className="text-2xl font-bold mb-6">
        Performance de Vendas
      </h2>

      <div style={{ width: '100%', height: 300 }}>

        <ResponsiveContainer>

          <BarChart data={ranking}>

            <XAxis dataKey="nome" />

            <YAxis />

            <Tooltip />

            <Bar
              dataKey="total_vendas"
              fill="#3b82f6"
              radius={[10, 10, 0, 0]}
            />

          </BarChart>

        </ResponsiveContainer>

      </div>

    </section>

  )

}

export default GraficoVendas