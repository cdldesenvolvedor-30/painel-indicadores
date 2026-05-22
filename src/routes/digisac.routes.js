const express = require('express')

const router = express.Router()

const authMiddleware = require('../middlewares/auth.middleware')

const {
  testarConexao,
  listarContatos,
  listarTickets
} = require('../controllers/digisac.controller')

router.use(authMiddleware)

router.get('/testar-conexao', testarConexao)
router.get('/contatos', listarContatos)
router.get('/tickets', listarTickets)

module.exports = router