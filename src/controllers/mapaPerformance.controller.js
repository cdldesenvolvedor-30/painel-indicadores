const pool = require('../database/connection')

function classificar(produtividade, processo) {
    const limiteProdutividade = 150
    const limiteProcesso = 150

    if (produtividade >= limiteProdutividade && processo >= limiteProcesso) {
        return 'Estrela'
    }

    if (produtividade >= limiteProdutividade && processo < limiteProcesso) {
        return 'Santo'
    }

    if (produtividade < limiteProdutividade && processo >= limiteProcesso) {
        return 'Pecador'
    }

    return 'Zumbi'
}

async function listarMapaPerformance(req, res) {
    try {
        const result = await pool.query(`
            SELECT
                mp.id,
                mp.colaborador_id,
                c.nome AS colaborador,
                c.setor,
                c.cargo,
                c.foto_url,
                mp.produtividade,
                mp.processo,
                mp.observacao,
                mp.data_avaliacao,
                CASE
                    WHEN mp.produtividade >= 150 AND mp.processo >= 150 THEN 'Estrela'
                    WHEN mp.produtividade >= 150 AND mp.processo < 150 THEN 'Santo'
                    WHEN mp.produtividade < 150 AND mp.processo >= 150 THEN 'Pecador'
                    ELSE 'Zumbi'
                END AS classificacao
            FROM mapa_performance mp
            INNER JOIN colaboradores c
                ON c.id = mp.colaborador_id
            ORDER BY mp.data_avaliacao DESC, c.nome ASC
        `)

        res.json(result.rows)
    } catch (error) {
        console.error(error)
        res.status(500).json({
            erro: 'Erro ao listar mapa de performance'
        })
    }
}

async function resumoMapaPerformance(req, res) {
    try {
        const result = await pool.query(`
            SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (
                    WHERE produtividade >= 150 AND processo >= 150
                ) AS estrelas,
                COUNT(*) FILTER (
                    WHERE produtividade >= 150 AND processo < 150
                ) AS santos,
                COUNT(*) FILTER (
                    WHERE produtividade < 150 AND processo >= 150
                ) AS pecadores,
                COUNT(*) FILTER (
                    WHERE produtividade < 150 AND processo < 150
                ) AS zumbis
            FROM mapa_performance
        `)

        res.json(result.rows[0])
    } catch (error) {
        console.error(error)
        res.status(500).json({
            erro: 'Erro ao gerar resumo do mapa de performance'
        })
    }
}

async function criarMapaPerformance(req, res) {
    try {
        const {
            colaborador_id,
            produtividade,
            processo,
            observacao,
            data_avaliacao
        } = req.body

        if (!colaborador_id || produtividade === undefined || processo === undefined) {
            return res.status(400).json({
                erro: 'Colaborador, produtividade e processo são obrigatórios'
            })
        }

        const result = await pool.query(
            `
            INSERT INTO mapa_performance
            (
                colaborador_id,
                produtividade,
                processo,
                observacao,
                data_avaliacao
            )
            VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_DATE))
            RETURNING *
            `,
            [
                colaborador_id,
                produtividade,
                processo,
                observacao || null,
                data_avaliacao || null
            ]
        )

        const classificacao = classificar(
            Number(produtividade),
            Number(processo)
        )

        await pool.query(
            `
            INSERT INTO logs (usuario_id, acao)
            VALUES ($1, $2)
            `,
            [
                req.usuario.id,
                `Criou avaliação de mapa de performance para colaborador ID ${colaborador_id} - ${classificacao}`
            ]
        )

        res.status(201).json({
            ...result.rows[0],
            classificacao
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            erro: 'Erro ao criar avaliação de performance'
        })
    }
}

async function atualizarMapaPerformance(req, res) {
    try {
        const { id } = req.params

        const {
            produtividade,
            processo,
            observacao,
            data_avaliacao
        } = req.body

        const result = await pool.query(
            `
            UPDATE mapa_performance
            SET
                produtividade = $1,
                processo = $2,
                observacao = $3,
                data_avaliacao = $4
            WHERE id = $5
            RETURNING *
            `,
            [
                produtividade,
                processo,
                observacao || null,
                data_avaliacao,
                id
            ]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({
                erro: 'Avaliação não encontrada'
            })
        }

        await pool.query(
            `
            INSERT INTO logs (usuario_id, acao)
            VALUES ($1, $2)
            `,
            [
                req.usuario.id,
                `Atualizou avaliação de mapa de performance ID ${id}`
            ]
        )

        res.json(result.rows[0])
    } catch (error) {
        console.error(error)
        res.status(500).json({
            erro: 'Erro ao atualizar avaliação'
        })
    }
}

async function excluirMapaPerformance(req, res) {
    try {
        const { id } = req.params

        await pool.query(
            `
            DELETE FROM mapa_performance
            WHERE id = $1
            `,
            [id]
        )

        await pool.query(
            `
            INSERT INTO logs (usuario_id, acao)
            VALUES ($1, $2)
            `,
            [
                req.usuario.id,
                `Excluiu avaliação de mapa de performance ID ${id}`
            ]
        )

        res.json({
            mensagem: 'Avaliação excluída com sucesso'
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            erro: 'Erro ao excluir avaliação'
        })
    }
}

module.exports = {
    listarMapaPerformance,
    resumoMapaPerformance,
    criarMapaPerformance,
    atualizarMapaPerformance,
    excluirMapaPerformance
}