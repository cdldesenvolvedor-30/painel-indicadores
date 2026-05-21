function Card({ titulo, valor, destaque }) {
  return (
    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
      <h2 className="text-slate-400 text-sm">{titulo}</h2>

      <p className={`text-4xl font-bold mt-2 ${destaque ? 'text-green-400' : ''}`}>
        {valor}
      </p>
    </div>
  )
}

export default Card