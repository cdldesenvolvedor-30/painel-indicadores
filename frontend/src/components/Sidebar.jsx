import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import {
  Activity,
  ArrowLeft,
  LayoutDashboard,
  BarChart3,
  Target,
  Trophy,
  Bell,
  Users,
  UserCog,
  FileClock,
  LogOut,
  Map,
  MessageSquareMore,
  PlugZap,
  Building2,
  Database,
  Settings,
  ChevronRight,
  ClipboardCheck,
  BriefcaseBusiness,
  WalletCards
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'

function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { usuario, logout } = useAuth()

  const [menuAtual, setMenuAtual] = useState(null)

  function sair() {
    logout()
    navigate('/login')
  }

  const menus = {
    Digisac: {
      icon: Database,
      itens: [
        { to: '/indicadores', texto: 'Indicadores', icon: BarChart3 },
        { to: '/mapa-performance', texto: 'Mapa de Performance', icon: Map },
        { to: '/ranking', texto: 'Classificação', icon: Trophy },
        { to: '/alertas', texto: 'Alertas', icon: Bell },
        { to: '/crm', texto: 'CRM Atendimento', icon: MessageSquareMore },
        { to: '/comparativo-metas', texto: 'Meta x Resultado', icon: Target },
        { to: '/metas', texto: 'Metas/KPIs', icon: Target }
      ]
    },

    Shift: {
      icon: Building2,
      itens: []
    },

    Atendimento: {
  icon: ClipboardCheck,
  itens: [
    {
      to: '/atendimento-compliance',
      texto: 'Compliance das Unidades',
      icon: ClipboardCheck
    }
  ]
},
    
    Gestão: {
      icon: Settings,
      itens: [
        { to: '/colaboradores', texto: 'Colaboradores', icon: Users },
        { to: '/integracoes', texto: 'Integrações', icon: PlugZap },
        ...(usuario?.perfil === 'admin'
          ? [
              { to: '/usuarios', texto: 'Usuários', icon: UserCog },
              { to: '/logs', texto: 'Auditoria', icon: FileClock }
            ]
          : [])
      ]
    },

       Diretoria: {
  icon: BriefcaseBusiness,
  itens: [
    {
      to: '/ox360-financeiro',
      texto: 'OX360 Financeiro',
      icon: WalletCards
    }
  ]
}
}
  
  return (
    <aside className="w-72 min-h-screen bg-[#050b18] border-r border-blue-500/10 p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 mb-10">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Activity size={24} />
          </div>

          <div>
            <h1 className="text-2xl font-bold">Painel BI</h1>
            <p className="text-sm text-slate-400">Gestão de Indicadores</p>
          </div>
        </div>

        {!menuAtual ? (
          <nav className="space-y-3">
            <Item
              to="/dashboard"
              ativo={location.pathname === '/dashboard'}
              icon={LayoutDashboard}
              texto="Início"
            />

            {Object.entries(menus).map(([nome, menu]) => (
              <BotaoMenu
                key={nome}
                texto={nome}
                icon={menu.icon}
                onClick={() => setMenuAtual(nome)}
              />
            ))}
          </nav>
        ) : (
          <nav className="space-y-3">
            <button
              onClick={() => setMenuAtual(null)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 transition mb-5"
            >
              <ArrowLeft size={18} />
              <span className="font-medium">Voltar</span>
            </button>

            <div className="mb-5">
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">
                INDICADORES
              </p>

              <h2 className="text-xl font-bold text-white">
                {menuAtual}
              </h2>
            </div>

            {menus[menuAtual].itens.length === 0 && (
              <div className="mt-8 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-center">
                <p className="text-slate-300 font-semibold">
                  Nenhum indicador cadastrado
                </p>

                <p className="text-slate-500 text-sm mt-2">
                  Os indicadores deste módulo serão adicionados futuramente.
                </p>
              </div>
            )}

            {menus[menuAtual].itens.map((item) => (
              <Item
                key={item.to}
                to={item.to}
                ativo={location.pathname === item.to}
                icon={item.icon}
                texto={item.texto}
              />
            ))}
          </nav>
        )}
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center font-bold">
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
            <p className="font-bold truncate">{usuario?.nome}</p>
            <p className="text-xs text-slate-400 truncate">{usuario?.email}</p>
          </div>
        </div>

        <button
          onClick={sair}
          className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-400 p-3 rounded-xl hover:bg-red-500/20 transition"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  )
}

function BotaoMenu({ texto, icon: Icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-slate-200 hover:bg-slate-800 transition"
    >
      <div className="flex items-center gap-3">
        <Icon size={19} />
        <span className="font-semibold">{texto}</span>
      </div>

      <ChevronRight size={18} />
    </button>
  )
}

function Item({ to, texto, icon: Icon, ativo }) {
  return (
    <Link to={to}>
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
          ativo
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
            : 'text-slate-300 hover:bg-slate-800'
        }`}
      >
        <Icon size={18} />
        <span className="font-medium">{texto}</span>
      </div>
    </Link>
  )
}

export default Sidebar
