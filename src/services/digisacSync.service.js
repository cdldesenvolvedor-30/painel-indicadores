const axios = require('axios')
const pool = require('../database/connection')
// sync digisac railway atualizado
const digisacApi = axios.create({
  baseURL: process.env.DIGISAC_API_URL,
  headers: {
    Authorization: `Bearer ${process.env.DIGISAC_TOKEN}`,
    'Content-Type': 'application/json'
  }
})

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

async function sincronizarDigisacCRM() {
  try {
    console.log('🔄 Sincronizando CRM com Digisac...')

    const response = await digisacApi.get('/contacts', {
      params: {
        limit: 100
      }
    })

    const contatos = normalizarLista(response.data)

    let inseridos = 0
    let ignorados = 0

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

      const existe = await pool.query(
        `
        SELECT id
        FROM crm_atendimentos
        WHERE paciente_telefone = $1
          AND canal = 'Digisac'
        LIMIT 1
        `,
        [telefone]
      )

      if (existe.rows.length > 0) {
        ignorados++
        continue
      }

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
          `Contato importado automaticamente da Digisac. ID origem: ${contato.id || 'não informado'}`
        ]
      )

      inseridos++
    }

    console.log(`✅ Sincronização concluída: ${inseridos} novos | ${ignorados} ignorados`)
  } catch (error) {
    console.error('❌ Erro na sincronização automática Digisac:', error.response?.data || error.message)
  }
}

function iniciarSincronizacaoAutomatica() {
  if (!process.env.DIGISAC_API_URL || !process.env.DIGISAC_TOKEN) {
    console.log('⚠️ Integração Digisac não iniciada: variáveis ausentes.')
    return
  }

  console.log('🚀 Sincronização automática Digisac ativada a cada 5 minutos.')

  sincronizarDigisacCRM()

  setInterval(() => {
    sincronizarDigisacCRM()
  }, 5 * 60 * 1000)
}

module.exports = {
  sincronizarDigisacCRM,
  iniciarSincronizacaoAutomatica
}