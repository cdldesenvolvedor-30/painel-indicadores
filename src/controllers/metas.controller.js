const pool = require('../database/connection')

async function listarMetas(req, res) {
    try {
        const result = await pool.query(`
            SELECT
                m.id,
                m.colaborador_id,
                c.nome AS colaborador,
                c.setor,
                m.mes,
                m.ano,
                m.meta_atendimentos,
                m.meta_vendas,
                m.meta_valor_vendas,
                m.limite_erros,
                m.data_criacao
            FROM metas m
            INNER JOIN colaboradores c
                ON c.id = m.colaborador_id
            ORDER BY m.ano DESC, m.mes DESC
        `)

        res.json(result.rows)
    } catch (error) {
        console.error(error)
        res.status(500).json({ erro: 'Erro ao listar metas' })
    }
}

async function criarMeta(req, res) {
    try {
        const {
            colaborador_id,
            mes,
            ano,
            meta_atendimentos,
            meta_vendas,
            meta_valor_vendas,
            limite_erros
        } = req.body

        if (!colaborador_id || !mes || !ano) {
            return res.status(400).json({
                erro: 'Colaborador, mês e ano são obrigatórios'
            })
        }

        const result = await pool.query(
            `
            INSERT INTO metas
            (
                colaborador_id,
                mes,
                ano,
                meta_atendimentos,
                meta_vendas,
                meta_valor_vendas,
                limite_erros
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
            `,
            [
                colaborador_id,
                mes,
                ano,
                meta_atendimentos || 0,
                meta_vendas || 0,
                meta_valor_vendas || 0,
                limite_erros || 0
            ]
        )

        await pool.query(
            `
            INSERT INTO logs (usuario_id, acao)
            VALUES ($1, $2)
            `,
            [
                req.usuario.id,
                `Criou meta para colaborador ID ${colaborador_id}`
            ]
        )

        res.status(201).json(result.rows[0])
    } catch (error) {
        console.error(error)
        res.status(500).json({ erro: 'Erro ao criar meta' })
    }
}

async function metasPorColaborador(req, res) {
    try {
        const { id } = req.params

        const result = await pool.query(
            `
            SELECT *
            FROM metas
            WHERE colaborador_id = $1
            ORDER BY ano DESC, mes DESC
            `,
            [id]
        )

        res.json(result.rows)
    } catch (error) {
        console.error(error)
        res.status(500).json({ erro: 'Erro ao buscar metas do colaborador' })
    }
}

async function compararMetaResultado(req, res) {
    try {
        const { mes, ano } = req.query

        if (!mes || !ano) {
            return res.status(400).json({
                erro: 'Mês e ano são obrigatórios'
            })
        }

        const result = await pool.query(`
            SELECT
                c.id AS colaborador_id,
                c.nome AS colaborador,
                c.setor,

                m.meta_atendimentos,
                m.meta_vendas,
                m.meta_valor_vendas,
                m.limite_erros,

                COALESCE(SUM(i.total_atendimentos), 0) AS total_atendimentos,
                COALESCE(SUM(i.total_vendas), 0) AS total_vendas,
                COALESCE(SUM(i.valor_vendas), 0) AS valor_vendas,
                COALESCE(SUM(i.erros), 0) AS total_erros,

                ROUND(
                    CASE
                        WHEN m.meta_atendimentos > 0
                        THEN (COALESCE(SUM(i.total_atendimentos), 0) * 100.0 / m.meta_atendimentos)
                        ELSE 0
                    END,
                    2
                ) AS percentual_atendimentos,

                ROUND(
                    CASE
                        WHEN m.meta_vendas > 0
                        THEN (COALESCE(SUM(i.total_vendas), 0) * 100.0 / m.meta_vendas)
                        ELSE 0
                    END,
                    2
                ) AS percentual_vendas,

                ROUND(
                    CASE
                        WHEN m.meta_valor_vendas > 0
                        THEN (COALESCE(SUM(i.valor_vendas), 0) * 100.0 / m.meta_valor_vendas)
                        ELSE 0
                    END,
                    2
                ) AS percentual_valor_vendas

            FROM metas m

            INNER JOIN colaboradores c
                ON c.id = m.colaborador_id

            LEFT JOIN indicadores i
                ON i.colaborador_id = m.colaborador_id
                AND EXTRACT(MONTH FROM i.data_registro) = m.mes
                AND EXTRACT(YEAR FROM i.data_registro) = m.ano

            WHERE m.mes = $1
              AND m.ano = $2

            GROUP BY
                c.id,
                c.nome,
                c.setor,
                m.meta_atendimentos,
                m.meta_vendas,
                m.meta_valor_vendas,
                m.limite_erros

            ORDER BY percentual_vendas DESC
        `, [mes, ano])

        res.json(result.rows)
    } catch (error) {
        console.error(error)
        res.status(500).json({ erro: 'Erro ao comparar meta e resultado' })
    }
}

module.exports = {
    listarMetas,
    criarMeta,
    metasPorColaborador,
    compararMetaResultado
}