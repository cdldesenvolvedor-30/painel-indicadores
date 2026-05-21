const express = require('express')

const router = express.Router()

const authMiddleware = require('../middlewares/auth.middleware')

const {
    listarMetas,
    criarMeta,
    metasPorColaborador,
    compararMetaResultado
} = require('../controllers/metas.controller')

router.use(authMiddleware)

router.get('/', listarMetas)

router.post('/', criarMeta)

router.get('/comparativo', compararMetaResultado)

router.get('/colaborador/:id', metasPorColaborador)

module.exports = router