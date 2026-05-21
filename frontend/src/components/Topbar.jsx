import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

import {
  Search,
  Bell,
  CalendarDays
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'

function Topbar({ titulo }) {
  const { usuario } = useAuth()

  const navigate = useNavigate()

  const [pesquisa, setPesquisa] = useState('')

  const dataAtual = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

  function pesquisar(e) {
    e.preventDefault()

    if (!pesquisa.trim()) return

    navigate(`/indicadores?busca=${pesquisa}`)
  }

  return (
    <div className="flex justify-between items-start mb-8 relative">
      <div>
        <h1 className="text-4xl font-bold">
          {titulo}
        </h1>

        <p className="text-slate-400 mt-2">
          Visão geral da performance operacional
        </p>
      </div>

      <div className="flex items-center gap-4">
        <form
          onSubmit={pesquisar}
          className="hidden lg:flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 w-80"
        >
          <input
            placeholder="Pesquisar colaborador..."
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            className="bg-transparent outline-none flex-1"
          />

          <button type="submit">
            <Search
              size={20}
              className="text-slate-400 hover:text-blue-400 transition"
            />
          </button>
        </form>

        <button className="bg-slate-900 border border-slate-800 rounded-xl p-3 relative hover:bg-slate-800 transition">
          <Bell size={22} />

          <span className="absolute -top-2 -right-2 bg-red-500 text-xs w-5 h-5 rounded-full flex items-center justify-center">
            3
          </span>
        </button>

        <div className="bg-blue-600 w-11 h-11 rounded-full overflow-hidden flex items-center justify-center font-bold">
          {usuario?.foto_url ? (
            <img
              src={usuario.foto_url}
              alt={usuario.nome}
              className="w-full h-full object-cover"
            />
          ) : (
            usuario?.nome?.charAt(0) || 'U'
          )}
        </div>
      </div>

      <div className="absolute right-10 top-16 hidden xl:flex items-center gap-2 text-slate-400">
        <CalendarDays size={18} />

        <span className="capitalize">
          {dataAtual}
        </span>
      </div>
    </div>
  )
}

export default Topbar