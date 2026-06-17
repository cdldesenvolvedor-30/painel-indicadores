import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import {
  Activity,
  ChevronDown,
  ChevronRight,
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
  Settings
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'

function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { usuario, logout } = useAuth()

  const [aberto, setAberto] = useState('Gestão')

  function sair() {
    logout()
    navigate('/login')
  }

  function alternarGrupo(nome) {
    setAberto(aberto === nome ? '' : nome)
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

        <nav className="space-y-4">
          <Item
            to="/dashboard"
            ativo={location.pathname === '/dashboard'}
            icon={LayoutDashboard}
            texto="Início"
          />

          <GrupoMenu
            titulo="Digestar"
            icon={Database}
            aberto={aberto === 'Digestar'}
            onClick={() => alternarGrupo('Digestar')}
          >
            <Item to="/indicadores" ativo={location.pathname === '/indicadores'} icon={BarChart3} texto="Indicadores" />
            <Item to="/mapa-performance" ativo={location.pathname === '/mapa-performance'} icon={Map} texto="Mapa de Performance" />
            <Item to="/ranking" ativo={location.pathname === '/ranking'} icon={Trophy} texto="Classificação" />
            <Item to="/alertas" ativo={location.pathname === '/alertas'} icon={Bell} texto="Alertas" />
          </GrupoMenu>

          <GrupoMenu
            titulo="Shift"
            icon={Building2}
            aberto={aberto === 'Shift'}
            onClick={() => alternarGrupo('Shift')}
          >
            <Item to="/crm" ativo={location.pathname === '/crm'} icon={MessageSquareMore} texto="CRM Atendimento" />
            <Item to="/comparativo-metas" ativo={location.pathname === '/comparativo-metas'} icon={Target} texto="Meta x Resultado" />
            <Item to="/metas" ativo={location.pathname === '/metas'} icon={Target} texto="Metas/KPIs" />
          </GrupoMenu>

          <GrupoMenu
            titulo="Gestão"
            icon={Settings}
            aberto={aberto === 'Gestão'}
            onClick={() => alternarGrupo('Gestão')}
          >
            <Item to="/colaboradores" ativo={location.pathname === '/colaboradores'} icon={Users} texto="Colaboradores" />
            <Item to="/integracoes" ativo={location.pathname === '/integracoes'} icon={PlugZap} texto="Integrações" />

            {usuario?.perfil === 'admin' && (
              <>
                <Item to="/usuarios" ativo={location.pathname === '/usuarios'} icon={UserCog} texto="Usuários" />
                <Item to="/logs" ativo={location.pathname === '/logs'} icon={FileClock} texto="Auditoria" />
              </>
            )}
          </GrupoMenu>
        </nav>
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

function GrupoMenu({ titulo, icon: Icon, aberto, onClick, children }) {
  return (
    <div>
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-slate-200 hover:bg-slate-800 transition"
      >
        <div className="flex items-center gap-3">
          <Icon size={19} />
          <span className="font-semibold">{titulo}</span>
        </div>

        {aberto ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </button>

      {aberto && (
        <div className="mt-2 ml-3 pl-3 border-l border-blue-500/20 space-y-2">
          {children}
        </div>
      )}
    </div>
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
