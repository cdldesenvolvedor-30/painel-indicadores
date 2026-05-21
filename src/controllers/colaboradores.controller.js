const pool = require('../database/connection')

async function listarColaboradores(req, res) {
    try {
        const result = await pool.query(`
            SELECT
                id,
                nome,
                setor,
                cargo,
                status,
                foto_url,
                data_criacao
            FROM colaboradores
            ORDER BY id ASC
        `)

        res.json(result.rows)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            erro: 'Erro ao listar colaboradores'
        })
    }
}

async function criarColaborador(req, res) {
    try {
        const { nome, setor, cargo } = req.body

        if (!nome || !setor || !cargo) {
            return res.status(400).json({
                erro: 'Nome, setor e cargo são obrigatórios'
            })
        }

        const result = await pool.query(
            `
            INSERT INTO colaboradores
            (nome, setor, cargo, status)
            VALUES ($1, $2, $3, 'Ativo')
            RETURNING *
            `,
            [nome, setor, cargo]
        )

        await pool.query(
            `
            INSERT INTO logs (usuario_id, acao)
            VALUES ($1, $2)
            `,
            [
                req.usuario.id,
                `Criou colaborador ${nome}`
            ]
        )

        res.status(201).json(result.rows[0])
    } catch (error) {
        console.error(error)

        res.status(500).json({
            erro: 'Erro ao criar colaborador'
        })
    }
}

async function atualizarColaborador(req, res) {
    try {
        const { id } = req.params
        const { nome, setor, cargo, status } = req.body

        if (!nome || !setor || !cargo || !status) {
            return res.status(400).json({
                erro: 'Nome, setor, cargo e status são obrigatórios'
            })
        }

        const result = await pool.query(
            `
            UPDATE colaboradores
            SET
                nome = $1,
                setor = $2,
                cargo = $3,
                status = $4
            WHERE id = $5
            RETURNING *
            `,
            [nome, setor, cargo, status, id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({
                erro: 'Colaborador não encontrado'
            })
        }

        await pool.query(
            `
            INSERT INTO logs (usuario_id, acao)
            VALUES ($1, $2)
            `,
            [
                req.usuario.id,
                `Atualizou colaborador ID ${id}`
            ]
        )

        res.json(result.rows[0])
    } catch (error) {
        console.error(error)

        res.status(500).json({
            erro: 'Erro ao atualizar colaborador'
        })
    }
}

async function alterarStatusColaborador(req, res) {
    try {
        const { id } = req.params
        const { status } = req.body

        if (!['Ativo', 'Inativo'].includes(status)) {
            return res.status(400).json({
                erro: 'Status inválido'
            })
        }

        const result = await pool.query(
            `
            UPDATE colaboradores
            SET status = $1
            WHERE id = $2
            RETURNING *
            `,
            [status, id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({
                erro: 'Colaborador não encontrado'
            })
        }

        await pool.query(
            `
            INSERT INTO logs (usuario_id, acao)
            VALUES ($1, $2)
            `,
            [
                req.usuario.id,
                `${status === 'Ativo' ? 'Ativou' : 'Inativou'} colaborador ID ${id}`
            ]
        )

        res.json(result.rows[0])
    } catch (error) {
        console.error(error)

        res.status(500).json({
            erro: 'Erro ao alterar status do colaborador'
        })
    }
}

async function atualizarFotoColaborador(req, res) {
    try {
        const { id } = req.params
        const { foto_url } = req.body

        if (!foto_url) {
            return res.status(400).json({
                erro: 'Foto é obrigatória'
            })
        }

        const result = await pool.query(
            `
            UPDATE colaboradores
            SET foto_url = $1
            WHERE id = $2
            RETURNING *
            `,
            [foto_url, id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({
                erro: 'Colaborador não encontrado'
            })
        }

        await pool.query(
            `
            INSERT INTO logs (usuario_id, acao)
            VALUES ($1, $2)
            `,
            [
                req.usuario.id,
                `Atualizou foto do colaborador ID ${id}`
            ]
        )

        res.json(result.rows[0])
    } catch (error) {
        console.error(error)

        res.status(500).json({
            erro: 'Erro ao atualizar foto do colaborador'
        })
    }
}

module.exports = {
    listarColaboradores,
    criarColaborador,
    atualizarColaborador,
    alterarStatusColaborador,
    atualizarFotoColaborador
}