const axios = require('axios')
const pool = require('../database/connection')

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

async function prepararTabelaColaboradores() {
  await pool.query(`
    ALTER TABLE colaboradores
    ADD COLUMN IF NOT EXISTS digisac_user_id TEXT,
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS departamento TEXT,
    ADD COLUMN IF NOT EXISTS ultima_sincronizacao_digisac TIMESTAMP
  `)

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS colaboradores_digisac_user_id_idx
    ON colaboradores (digisac_user_id)
    WHERE digisac_user_id IS NOT NULL
  `)
}

async function sincronizarColaboradoresDigisac() {
  try {
    console.log('🔄 Sincronizando colaboradores da Digisac...')

    await prepararTabelaColaboradores()

let usuarios = []
let page = 1
const perPage = 100
let continuar = true

while (continuar) {
  const response = await digisacApi.get('/users', {
    params: {
      page,
      perPage
    }
  })

  const lista = normalizarLista(response.data)

  usuarios = [...usuarios, ...lista]

  console.log(`DEBUG PAGINA USERS: page=${page} total=${lista.length}`)

  if (lista.length < perPage) {
    continuar = false
  } else {
    page++
  }
}

    let sincronizados = 0
    let criados = 0
    let atualizados = 0
    let ignorados = 0

    for (const usuario of usuarios) {
      if (!usuario.id || !usuario.name || !usuario.email) {
        ignorados++
        continue
      }

      if (usuario.deletedAt || usuario.archivedAt || usuario.isClientUser) {
        ignorados++
        continue
      }

      const existente = await pool.query(
        `
        SELECT id
        FROM colaboradores
        WHERE digisac_user_id = $1 OR email = $2
        LIMIT 1
        `,
        [usuario.id, usuario.email]
      )

      if (existente.rows.length > 0) {
        await pool.query(
          `
          UPDATE colaboradores
          SET
            digisac_user_id = $1,
            nome = $2,
            email = $3,
            setor = 'Atendimento',
            cargo = COALESCE(cargo, 'Atendente Digisac'),
            departamento = $4,
            status = colaboradores.status,
            ultima_sincronizacao_digisac = NOW()
          WHERE id = $5
          `,
          [
            usuario.id,
            usuario.name,
            usuario.email,
            usuario.branch || 'Digisac',
            existente.rows[0].id
          ]
        )

        atualizados++
      } else {
        await pool.query(
          `
          INSERT INTO colaboradores
          (
            digisac_user_id,
            nome,
            email,
            setor,
            cargo,
            departamento,
            status,
            ultima_sincronizacao_digisac
          )
          VALUES
          ($1, $2, $3, 'Atendimento', 'Atendente Digisac', $4, 'Ativo', NOW())
          `,
          [
            usuario.id,
            usuario.name,
            usuario.email,
            usuario.branch || 'Digisac'
          ]
        )

        criados++
      }

      sincronizados++
    }

    console.log(
      `✅ Colaboradores Digisac: ${sincronizados} sincronizados | ${criados} criados | ${atualizados} atualizados | ${ignorados} ignorados`
    )
  } catch (error) {
    console.error(
      '❌ Erro ao sincronizar colaboradores Digisac:',
      error.response?.data || error.message
    )
  }
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
      params: { limit: 100 }
    })

    const contatos = normalizarLista(response.data)

    let inseridos = 0
    let ignorados = 0

    for (const contato of contatos) {
      const digisacId = contato.id || contato.uuid || null

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
        WHERE observacao ILIKE $1
        LIMIT 1
        `,
        [`%ID origem: ${digisacId}%`]
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
        ($1, $2, $3, 'Digisac', 'Contato via atendimento virtual', 'Sincronizado', CURRENT_DATE, $4)
        `,
        [
          nome,
          telefone,
          email,
          `Contato importado automaticamente da Digisac. ID origem: ${digisacId || 'não informado'}`
        ]
      )

      inseridos++
    }

    console.log(`✅ Digisac CRM: ${inseridos} novos | ${ignorados} ignorados`)
  } catch (error) {
    console.error(
      '❌ Erro na sincronização automática Digisac:',
      error.response?.data || error.message
    )
  }
}

async function executarSincronizacaoDigisac() {
  await sincronizarDigisacCRM()
  await sincronizarColaboradoresDigisac()
}

function iniciarSincronizacaoAutomatica() {
  if (!process.env.DIGISAC_API_URL || !process.env.DIGISAC_TOKEN) {
    console.log('⚠️ Integração Digisac não iniciada: variáveis ausentes.')
    return
  }

  console.log('🚀 Sincronização automática Digisac ativada a cada 5 minutos.')

  executarSincronizacaoDigisac()

  setInterval(() => {
    executarSincronizacaoDigisac()
  }, 5 * 60 * 1000)
}

module.exports = {
  sincronizarDigisacCRM,
  sincronizarColaboradoresDigisac,
  iniciarSincronizacaoAutomatica
}
