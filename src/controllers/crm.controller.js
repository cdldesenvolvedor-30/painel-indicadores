const pool = require('../database/connection')

function montarFiltros(query) {
    const {
        inicio,
        fim,
        unidade,
        colaboradorId,
        motivo,
        sexo,
        exame
    } = query

    const condicoes = []
    const valores = []

    if (inicio && fim) {
        valores.push(inicio, fim)
        condicoes.push(`ca.data_atendimento BETWEEN $${valores.length - 1} AND $${valores.length}`)
    }

    if (unidade) {
        valores.push(unidade)
        condicoes.push(`ca.unidade = $${valores.length}`)
    }

    if (colaboradorId) {
        valores.push(colaboradorId)
        condicoes.push(`ca.colaborador_id = $${valores.length}`)
    }

    if (motivo) {
        valores.push(motivo)
        condicoes.push(`ca.motivo_contato = $${valores.length}`)
    }

    if (sexo) {
        valores.push(sexo)
        condicoes.push(`ca.sexo = $${valores.length}`)
    }

    if (exame) {
        valores.push(`%${exame}%`)
        condicoes.push(`ca.exame_interesse ILIKE $${valores.length}`)
    }

    return {
        where: condicoes.length > 0
            ? `WHERE ${condicoes.join(' AND ')}`
            : '',
        valores
    }
}

async function listarAtendimentos(req, res) {
    try {
        const { where, valores } = montarFiltros(req.query)

        const result = await pool.query(`
            SELECT
                ca.id,
                ca.paciente_nome,
                ca.paciente_telefone,
                ca.paciente_email,
                ca.sexo,
                ca.idade,
                ca.segmento,
                ca.unidade,
                ca.colaborador_id,
                c.nome AS colaborador,
                c.foto_url,
                ca.canal,
                ca.motivo_contato,
                ca.exame_interesse,
                ca.status_atendimento,
                ca.tempo_espera_segundos,
                ca.tempo_atendimento_segundos,
                ca.chamadas_realizadas,
                ca.converteu_venda,
                ca.valor_venda,
                ca.satisfacao,
                ca.observacao,
                ca.data_atendimento,
                ca.data_criacao
            FROM crm_atendimentos ca
            LEFT JOIN colaboradores c
                ON c.id = ca.colaborador_id
            ${where}
            ORDER BY ca.data_atendimento DESC, ca.id DESC
        `, valores)

        res.json(result.rows)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            erro: 'Erro ao listar atendimentos do CRM'
        })
    }
}

async function resumoCRM(req, res) {
    try {
        const { where, valores } = montarFiltros(req.query)

        const result = await pool.query(`
            SELECT
                COUNT(*) AS total_contatos,
                COALESCE(ROUND(AVG(ca.tempo_espera_segundos), 2), 0) AS tempo_medio_espera,
                COALESCE(ROUND(AVG(ca.tempo_atendimento_segundos), 2), 0) AS tempo_medio_atendimento,
                COALESCE(SUM(ca.chamadas_realizadas), 0) AS total_chamadas,
                COALESCE(SUM(ca.valor_venda), 0) AS valor_total_vendas,
                COUNT(*) FILTER (WHERE ca.converteu_venda = true) AS total_convertidos,
                COALESCE(ROUND(AVG(ca.satisfacao), 2), 0) AS satisfacao_media
            FROM crm_atendimentos ca
            LEFT JOIN colaboradores c
                ON c.id = ca.colaborador_id
            ${where}
        `, valores)

        res.json(result.rows[0])
    } catch (error) {
        console.error(error)

        res.status(500).json({
            erro: 'Erro ao gerar resumo do CRM'
        })
    }
}

async function triagemCRM(req, res) {
    try {
        const { where, valores } = montarFiltros(req.query)

        const result = await pool.query(`
            SELECT
                ca.motivo_contato,
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE ca.converteu_venda = true) AS convertidos,
                COALESCE(SUM(ca.valor_venda), 0) AS valor_total
            FROM crm_atendimentos ca
            LEFT JOIN colaboradores c
                ON c.id = ca.colaborador_id
            ${where}
            GROUP BY ca.motivo_contato
            ORDER BY total DESC
        `, valores)

        res.json(result.rows)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            erro: 'Erro ao gerar triagem do CRM'
        })
    }
}

async function examesCRM(req, res) {
    try {
        const { where, valores } = montarFiltros(req.query)

        const result = await pool.query(`
            SELECT
                COALESCE(ca.exame_interesse, 'Não informado') AS exame,
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE ca.converteu_venda = true) AS convertidos
            FROM crm_atendimentos ca
            LEFT JOIN colaboradores c
                ON c.id = ca.colaborador_id
            ${where}
            GROUP BY ca.exame_interesse
            ORDER BY total DESC
            LIMIT 20
        `, valores)

        res.json(result.rows)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            erro: 'Erro ao listar exames de interesse'
        })
    }
}

async function performanceCRM(req, res) {
    try {
        const { where, valores } = montarFiltros(req.query)

        const result = await pool.query(`
            SELECT
                ca.unidade,
                ca.colaborador_id,
                c.nome AS colaborador,
                c.foto_url,
                COUNT(*) AS total_atendimentos,
                COALESCE(ROUND(AVG(ca.tempo_espera_segundos), 2), 0) AS tempo_medio_espera,
                COALESCE(ROUND(AVG(ca.tempo_atendimento_segundos), 2), 0) AS tempo_medio_atendimento,
                COALESCE(SUM(ca.chamadas_realizadas), 0) AS chamadas,
                COUNT(*) FILTER (WHERE ca.converteu_venda = true) AS convertidos,
                COALESCE(SUM(ca.valor_venda), 0) AS valor_total,
                COALESCE(ROUND(AVG(ca.satisfacao), 2), 0) AS satisfacao_media
            FROM crm_atendimentos ca
            LEFT JOIN colaboradores c
                ON c.id = ca.colaborador_id
            ${where}
            GROUP BY ca.unidade, ca.colaborador_id, c.nome, c.foto_url
            ORDER BY total_atendimentos DESC
        `, valores)

        res.json(result.rows)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            erro: 'Erro ao gerar performance do CRM'
        })
    }
}

async function criarAtendimento(req, res) {
    try {
        const {
            paciente_nome,
            paciente_telefone,
            paciente_email,
            sexo,
            idade,
            segmento,
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
            data_atendimento
        } = req.body

        if (!paciente_nome || !paciente_telefone || !unidade || !motivo_contato) {
            return res.status(400).json({
                erro: 'Paciente, telefone, unidade e motivo são obrigatórios'
            })
        }

        const result = await pool.query(
            `
            INSERT INTO crm_atendimentos
            (
                paciente_nome,
                paciente_telefone,
                paciente_email,
                sexo,
                idade,
                segmento,
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
                data_atendimento
            )
            VALUES
            (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15,
                $16, $17, $18, $19,
                COALESCE($20, CURRENT_DATE)
            )
            RETURNING *
            `,
            [
                paciente_nome,
                paciente_telefone,
                paciente_email || null,
                sexo || null,
                idade || null,
                segmento || null,
                unidade,
                colaborador_id || null,
                canal || 'WhatsApp',
                motivo_contato,
                exame_interesse || null,
                status_atendimento || 'Aberto',
                tempo_espera_segundos || 0,
                tempo_atendimento_segundos || 0,
                chamadas_realizadas || 0,
                converteu_venda || false,
                valor_venda || 0,
                satisfacao || null,
                observacao || null,
                data_atendimento || null
            ]
        )

        await pool.query(
            `
            INSERT INTO logs (usuario_id, acao)
            VALUES ($1, $2)
            `,
            [
                req.usuario.id,
                `Criou atendimento CRM para ${paciente_nome}`
            ]
        )

        res.status(201).json(result.rows[0])
    } catch (error) {
        console.error(error)

        res.status(500).json({
            erro: 'Erro ao criar atendimento CRM'
        })
    }
}

module.exports = {
    listarAtendimentos,
    resumoCRM,
    triagemCRM,
    examesCRM,
    performanceCRM,
    criarAtendimento
}