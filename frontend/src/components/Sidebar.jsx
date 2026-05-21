import { Link, useLocation, useNavigate } from 'react-router-dom'

import {
  Activity,
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
  MessageSquareMore

} from 'lucide-react'

import { useAuth } from '../context/AuthContext'

function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { usuario, logout } = useAuth()

  function sair() {
    logout()
    navigate('/login')
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
            <p className="text-sm text-slate-400">Gestão de Performance</p>
          </div>
        </div>

        <nav className="space-y-7">
          <Grupo titulo="Operação">
            <Item to="/" ativo={location.pathname === '/'} icon={LayoutDashboard} texto="Painel" />
            <Item to="/indicadores" ativo={location.pathname === '/indicadores'} icon={BarChart3} texto="Indicadores" />
            <Item to="/comparativo-metas" ativo={location.pathname === '/comparativo-metas'} icon={Target} texto="Meta x Resultado" />
            <Item to="/ranking" ativo={location.pathname === '/ranking'} icon={Trophy} texto="Classificação" />
            <Item to="/alertas" ativo={location.pathname === '/alertas'} icon={Bell} texto="Alertas" />
            <Item to="/mapa-performance" ativo={location.pathname === '/mapa-performance'} icon={Map}  texto="Mapa de Performance" />
            <Item to="/crm" ativo={location.pathname === '/crm'} icon={MessageSquareMore} texto="CRM" />

          </Grupo>

          <Grupo titulo="Gestão">
            <Item to="/colaboradores" ativo={location.pathname === '/colaboradores'} icon={Users} texto="Colaboradores" />
            <Item to="/metas" ativo={location.pathname === '/metas'} icon={Target} texto="Metas/KPIs" />
          </Grupo>

          {usuario?.perfil === 'admin' && (
            <Grupo titulo="Administração">
              <Item to="/usuarios" ativo={location.pathname === '/usuarios'} icon={UserCog} texto="Usuários" />
              <Item to="/logs" ativo={location.pathname === '/logs'} icon={FileClock} texto="Auditoria" />
            </Grupo>
          )}
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

function Grupo({ titulo, children }) {
  return (
    <div>
      <p className="text-xs text-slate-500 uppercase font-bold mb-3">
        {titulo}
      </p>

      <div className="space-y-2">
        {children}
      </div>
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
        <Icon size={19} />
        <span className="font-medium">{texto}</span>
      </div>
    </Link>
  )
}

export default Sidebar