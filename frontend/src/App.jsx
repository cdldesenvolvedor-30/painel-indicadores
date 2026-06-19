import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from 'react-router-dom'

import { Toaster } from 'react-hot-toast'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Indicadores from './pages/Indicadores'
import RankingPage from './pages/RankingPage'
import AlertasPage from './pages/AlertasPage'
import Colaboradores from './pages/Colaboradores'
import ColaboradorDetalhes from './pages/ColaboradorDetalhes'
import Metas from './pages/Metas'
import Usuarios from './pages/Usuarios'
import Logs from './pages/Logs'
import MapaPerformance from './pages/MapaPerformance'
import ComparativoMetas from './pages/ComparativoMetas'
import CRM from './pages/CRM'
import Integracoes from './pages/Integracoes'
import AtendimentoCompliance from './pages/AtendimentoCompliance'

import Sidebar from './components/Sidebar'
import ProtectedRoute from './components/ProtectedRoute'

import { AuthProvider } from './context/AuthContext'
import { FiltrosProvider } from './context/FiltrosContext'
import { PlugZap } from 'lucide-react'

function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#020817] text-white">
      <Sidebar />

      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <FiltrosProvider>
        <BrowserRouter>

          <Toaster
            position="top-left"
            toastOptions={{
              duration: 3500,

              style: {
                background: '#020817',
                color: '#ffffff',
                border: '1px solid rgba(59,130,246,0.25)',
                borderRadius: '18px',
                padding: '16px 18px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
                fontSize: '14px',
                fontWeight: '500'
              },

              success: {
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#020817'
                }
              },

              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#020817'
                }
              }
            }}
          />

          <Routes>

            <Route
              path="/"
              element={<Navigate to="/dashboard" replace />}
            />

            <Route
              path="/login"
              element={<Login />}
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/indicadores"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Indicadores />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/ranking"
              element={
                <ProtectedRoute>
                  <Layout>
                    <RankingPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/alertas"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AlertasPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/colaboradores"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Colaboradores />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/colaborador/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ColaboradorDetalhes />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/metas"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Metas />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/usuarios"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Usuarios />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/logs"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Logs />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/mapa-performance"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MapaPerformance />
                  </Layout>
                </ProtectedRoute>
              }
            />

<Route
  path="/comparativo-metas"
  element={
    <ProtectedRoute>
      <Layout>
        <ComparativoMetas />
      </Layout>
    </ProtectedRoute>
  }
/>

<Route
  path="/crm"
  element={
    <ProtectedRoute>
      <Layout>
        <CRM />
      </Layout>
    </ProtectedRoute>
  }
/>

<Route
  path="/integracoes"
  element={
    <ProtectedRoute>
      <Layout>
        <Integracoes />
      </Layout>
    </ProtectedRoute>
  }
/>

<Route
  path="/atendimento-compliance"
  element={
    <ProtectedRoute>
      <Layout>
        <AtendimentoCompliance />
      </Layout>
    </ProtectedRoute>
  }
/>

          </Routes>
        </BrowserRouter>
      </FiltrosProvider>
    </AuthProvider>
  )
}

export default App
