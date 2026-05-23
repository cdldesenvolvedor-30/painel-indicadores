const jwt = require('jsonwebtoken')

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return res.status(401).json({
        erro: 'Token não enviado'
      })
    }

    const token = authHeader.split(' ')[1]

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'segredo_temporario'
    )

    req.usuario = decoded

    next()
  } catch (error) {
    return res.status(401).json({
      erro: 'Token inválido'
    })
  }
}

module.exports = authMiddleware
