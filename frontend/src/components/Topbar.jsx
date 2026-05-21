import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'

import {
  Search,
  Bell,
  CalendarDays,
  User,
  LogOut,
  Shield,
  Mail,
  CheckCheck,
  ArrowLeft,
  Circle
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'

const notificacoesIniciais = [
  {
    id: 1,
    titulo: 'Nova avaliação registrada',
    descricao: 'Mapa de performance atualizado.',
    detalhes: 'Uma nova avaliação foi registrada no Mapa de Performance. Verifique a classificação do colaborador.',
    tempo: 'agora'
  },
  {
    id: 2,
    titulo: 'Meta atingida',
    descricao: 'Equipe CDL Centro bateu a meta.',
    detalhes: 'A unidade CDL Centro atingiu a meta configurada no painel. Acompanhe os indicadores da equipe.',
    tempo: 'agora'
  },
  {
    id: 3,
    titulo: 'Novo alerta operacional',
    descricao: 'Existem indicadores abaixo da meta.',
    detalhes: 'Alguns indicadores estão abaixo do esperado. Verifique atendimentos, vendas, erros, descontos e T.A.T.',
    tempo: 'agora'
  }
]

function Topbar({ titulo }) {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const areaRef = useRef(null)

  const [pesquisa, setPesquisa] = useState('')
  const [abrirNotificacoes, setAbrirNotificacoes] = useState(false)
  const [abrirPerfil, setAbrirPerfil] = useState(false)
  const [notificacaoAberta, setNotificacaoAberta] = useState(null)

  const [notificacoes, setNotificacoes] = useState(() => {
    const lidasSalvas = JSON.parse(localStorage.getItem('notificacoes_lidas') || '[]')

    return notificacoesIniciais.map((item) => ({
      ...item,
      lida: lidasSalvas.includes(item.id)
    }))
  })

  useEffect(() => {
    function fecharAoClicarFora(event) {
      if (areaRef.current && !areaRef.current.contains(event.target)) {
        setAbrirNotificacoes(false)
        setAbrirPerfil(false)
        setNotificacaoAberta(null)
      }
    }

    document.addEventListener('mousedown', fecharAoClicarFora)

    return () => {
      document.removeEventListener('mousedown', fecharAoClicarFora)
    }
  }, [])

  function salvarLidas(lista) {
    const idsLidas = lista
      .filter((item) => item.lida)
      .map((item) => item.id)

    localStorage.setItem('notificacoes_lidas', JSON.stringify(idsLidas))
  }

  const naoLidas = notificacoes.filter((item) => !item.lida).length

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

  function abrirNotificacao(item) {
    setNotificacaoAberta(item)

    const atualizadas = notificacoes.map((notificacao) =>
      notificacao.id === item.id
        ? { ...notificacao, lida: true }
        : notificacao
    )

    setNotificacoes(atualizadas)
    salvarLidas(atualizadas)
  }

  function marcarTodasComoLidas() {
    const atualizadas = notificacoes.map((notificacao) => ({
      ...notificacao,
      lida: true
    }))

    setNotificacoes(atualizadas)
    salvarLidas(atualizadas)
    setNotificacaoAberta(null)
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

      <div ref={areaRef} className="flex items-center gap-4 relative">
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
            <Search size={20} className="text-slate-400 hover:text-blue-400 transition" />
          </button>
        </form>

        <div className="relative">
          <button
            onClick={() => {
              setAbrirNotificacoes(!abrirNotificacoes)
              setAbrirPerfil(false)
              setNotificacaoAberta(null)
            }}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-3 relative hover:bg-slate-800 transition shadow-xl"
          >
            <Bell size={22} />

            {naoLidas > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-lg">
                {naoLidas}
              </span>
            )}
          </button>

          {abrirNotificacoes && (
            <div className="absolute right-0 mt-3 w-[430px] bg-[#020817]/95 backdrop-blur-xl border border-blue-500/20 rounded-[24px] shadow-[0_25px_80px_rgba(0,0,0,0.55)] z-50 overflow-hidden">
              {!notificacaoAberta ? (
                <>
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
                        {naoLidas} não lidas
                      </span>
                    </div>
                  </div>

                  <div className="p-3 space-y-3 max-h-96 overflow-y-auto">
                    {notificacoes.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => abrirNotificacao(item)}
                        className={`w-full text-left group border rounded-2xl p-4 transition ${
                          item.lida
                            ? 'bg-slate-950/40 border-slate-800 opacity-70'
                            : 'bg-slate-950/80 border-blue-500/30 hover:border-blue-500/60 hover:bg-blue-950/20'
                        }`}
                      >
                        <div className="flex gap-4">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                            item.lida
                              ? 'bg-slate-800 text-slate-500'
                              : 'bg-blue-500/15 text-blue-400'
                          }`}
                          >
                            <Bell size={20} />
                          </div>

                          <div className="flex-1">
                            <div className="flex justify-between gap-3">
                              <div className="flex items-center gap-2">
                                {!item.lida && (
                                  <Circle size={8} className="fill-blue-400 text-blue-400" />
                                )}

                                <p className="font-bold">
                                  {item.titulo}
                                </p>
                              </div>

                              <span className="text-xs text-slate-500">
                                {item.tempo}
                              </span>
                            </div>

                            <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                              {item.descricao}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="p-4 border-t border-slate-800">
                    <button
                      onClick={marcarTodasComoLidas}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 transition rounded-2xl py-3 font-bold shadow-xl"
                    >
                      <CheckCheck size={18} />
                      Marcar todas como lidas
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-blue-600/15 to-transparent">
                    <button
                      onClick={() => setNotificacaoAberta(null)}
                      className="flex items-center gap-2 text-slate-400 hover:text-white transition mb-4"
                    >
                      <ArrowLeft size={18} />
                      Voltar
                    </button>

                    <h2 className="font-bold text-xl">
                      {notificacaoAberta.titulo}
                    </h2>

                    <p className="text-slate-400 text-sm mt-1">
                      Recebida {notificacaoAberta.tempo}
                    </p>
                  </div>

                  <div className="p-5">
                    <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5">
                      <p className="text-slate-300 leading-relaxed">
                        {notificacaoAberta.detalhes}
                      </p>
                    </div>

                    <div className="mt-5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-2xl p-4 flex items-center gap-3">
                      <CheckCheck size={20} />
                      Esta notificação foi marcada como lida.
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setAbrirPerfil(!abrirPerfil)
              setAbrirNotificacoes(false)
              setNotificacaoAberta(null)
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
                  <span>Perfil: {usuario?.perfil}</span>
                </div>

                <div className="flex items-center gap-3 text-slate-300 bg-slate-900/60 rounded-xl p-3">
                  <User size={18} />
                  <span>Setor: {usuario?.setor || 'Não informado'}</span>
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