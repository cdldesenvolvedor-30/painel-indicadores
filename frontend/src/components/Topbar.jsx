import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

import {
  Search,
  Bell,
  CalendarDays,
  User,
  LogOut,
  Shield,
  Mail
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'

function Topbar({ titulo }) {
  const { usuario, logout } = useAuth()

  const navigate = useNavigate()

  const [pesquisa, setPesquisa] = useState('')
  const [abrirNotificacoes, setAbrirNotificacoes] = useState(false)
  const [abrirPerfil, setAbrirPerfil] = useState(false)

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

  function sair() {
    logout()
    navigate('/login')
  }

  const notificacoes = [
    {
      titulo: 'Nova avaliação registrada',
      descricao: 'Mapa de performance atualizado.'
    },
    {
      titulo: 'Meta atingida',
      descricao: 'Equipe CDL Centro bateu a meta.'
    },
    {
      titulo: 'Novo alerta operacional',
      descricao: 'Existem indicadores abaixo da meta.'
    }
  ]

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

      <div className="flex items-center gap-4 relative">
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

        <div className="relative">
          <button
            onClick={() => {
              setAbrirNotificacoes(!abrirNotificacoes)
              setAbrirPerfil(false)
            }}
            className="bg-slate-900 border border-slate-800 rounded-xl p-3 relative hover:bg-slate-800 transition"
          >
            <Bell size={22} />

            <span className="absolute -top-2 -right-2 bg-red-500 text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {notificacoes.length}
            </span>
          </button>

          {abrirNotificacoes && (
            <div className="absolute right-0 mt-3 w-96 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="p-4 border-b border-slate-800">
                <h2 className="font-bold text-lg">
                  Notificações
                </h2>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notificacoes.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 border-b border-slate-900 hover:bg-slate-900 transition"
                  >
                    <p className="font-semibold">
                      {item.titulo}
                    </p>

                    <p className="text-sm text-slate-400 mt-1">
                      {item.descricao}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setAbrirPerfil(!abrirPerfil)
              setAbrirNotificacoes(false)
            }}
            className="bg-blue-600 w-11 h-11 rounded-full overflow-hidden flex items-center justify-center font-bold hover:scale-105 transition"
          >
            {usuario?.foto_url ? (
              <img
                src={usuario.foto_url}
                alt={usuario.nome}
                className="w-full h-full object-cover"
              />
            ) : (
              usuario?.nome?.charAt(0) || 'U'
            )}
          </button>

          {abrirPerfil && (
            <div className="absolute right-0 mt-3 w-80 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="p-5 border-b border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-600 w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold">
                    {usuario?.nome?.charAt(0) || 'U'}
                  </div>

                  <div>
                    <h2 className="font-bold text-lg">
                      {usuario?.nome}
                    </h2>

                    <p className="text-slate-400 text-sm">
                      {usuario?.perfil}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3 text-slate-300">
                  <Mail size={18} />
                  <span>{usuario?.email}</span>
                </div>

                <div className="flex items-center gap-3 text-slate-300">
                  <Shield size={18} />
                  <span>
                    Perfil: {usuario?.perfil}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-slate-300">
                  <User size={18} />
                  <span>
                    Setor: {usuario?.setor || 'Não informado'}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-800 p-4">
                <button
                  onClick={sair}
                  className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 transition rounded-xl py-3 font-semibold"
                >
                  <LogOut size={18} />
                  Sair
                </button>
              </div>
            </div>
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