const jwt = require('jsonwebtoken')

function perfilMiddleware(perfisPermitidos) {
  return (req, res, next) => {
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

      if (!perfisPermitidos.includes(decoded.perfil)) {
        return res.status(403).json({
          erro: 'Sem permissão'
        })
      }

      next()
    } catch (error) {
      return res.status(401).json({
        erro: 'Token inválido'
      })
    }
  }
}

module.exports = perfilMiddleware
