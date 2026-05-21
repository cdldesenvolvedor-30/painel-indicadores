const pool = require('../database/connection')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

async function login(req, res) {
    try {
        const { email, senha } = req.body

        const result = await pool.query(
            `
            SELECT
                id,
                nome,
                email,
                senha,
                perfil,
                status,
                foto_url
            FROM usuarios
            WHERE email = $1
            `,
            [email]
        )

        if (result.rows.length === 0) {
            return res.status(401).json({
                erro: 'Email ou senha inválidos'
            })
        }

        const usuario = result.rows[0]

        const senhaCorreta = await bcrypt.compare(
            senha,
            usuario.senha
        )

        if (!senhaCorreta) {
            return res.status(401).json({
                erro: 'Email ou senha inválidos'
            })
        }

        const token = jwt.sign(
            {
                id: usuario.id,
                email: usuario.email,
                perfil: usuario.perfil
            },
            'segredo_temporario',
            {
                expiresIn: '8h'
            }
        )

        res.json({
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                perfil: usuario.perfil,
                foto_url: usuario.foto_url
            },
            token
        })

    } catch (error) {
        console.error(error)

        res.status(500).json({
            erro: 'Erro ao fazer login'
        })
    }
}

module.exports = {
    login
}