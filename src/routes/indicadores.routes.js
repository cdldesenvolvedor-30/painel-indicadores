const express = require('express')

const router = express.Router()

const authMiddleware = require('../middlewares/auth.middleware')

const {
    listarIndicadores,
    criarIndicador,
    resumoIndicadores,
    rankingColaboradores,
    alertasColaboradores,
    indicadoresPorColaborador,
    indicadoresPorPeriodo
} = require('../controllers/indicadores.controller')

router.use(authMiddleware)

router.get('/', listarIndicadores)

router.post('/', criarIndicador)

router.get('/resumo', resumoIndicadores)

router.get('/ranking', rankingColaboradores)

router.get('/alertas', alertasColaboradores)

router.get('/periodo', indicadoresPorPeriodo)

router.get('/colaborador/:id', indicadoresPorColaborador)

module.exports = router