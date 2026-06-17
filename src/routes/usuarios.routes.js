const express = require('express')

const router = express.Router()

const authMiddleware = require('../middlewares/auth.middleware')
const perfilMiddleware = require('../middlewares/perfil.middleware')

const {
    listarUsuarios,
    criarUsuario,
    atualizarUsuario,
    desativarUsuario,
    atualizarFotoUsuario,
    redefinirSenhaUsuario
} = require('../controllers/usuarios.controller')

router.use(authMiddleware)

router.get(
    '/',
    perfilMiddleware(['admin']),
    listarUsuarios
)

router.post(
    '/',
    perfilMiddleware(['admin']),
    criarUsuario
)

router.put(
    '/:id',
    perfilMiddleware(['admin']),
    atualizarUsuario
)

router.patch(
    '/:id/desativar',
    perfilMiddleware(['admin']),
    desativarUsuario
)

router.patch(
    '/:id/foto',
    perfilMiddleware(['admin']),
    atualizarFotoUsuario
)

router.patch(
  '/:id/redefinir-senha',
  perfilMiddleware(['admin']),
  redefinirSenhaUsuario
)

module.exports = router
