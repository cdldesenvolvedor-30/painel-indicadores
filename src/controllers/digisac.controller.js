const axios = require('axios')

const digisacApi = axios.create({
  baseURL: process.env.DIGISAC_API_URL,
  headers: {
    Authorization: `Bearer ${process.env.DIGISAC_TOKEN}`,
    'Content-Type': 'application/json'
  }
})

async function testarConexao(req, res) {
  try {
    const response = await digisacApi.get('/contacts', {
      params: {
        limit: 1
      }
    })

    res.json({
      conectado: true,
      mensagem: 'Conexão com a Digisac realizada com sucesso',
      dados: response.data
    })
  } catch (error) {
    console.error(error.response?.data || error.message)

    res.status(500).json({
      conectado: false,
      erro: 'Erro ao conectar com a Digisac',
      detalhes: error.response?.data || error.message
    })
  }
}

async function listarContatos(req, res) {
  try {
    const response = await digisacApi.get('/contacts', {
      params: req.query
    })

    res.json(response.data)
  } catch (error) {
    console.error(error.response?.data || error.message)

    res.status(500).json({
      erro: 'Erro ao listar contatos da Digisac',
      detalhes: error.response?.data || error.message
    })
  }
}

async function listarTickets(req, res) {
  try {
    const response = await digisacApi.get('/tickets', {
      params: req.query
    })

    res.json(response.data)
  } catch (error) {
    console.error(error.response?.data || error.message)

    res.status(500).json({
      erro: 'Erro ao listar tickets da Digisac',
      detalhes: error.response?.data || error.message
    })
  }
}

module.exports = {
  testarConexao,
  listarContatos,
  listarTickets
}