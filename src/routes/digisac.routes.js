const express = require('express')

const router = express.Router()

const authMiddleware = require('../middlewares/auth.middleware')

const {
  testarConexao,
  listarContatos,
  listarTickets,
  sincronizarCRM
} = require('../controllers/digisac.controller')

router.use(authMiddleware)

router.get('/testar-conexao', testarConexao)
router.get('/contatos', listarContatos)
router.get('/tickets', listarTickets)
router.post('/sincronizar-crm', sincronizarCRM)

module.exports = router