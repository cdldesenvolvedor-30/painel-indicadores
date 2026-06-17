const pool = require('../database/connection')
const bcrypt = require('bcryptjs')

async function listarUsuarios(req, res) {
    try {
        const result = await pool.query(`
            SELECT
                id,
                nome,
                email,
                perfil,
                setor,
                status,
                foto_url,
                data_criacao
            FROM usuarios
            ORDER BY id ASC
        `)

        res.json(result.rows)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            erro: 'Erro ao listar usuários'
        })
    }
}

async function criarUsuario(req, res) {
    try {
        const {
            nome,
            email,
            senha,
            perfil,
            setor
        } = req.body

        if (!nome || !email || !senha || !perfil) {
            return res.status(400).json({
                erro: 'Nome, email, senha e perfil são obrigatórios'
            })
        }

        const senhaCriptografada = await bcrypt.hash(senha, 10)

        await pool.query(
            `
            INSERT INTO usuarios
            (
                nome,
                email,
                senha,
                perfil,
                setor,
                status
            )
            VALUES
            (
                $1,
                $2,
                $3,
                $4,
                $5,
                'Ativo'
            )
            `,
            [
                nome,
                email,
                senhaCriptografada,
                perfil,
                setor || null
            ]
        )

        await pool.query(
            `
            INSERT INTO logs
            (
                usuario_id,
                acao
            )
            VALUES
            (
                $1,
                $2
            )
            `,
            [
                req.usuario.id,
                `Criou usuário ${email}`
            ]
        )

        res.status(201).json({
            mensagem: 'Usuário criado com sucesso'
        })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            erro: 'Erro ao criar usuário'
        })
    }
}

async function atualizarUsuario(req, res) {
    try {
        const { id } = req.params

        const {
            nome,
            email,
            perfil,
            setor,
            status
        } = req.body

        if (!nome || !email || !perfil || !status) {
            return res.status(400).json({
                erro: 'Nome, email, perfil e status são obrigatórios'
            })
        }

        const result = await pool.query(
            `
            UPDATE usuarios
            SET
                nome = $1,
                email = $2,
                perfil = $3,
                setor = $4,
                status = $5
            WHERE id = $6
            RETURNING
                id,
                nome,
                email,
                perfil,
                setor,
                status,
                foto_url
            `,
            [
                nome,
                email,
                perfil,
                setor || null,
                status,
                id
            ]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({
                erro: 'Usuário não encontrado'
            })
        }

        await pool.query(
            `
            INSERT INTO logs
            (
                usuario_id,
                acao
            )
            VALUES
            (
                $1,
                $2
            )
            `,
            [
                req.usuario.id,
                `Atualizou usuário ID ${id}`
            ]
        )

        res.json(result.rows[0])
    } catch (error) {
        console.error(error)

        res.status(500).json({
            erro: 'Erro ao atualizar usuário'
        })
    }
}

async function desativarUsuario(req, res) {
    try {
        const { id } = req.params

        await pool.query(
            `
            UPDATE usuarios
            SET status = 'Inativo'
            WHERE id = $1
            `,
            [id]
        )

        await pool.query(
            `
            INSERT INTO logs
            (
                usuario_id,
                acao
            )
            VALUES
            (
                $1,
                $2
            )
            `,
            [
                req.usuario.id,
                `Desativou usuário ID ${id}`
            ]
        )

        res.json({
            mensagem: 'Usuário desativado com sucesso'
        })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            erro: 'Erro ao desativar usuário'
        })
    }
}

async function atualizarFotoUsuario(req, res) {
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
            UPDATE usuarios
            SET foto_url = $1
            WHERE id = $2
            RETURNING
                id,
                nome,
                email,
                perfil,
                setor,
                status,
                foto_url
            `,
            [
                foto_url,
                id
            ]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({
                erro: 'Usuário não encontrado'
            })
        }

        await pool.query(
            `
            INSERT INTO logs
            (
                usuario_id,
                acao
            )
            VALUES
            (
                $1,
                $2
            )
            `,
            [
                req.usuario.id,
                `Atualizou foto do usuário ID ${id}`
            ]
        )

        res.json(result.rows[0])
    } catch (error) {
        console.error(error)

        res.status(500).json({
            erro: 'Erro ao atualizar foto do usuário'
        })
    }
}

async function redefinirSenhaUsuario(req, res) {
  try {
    const { id } = req.params
    const { novaSenha } = req.body

    if (!novaSenha || novaSenha.length < 6) {
      return res.status(400).json({
        erro: 'A nova senha deve ter pelo menos 6 caracteres'
      })
    }

    const senhaCriptografada = await bcrypt.hash(novaSenha, 10)

    const result = await pool.query(
      `
      UPDATE usuarios
      SET senha = $1
      WHERE id = $2
      RETURNING id, nome, email
      `,
      [senhaCriptografada, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        erro: 'Usuário não encontrado'
      })
    }

    await pool.query(
      `
      INSERT INTO logs (usuario_id, acao)
      VALUES ($1, $2)
      `,
      [
        req.usuario.id,
        `Redefiniu a senha do usuário ID ${id}`
      ]
    )

    res.json({
      mensagem: 'Senha redefinida com sucesso'
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      erro: 'Erro ao redefinir senha'
    })
  }
}


async function atualizarMeuPerfil(req, res) {
  try {
    const usuarioId = req.usuario.id
    const {
      nome,
      email,
      setor,
      foto_url,
      novaSenha
    } = req.body

    if (!nome || !email) {
      return res.status(400).json({
        erro: 'Nome e e-mail são obrigatórios'
      })
    }

    const emailExistente = await pool.query(
      `
      SELECT id
      FROM usuarios
      WHERE email = $1
      AND id <> $2
      `,
      [email, usuarioId]
    )

    if (emailExistente.rows.length > 0) {
      return res.status(400).json({
        erro: 'Este e-mail já está sendo usado por outro usuário'
      })
    }

    let senhaCriptografada = null

    if (novaSenha) {
      if (novaSenha.length < 6) {
        return res.status(400).json({
          erro: 'A nova senha deve ter pelo menos 6 caracteres'
        })
      }

      senhaCriptografada = await bcrypt.hash(novaSenha, 10)
    }

    const result = await pool.query(
      `
      UPDATE usuarios
      SET
        nome = $1,
        email = $2,
        setor = $3,
        foto_url = $4,
        senha = COALESCE($5, senha)
      WHERE id = $6
      RETURNING
        id,
        nome,
        email,
        perfil,
        setor,
        status,
        foto_url
      `,
      [
        nome,
        email,
        setor || null,
        foto_url || null,
        senhaCriptografada,
        usuarioId
      ]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        erro: 'Usuário não encontrado'
      })
    }

    await pool.query(
      `
      INSERT INTO logs (usuario_id, acao)
      VALUES ($1, $2)
      `,
      [usuarioId, 'Atualizou o próprio perfil']
    )

    res.json({
      mensagem: 'Perfil atualizado com sucesso',
      usuario: result.rows[0]
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      erro: 'Erro ao atualizar perfil'
    })
  }
}

module.exports = {
    listarUsuarios,
    criarUsuario,
    atualizarUsuario,
    desativarUsuario,
    atualizarFotoUsuario,
    redefinirSenhaUsuario,
    atualizarMeuPerfil
}
