const express = require('express')
const cors = require('cors')

const app = express()

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json())

app.get('/', (req, res) => {
  res.status(200).json({
    mensagem: 'Painel de Indicadores Online 🚀'
  })
})

module.exports = app
