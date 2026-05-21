const jwt = require('jsonwebtoken')

function perfilMiddleware(perfisPermitidos) {

    return (req, res, next) => {

        try {

            const authHeader =
                req.headers.authorization

            const token =
                authHeader.split(' ')[1]

            const decoded = jwt.verify(
                token,
                'segredo_temporario'
            )

            if (
                !perfisPermitidos.includes(
                    decoded.perfil
                )
            ) {

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