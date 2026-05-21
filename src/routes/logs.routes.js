const express = require('express')

const router = express.Router()

const authMiddleware = require('../middlewares/auth.middleware')
const perfilMiddleware = require('../middlewares/perfil.middleware')

const {
    listarLogs
} = require('../controllers/logs.controller')

router.use(authMiddleware)

router.get(
    '/',
    perfilMiddleware(['admin']),
    listarLogs
)

module.exports = router