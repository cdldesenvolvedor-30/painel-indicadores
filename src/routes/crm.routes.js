const express = require('express')

const router = express.Router()

const authMiddleware = require('../middlewares/auth.middleware')

const {
    listarAtendimentos,
    resumoCRM,
    triagemCRM,
    examesCRM,
    performanceCRM,
    criarAtendimento
} = require('../controllers/crm.controller')

router.use(authMiddleware)

router.get('/atendimentos', listarAtendimentos)

router.get('/resumo', resumoCRM)

router.get('/triagem', triagemCRM)

router.get('/exames', examesCRM)

router.get('/performance', performanceCRM)

router.post('/atendimentos', criarAtendimento)

module.exports = router