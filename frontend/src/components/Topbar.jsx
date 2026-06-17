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
  Circle,
  Settings,
  Building2,
  Crown,
  Camera,
  X,
  Save,
  Lock
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'

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
  const { usuario, logout, atualizarUsuarioLocal } = useAuth()
  const navigate = useNavigate()
  const areaRef = useRef(null)

  const [pesquisa, setPesquisa] = useState('')
  const [abrirNotificacoes, setAbrirNotificacoes] = useState(false)
  const [abrirPerfil, setAbrirPerfil] = useState(false)
  const [notificacaoAberta, setNotificacaoAberta] = useState(null)
  const [modalPerfilAberto, setModalPerfilAberto] = useState(false)
  const [perfilForm, setPerfilForm] = useState({
    nome: '',
    email: '',
    setor: '',
    novaSenha: '',
    confirmarSenha: '',
    foto_url: ''
  })

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


  function abrirModalMeuPerfil() {
    setPerfilForm({
      nome: usuario?.nome || '',
      email: usuario?.email || '',
      setor: usuario?.setor || '',
      novaSenha: '',
      confirmarSenha: '',
      foto_url: usuario?.foto_url || ''
    })

    setAbrirPerfil(false)
    setModalPerfilAberto(true)
  }

  function redimensionarImagem(file, maxWidth = 500, qualidade = 0.7) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      const img = new Image()

      reader.onload = (event) => {
        img.src = event.target.result
      }

      img.onload = () => {
        const canvas = document.createElement('canvas')
        const scale = Math.min(maxWidth / img.width, 1)

        canvas.width = img.width * scale
        canvas.height = img.height * scale

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        resolve(canvas.toDataURL('image/jpeg', qualidade))
      }

      img.onerror = reject
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function selecionarFotoPerfil(event) {
    const file = event.target.files?.[0]

    if (!file) return

    try {
      const fotoComprimida = await redimensionarImagem(file)

      setPerfilForm((form) => ({
        ...form,
        foto_url: fotoComprimida
      }))
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar a foto')
    }
  }

  async function salvarMeuPerfil() {
    if (!perfilForm.nome.trim() || !perfilForm.email.trim()) {
      toast.error('Nome e e-mail são obrigatórios')
      return
    }

    if (perfilForm.novaSenha || perfilForm.confirmarSenha) {
      if (perfilForm.novaSenha.length < 6) {
        toast.error('A nova senha precisa ter pelo menos 6 caracteres')
        return
      }

      if (perfilForm.novaSenha !== perfilForm.confirmarSenha) {
        toast.error('As senhas não conferem')
        return
      }
    }

    try {
      const response = await api.patch('/usuarios/meu-perfil', {
        nome: perfilForm.nome,
        email: perfilForm.email,
        setor: perfilForm.setor,
        foto_url: perfilForm.foto_url,
        novaSenha: perfilForm.novaSenha || null
      })

      atualizarUsuarioLocal(response.data.usuario)
      setModalPerfilAberto(false)
      toast.success('Perfil atualizado com sucesso')
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.erro || 'Erro ao atualizar perfil')
    }
  }

  return (
    <div className="flex justify-between items-start mb-8 relative">
      <div>
        <h1 className="text-4xl font-bold">{titulo}</h1>

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
                        <h2 className="font-bold text-xl">Central de Notificações</h2>
                        <p className="text-slate-400 text-sm mt-1">Atualizações importantes do sistema</p>
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
                          <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
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

                                <p className="font-bold">{item.titulo}</p>
                              </div>

                              <span className="text-xs text-slate-500">{item.tempo}</span>
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

                    <h2 className="font-bold text-xl">{notificacaoAberta.titulo}</h2>

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
            className="bg-blue-600 w-11 h-11 rounded-full overflow-hidden flex items-center justify-center font-bold hover:scale-105 transition shadow-xl ring-2 ring-blue-500/30"
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
            <div className="absolute right-0 mt-3 w-[370px] bg-[#020817]/95 backdrop-blur-xl border border-blue-500/20 rounded-[28px] shadow-[0_25px_80px_rgba(0,0,0,0.60)] z-50 overflow-hidden">
              <div className="relative p-6 border-b border-slate-800 bg-gradient-to-br from-blue-600/25 via-blue-950/25 to-transparent">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full" />

                <div className="relative flex items-center gap-4">
                  <div className="w-20 h-20 rounded-3xl overflow-hidden bg-blue-600 flex items-center justify-center text-3xl font-bold shadow-2xl ring-4 ring-blue-500/20">
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

                  <div className="min-w-0">
                    <h2 className="font-bold text-2xl truncate">
                      {usuario?.nome}
                    </h2>

                    <p className="text-slate-400 text-sm truncate">
                      {usuario?.email}
                    </p>

                    <span className="inline-flex items-center gap-2 mt-3 bg-blue-500/15 text-blue-400 px-3 py-1 rounded-full text-xs font-bold capitalize">
                      <Crown size={13} />
                      {usuario?.perfil}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-3">
                <InfoPerfil icon={Mail} titulo="E-mail" valor={usuario?.email || 'Não informado'} />
                <InfoPerfil icon={Shield} titulo="Perfil" valor={usuario?.perfil || 'Não informado'} />
                <InfoPerfil icon={Building2} titulo="Setor" valor={usuario?.setor || 'Não informado'} />

                <button
                  onClick={abrirModalMeuPerfil}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600/15 text-blue-400 hover:bg-blue-600/25 transition rounded-2xl py-3 font-bold"
                >
                  <Settings size={18} />
                  Meu perfil
                </button>
              </div>

              <div className="border-t border-slate-800 p-4">
                <button
                  onClick={sair}
                  className="w-full flex items-center justify-center gap-2 bg-red-500/90 hover:bg-red-600 transition rounded-2xl py-3 font-semibold shadow-xl"
                >
                  <LogOut size={18} />
                  Sair da conta
                </button>
              </div>
            </div>
          )}
        </div>
      </div>


      {modalPerfilAberto && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-2xl bg-[#050b18] border border-blue-500/20 rounded-[32px] shadow-[0_30px_90px_rgba(0,0,0,0.65)] overflow-hidden">
            <div className="relative p-7 border-b border-slate-800 bg-gradient-to-br from-blue-600/25 via-blue-950/25 to-transparent">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/20 blur-3xl rounded-full" />

              <div className="relative flex items-start justify-between gap-5">
                <div>
                  <p className="text-blue-400 font-bold mb-2">Meu perfil</p>
                  <h2 className="text-3xl font-bold">Editar informações</h2>
                  <p className="text-slate-400 mt-2">Atualize seus dados, foto e senha de acesso.</p>
                </div>

                <button
                  onClick={() => setModalPerfilAberto(false)}
                  className="w-11 h-11 rounded-2xl bg-slate-950/70 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition flex items-center justify-center"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-7 space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  <div className="w-28 h-28 rounded-3xl overflow-hidden bg-blue-600 flex items-center justify-center text-4xl font-bold ring-4 ring-blue-500/20 shadow-2xl">
                    {perfilForm.foto_url ? (
                      <img
                        src={perfilForm.foto_url}
                        alt={perfilForm.nome}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      perfilForm.nome?.charAt(0) || 'U'
                    )}
                  </div>

                  <label className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-blue-600 hover:bg-blue-500 cursor-pointer flex items-center justify-center shadow-xl transition">
                    <Camera size={18} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={selecionarFotoPerfil}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CampoPerfil
                    label="Nome"
                    value={perfilForm.nome}
                    onChange={(e) => setPerfilForm({ ...perfilForm, nome: e.target.value })}
                  />

                  <CampoPerfil
                    label="E-mail"
                    type="email"
                    value={perfilForm.email}
                    onChange={(e) => setPerfilForm({ ...perfilForm, email: e.target.value })}
                  />

                  <CampoPerfil
                    label="Setor"
                    value={perfilForm.setor}
                    onChange={(e) => setPerfilForm({ ...perfilForm, setor: e.target.value })}
                  />

                  <div className="bg-slate-950/70 border border-slate-800 rounded-2xl px-4 py-3">
                    <p className="text-xs text-slate-500 mb-1">Perfil de acesso</p>
                    <p className="font-bold text-slate-200 capitalize">{usuario?.perfil || 'Não informado'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/50 border border-slate-800 rounded-[24px] p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                    <Lock size={18} />
                  </div>

                  <div>
                    <h3 className="font-bold">Redefinir senha</h3>
                    <p className="text-slate-500 text-sm">Preencha somente se quiser alterar sua senha.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CampoPerfil
                    label="Nova senha"
                    type="password"
                    value={perfilForm.novaSenha}
                    onChange={(e) => setPerfilForm({ ...perfilForm, novaSenha: e.target.value })}
                  />

                  <CampoPerfil
                    label="Confirmar nova senha"
                    type="password"
                    value={perfilForm.confirmarSenha}
                    onChange={(e) => setPerfilForm({ ...perfilForm, confirmarSenha: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setModalPerfilAberto(false)}
                  className="flex-1 bg-slate-800 text-slate-300 py-4 rounded-2xl font-bold hover:bg-slate-700 transition"
                >
                  Cancelar
                </button>

                <button
                  onClick={salvarMeuPerfil}
                  className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-500 transition shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  Salvar alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="absolute right-10 top-16 hidden xl:flex items-center gap-2 text-slate-400">
        <CalendarDays size={18} />

        <span className="capitalize">
          {dataAtual}
        </span>
      </div>
    </div>
  )
}

function CampoPerfil({ label, type = 'text', value, onChange }) {
  return (
    <div>
      <label className="text-xs text-slate-500 mb-2 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full bg-slate-950/70 border border-slate-800 rounded-2xl px-4 py-3 text-white outline-none focus:border-blue-500 transition"
      />
    </div>
  )
}

function InfoPerfil({ icon: Icon, titulo, valor }) {
  return (
    <div className="flex items-center gap-3 bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
      <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
        <Icon size={18} />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-slate-500">{titulo}</p>
        <p className="font-semibold text-slate-200 truncate">{valor}</p>
      </div>
    </div>
  )
}

export default Topbar
