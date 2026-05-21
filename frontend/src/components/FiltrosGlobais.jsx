import { useEffect, useState } from 'react'
import { CalendarDays, Filter, RotateCcw } from 'lucide-react'

import api from '../services/api'
import { useFiltros } from '../context/FiltrosContext'

function FiltrosGlobais() {
  const [colaboradores, setColaboradores] = useState([])

  const {
    filtros,
    atualizarFiltro,
    limparFiltros
  } = useFiltros()

  async function carregarColaboradores() {
    try {
      const response = await api.get('/colaboradores')
      setColaboradores(response.data)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    carregarColaboradores()
  }, [])

  const setores = [
    ...new Set(colaboradores.map((item) => item.setor))
  ]

  return (
    <section className="glass-card rounded-[28px] p-5 mb-8">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
            <Filter size={22} />
          </div>

          <div>
            <h2 className="text-xl font-bold">
              Filtros Globais
            </h2>

            <p className="text-slate-400 text-sm">
              Aplique filtros para análise geral do painel.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 xl:w-[900px]">
          <input
            type="date"
            value={filtros.inicio}
            onChange={(e) => atualizarFiltro('inicio', e.target.value)}
            className="bg-slate-950/70 soft-border rounded-2xl px-4 py-3 outline-none"
          />

          <input
            type="date"
            value={filtros.fim}
            onChange={(e) => atualizarFiltro('fim', e.target.value)}
            className="bg-slate-950/70 soft-border rounded-2xl px-4 py-3 outline-none"
          />

          <select
            value={filtros.setor}
            onChange={(e) => atualizarFiltro('setor', e.target.value)}
            className="bg-slate-950/70 soft-border rounded-2xl px-4 py-3 outline-none"
          >
            <option value="">Todos os setores</option>

            {setores.map((setor) => (
              <option key={setor} value={setor}>
                {setor}
              </option>
            ))}
          </select>

          <select
            value={filtros.colaboradorId}
            onChange={(e) => atualizarFiltro('colaboradorId', e.target.value)}
            className="bg-slate-950/70 soft-border rounded-2xl px-4 py-3 outline-none"
          >
            <option value="">Todos colaboradores</option>

            {colaboradores.map((colaborador) => (
              <option key={colaborador.id} value={colaborador.id}>
                {colaborador.nome}
              </option>
            ))}
          </select>

          <button
            onClick={limparFiltros}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 rounded-2xl font-bold transition"
          >
            <RotateCcw size={17} />
            Limpar
          </button>
        </div>
      </div>
    </section>
  )
}

export default FiltrosGlobais