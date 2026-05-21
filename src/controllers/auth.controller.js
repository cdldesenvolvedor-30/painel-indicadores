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
        setor,
        status,
        foto_url
      FROM usuarios
      WHERE email = $1
      `,
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ erro: 'Email ou senha inválidos' })
    }

    const usuario = result.rows[0]

    if (usuario.status !== 'Ativo') {
      return res.status(401).json({ erro: 'Usuário inativo' })
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha)

    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'Email ou senha inválidos' })
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        perfil: usuario.perfil
      },
      process.env.JWT_SECRET || 'segredo_temporario',
      { expiresIn: '8h' }
    )

    res.json({
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        setor: usuario.setor,
        foto_url: usuario.foto_url
      },
      token
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ erro: 'Erro ao fazer login' })
  }
}

async function resetAdmin(req, res) {
  try {
    const senhaCriptografada = await bcrypt.hash('123456', 10)

    const result = await pool.query(
      `
      UPDATE usuarios
      SET
        senha = $1,
        status = 'Ativo',
        perfil = 'admin'
      WHERE email = 'admin@admin.com'
      RETURNING id, nome, email, perfil, status
      `,
      [senhaCriptografada]
    )

    if (result.rows.length === 0) {
      const novoUsuario = await pool.query(
        `
        INSERT INTO usuarios
        (nome, email, senha, perfil, status)
        VALUES
        ('Mateus', 'admin@admin.com', $1, 'admin', 'Ativo')
        RETURNING id, nome, email, perfil, status
        `,
        [senhaCriptografada]
      )

      return res.json({
        mensagem: 'Admin criado com sucesso',
        usuario: novoUsuario.rows[0]
      })
    }

    res.json({
      mensagem: 'Senha do admin resetada com sucesso',
      usuario: result.rows[0]
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ erro: 'Erro ao resetar admin' })
  }
}

module.exports = {
  login,
  resetAdmin
}