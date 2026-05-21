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
          className="hidden lg:flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 w-80 shadow-xl"
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
            className="bg-slate-900 border border-slate-800 rounded-2xl p-3 relative hover:bg-slate-800 transition shadow-xl"
          >
            <Bell size={22} />

            <span className="absolute -top-2 -right-2 bg-red-500 text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-lg">
              {notificacoes.length}
            </span>
          </button>

          {abrirNotificacoes && (
            <div className="absolute right-0 mt-3 w-[420px] bg-[#020817]/95 backdrop-blur-xl border border-blue-500/20 rounded-[24px] shadow-[0_25px_80px_rgba(0,0,0,0.55)] z-50 overflow-hidden">
              <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-blue-600/15 to-transparent">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-xl">
                      Central de Notificações
                    </h2>

                    <p className="text-slate-400 text-sm mt-1">
                      Atualizações importantes do sistema
                    </p>
                  </div>

                  <span className="bg-red-500/15 text-red-400 px-3 py-1 rounded-full text-sm font-bold">
                    {notificacoes.length} novas
                  </span>
                </div>
              </div>

              <div className="p-3 space-y-3 max-h-96 overflow-y-auto">
                {notificacoes.map((item, index) => (
                  <div
                    key={index}
                    className="group bg-slate-950/70 border border-slate-800 hover:border-blue-500/40 rounded-2xl p-4 transition hover:bg-blue-950/20"
                  >
                    <div className="flex gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                        <Bell size={20} />
                      </div>

                      <div className="flex-1">
                        <div className="flex justify-between gap-3">
                          <p className="font-bold">
                            {item.titulo}
                          </p>

                          <span className="text-xs text-slate-500">
                            agora
                          </span>
                        </div>

                        <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                          {item.descricao}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-slate-800">
                <button className="w-full bg-blue-600 hover:bg-blue-700 transition rounded-2xl py-3 font-bold shadow-xl">
                  Ver todas as notificações
                </button>
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
            className="bg-blue-600 w-11 h-11 rounded-full overflow-hidden flex items-center justify-center font-bold hover:scale-105 transition shadow-xl"
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
            <div className="absolute right-0 mt-3 w-80 bg-[#020817]/95 backdrop-blur-xl border border-blue-500/20 rounded-[24px] shadow-[0_25px_80px_rgba(0,0,0,0.55)] z-50 overflow-hidden">
              <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-blue-600/15 to-transparent">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-600 w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shadow-xl">
                    {usuario?.nome?.charAt(0) || 'U'}
                  </div>

                  <div>
                    <h2 className="font-bold text-lg">
                      {usuario?.nome}
                    </h2>

                    <p className="text-slate-400 text-sm capitalize">
                      {usuario?.perfil}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3 text-slate-300 bg-slate-900/60 rounded-xl p-3">
                  <Mail size={18} />
                  <span>{usuario?.email}</span>
                </div>

                <div className="flex items-center gap-3 text-slate-300 bg-slate-900/60 rounded-xl p-3">
                  <Shield size={18} />
                  <span>
                    Perfil: {usuario?.perfil}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-slate-300 bg-slate-900/60 rounded-xl p-3">
                  <User size={18} />
                  <span>
                    Setor: {usuario?.setor || 'Não informado'}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-800 p-4">
                <button
                  onClick={sair}
                  className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 transition rounded-2xl py-3 font-semibold shadow-xl"
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