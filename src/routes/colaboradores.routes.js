const express = require('express')

const router = express.Router()

const authMiddleware = require('../middlewares/auth.middleware')

const {
    listarColaboradores,
    criarColaborador,
    atualizarColaborador,
    alterarStatusColaborador,
    atualizarFotoColaborador
} = require('../controllers/colaboradores.controller')

router.use(authMiddleware)

router.get('/', listarColaboradores)

router.post('/', criarColaborador)

router.put('/:id', atualizarColaborador)

router.patch('/:id/status', alterarStatusColaborador)

router.patch('/:id/foto', atualizarFotoColaborador)

module.exports = router