const express = require('express')

const router = express.Router()

const authMiddleware = require('../middlewares/auth.middleware')

const {
    listarMapaPerformance,
    resumoMapaPerformance,
    criarMapaPerformance,
    atualizarMapaPerformance,
    excluirMapaPerformance
} = require('../controllers/mapaPerformance.controller')

router.use(authMiddleware)

router.get('/', listarMapaPerformance)

router.get('/resumo', resumoMapaPerformance)

router.post('/', criarMapaPerformance)

router.put('/:id', atualizarMapaPerformance)

router.delete('/:id', excluirMapaPerformance)

module.exports = router