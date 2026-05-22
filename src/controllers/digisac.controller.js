const axios = require('axios')
const pool = require('../database/connection')

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
      params: { limit: 1 }
    })

    res.json({
      conectado: true,
      mensagem: 'Conexão com a Digisac realizada com sucesso',
      dados: response.data
    })
  } catch (error) {
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
    res.status(500).json({
      erro: 'Erro ao listar tickets da Digisac',
      detalhes: error.response?.data || error.message
    })
  }
}

function normalizarLista(dados) {
  if (Array.isArray(dados)) return dados
  if (Array.isArray(dados?.data)) return dados.data
  if (Array.isArray(dados?.items)) return dados.items
  if (Array.isArray(dados?.results)) return dados.results
  return []
}

function extrairTelefone(contato) {
  return (
    contato.phone ||
    contato.number ||
    contato.whatsapp ||
    contato.mobilePhone ||
    contato.data?.phone ||
    'Não informado'
  )
}

async function sincronizarCRM(req, res) {
  try {
    const response = await digisacApi.get('/contacts', {
      params: {
        limit: 100
      }
    })

    const contatos = normalizarLista(response.data)

    let inseridos = 0

    for (const contato of contatos) {
      const nome =
        contato.name ||
        contato.fullName ||
        contato.data?.name ||
        'Contato sem nome'

      const telefone = extrairTelefone(contato)

      const email =
        contato.email ||
        contato.data?.email ||
        null

      await pool.query(
        `
        INSERT INTO crm_atendimentos
        (
          paciente_nome,
          paciente_telefone,
          paciente_email,
          canal,
          motivo_contato,
          status_atendimento,
          data_atendimento,
          observacao
        )
        VALUES
        ($1, $2, $3, $4, $5, $6, CURRENT_DATE, $7)
        `,
        [
          nome,
          telefone,
          email,
          'Digisac',
          'Contato via atendimento virtual',
          'Sincronizado',
          `Contato importado da Digisac. ID origem: ${contato.id || 'não informado'}`
        ]
      )

      inseridos++
    }

    res.json({
      sucesso: true,
      mensagem: 'Sincronização concluída com sucesso',
      total_importados: inseridos
    })
  } catch (error) {
    console.error(error.response?.data || error.message)

    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao sincronizar CRM com a Digisac',
      detalhes: error.response?.data || error.message
    })
  }
}

module.exports = {
  testarConexao,
  listarContatos,
  listarTickets,
  sincronizarCRM
}