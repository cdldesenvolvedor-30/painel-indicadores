import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Activity, Lock, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

import { useAuth } from '../context/AuthContext'

function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const { login } = useAuth()

  async function fazerLogin(e) {
    e.preventDefault()

    setLoading(true)

    const sucesso = await login(email, senha)

    setLoading(false)

    if (sucesso) {
      navigate('/')
    } else {
      toast.error('Email ou senha inválidos')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-4">
      <motion.form
        onSubmit={fazerLogin}
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-700 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4">
            <Activity size={32} />
          </div>

          <h1 className="text-4xl font-bold text-white">
            Painel BI
          </h1>

          <p className="text-slate-400 mt-2 text-center">
            Gestão inteligente de performance
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center gap-3">
            <Mail size={20} className="text-slate-400" />

            <input
              type="email"
              placeholder="Digite seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-transparent outline-none text-white w-full"
              required
            />
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center gap-3">
            <Lock size={20} className="text-slate-400" />

            <input
              type="password"
              placeholder="Digite sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="bg-transparent outline-none text-white w-full"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-60 transition p-4 rounded-2xl font-bold text-white shadow-lg shadow-blue-500/20"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </div>

        <p className="text-center text-slate-500 text-sm mt-8">
          Plataforma interna de gestão operacional
        </p>
      </motion.form>
    </div>
  )
}

export default Login