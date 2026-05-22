const express = require('express')

const authRoutes = require('./routes/auth.routes')
const usuariosRoutes = require('./routes/usuarios.routes')
const logsRoutes = require('./routes/logs.routes')
const metasRoutes = require('./routes/metas.routes')
const mapaPerformanceRoutes = require('./routes/mapaPerformance.routes')
const crmRoutes = require('./routes/crm.routes')
const digisacRoutes = require('./routes/digisac.routes')
const colaboradoresRoutes = require('./routes/colaboradores.routes')
const indicadoresRoutes = require('./routes/indicadores.routes')

const app = express()

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }

  next()
})

app.use(express.json())

app.get('/', (req, res) => {
  res.json({
    mensagem: 'Painel de Indicadores Online 🚀'
  })
})

app.use('/auth', authRoutes)
app.use('/usuarios', usuariosRoutes)
app.use('/logs', logsRoutes)
app.use('/metas', metasRoutes)
app.use('/mapa-performance', mapaPerformanceRoutes)
app.use('/crm', crmRoutes)
app.use('/digisac', digisacRoutes)
app.use('/colaboradores', colaboradoresRoutes)
app.use('/indicadores', indicadoresRoutes)

module.exports = app