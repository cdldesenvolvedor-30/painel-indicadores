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
}

async function prepararTabelaCRM() {
  await pool.query(`
    ALTER TABLE crm_atendimentos
    ADD COLUMN IF NOT EXISTS digisac_ticket_id TEXT,
    ADD COLUMN IF NOT EXISTS protocolo TEXT,
    ADD COLUMN IF NOT EXISTS digisac_user_id TEXT,
    ADD COLUMN IF NOT EXISTS digisac_department_id TEXT,
    ADD COLUMN IF NOT EXISTS ultima_sincronizacao_digisac TIMESTAMP
  `)
}

async function buscarColaboradorPorDigisacId(digisacUserId) {
  if (!digisacUserId) return null

  const result = await pool.query(
    `
    SELECT id
    FROM colaboradores
    WHERE digisac_user_id = $1
      AND status = 'Ativo'
    LIMIT 1
    `,
    [digisacUserId]
  )

  return result.rows[0]?.id || null
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

async function sincronizarDigisacCRM() {
  try {
    console.log('🔄 Sincronizando tickets CRM da Digisac...')

    await prepararTabelaCRM()

    let tickets = []
    let skip = 0
    const limit = 100
    const maxTickets = Number(process.env.DIGISAC_TICKETS_LIMIT || 500)
    let continuar = true

    while (continuar && tickets.length < maxTickets) {
      const response = await digisacApi.get('/tickets', {
        params: {
          limit,
          skip
        }
      })

      const lista = normalizarLista(response.data)

      tickets = [...tickets, ...lista]

      if (lista.length < limit) {
        continuar = false
      } else {
        skip += limit
      }
    }

    let inseridos = 0
    let atualizados = 0
    let ignorados = 0

    for (const ticket of tickets) {
      if (!ticket.id || !ticket.protocol) {
        ignorados++
        continue
      }

      const colaboradorId = await buscarColaboradorPorDigisacId(ticket.userId)

      const dataAtendimento = ticket.startedAt
        ? ticket.startedAt.substring(0, 10)
        : new Date().toISOString().substring(0, 10)

      const tempoEspera = Number(ticket.metrics?.waitingTime || 0)
      const tempoAtendimento = Number(
        ticket.metrics?.messagingTime ||
        ticket.metrics?.ticketTime ||
        0
      )

      const statusAtendimento = ticket.isOpen ? 'Aberto' : 'Finalizado'

      const existente = await pool.query(
        `
        SELECT id
        FROM crm_atendimentos
        WHERE digisac_ticket_id = $1 OR protocolo = $2
        LIMIT 1
        `,
        [ticket.id, ticket.protocol]
      )

      if (existente.rows.length > 0) {
        await pool.query(
          `
          UPDATE crm_atendimentos
          SET
            colaborador_id = $1,
            status_atendimento = $2,
            tempo_espera_segundos = $3,
            tempo_atendimento_segundos = $4,
            data_atendimento = $5,
            digisac_user_id = $6,
            digisac_department_id = $7,
            ultima_sincronizacao_digisac = NOW()
          WHERE id = $8
          `,
          [
            colaboradorId,
            statusAtendimento,
            tempoEspera,
            tempoAtendimento,
            dataAtendimento,
            ticket.userId || null,
            ticket.departmentId || null,
            existente.rows[0].id
          ]
        )

        atualizados++
      } else {
        await pool.query(
          `
          INSERT INTO crm_atendimentos
          (
            paciente_nome,
            paciente_telefone,
            paciente_email,
            unidade,
            colaborador_id,
            canal,
            motivo_contato,
            exame_interesse,
            status_atendimento,
            tempo_espera_segundos,
            tempo_atendimento_segundos,
            chamadas_realizadas,
            converteu_venda,
            valor_venda,
            satisfacao,
            observacao,
            data_atendimento,
            digisac_ticket_id,
            protocolo,
            digisac_user_id,
            digisac_department_id,
            ultima_sincronizacao_digisac
          )
          VALUES
          (
            $1, $2, $3, $4, $5,
            'Digisac',
            $6, $7, $8, $9,
            $10, 0, false, 0,
            null, $11, $12,
            $13, $14, $15, $16, NOW()
          )
          `,
          [
            `Ticket ${ticket.protocol}`,
            'Não informado',
            null,
            'Atendimento Virtual',
            colaboradorId,
            ticket.comments || 'Atendimento virtual Digisac',
            null,
            statusAtendimento,
            tempoEspera,
            tempoAtendimento,
            `Ticket importado automaticamente da Digisac. ID: ${ticket.id}`,
            dataAtendimento,
            ticket.id,
            ticket.protocol,
            ticket.userId || null,
            ticket.departmentId || null
          ]
        )

        inseridos++
      }
    }

    console.log(
      `✅ Tickets Digisac CRM: ${inseridos} novos | ${atualizados} atualizados | ${ignorados} ignorados`
    )
  } catch (error) {
    console.error(
      '❌ Erro na sincronização automática dos tickets Digisac:',
      error.response?.data || error.message
    )
  }
}

async function executarSincronizacaoDigisac() {
  await sincronizarColaboradoresDigisac()
  await sincronizarDigisacCRM()
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
