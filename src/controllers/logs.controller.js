const pool = require('../database/connection')

async function listarLogs(req, res) {
    try {
        const result = await pool.query(`
            SELECT
                l.id,
                u.nome AS usuario,
                u.email,
                l.acao,
                l.data_criacao
            FROM logs l
            LEFT JOIN usuarios u
                ON u.id = l.usuario_id
            ORDER BY l.id DESC
        `)

        res.json(result.rows)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            erro: 'Erro ao listar logs'
        })
    }
}

module.exports = {
    listarLogs
}