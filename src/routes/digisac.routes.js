const express = require('express')

const router = express.Router()

const authMiddleware = require('../middlewares/auth.middleware')

const {
  testarConexao,
  listarContatos,
  listarTickets,
  sincronizarCRM,
  listarUsuarios,
  listarDepartamentos,
  listarFilas,
  debugAssuntosDigisac,
  listarAssuntos
} = require('../controllers/digisac.controller')

router.get('/debug-assuntos', debugAssuntosDigisac)

router.use(authMiddleware)

router.get('/testar-conexao', testarConexao)
router.get('/contatos', listarContatos)
router.get('/tickets', listarTickets)
router.post('/sincronizar-crm', sincronizarCRM)
router.get('/usuarios', listarUsuarios)
router.get('/departamentos', listarDepartamentos)
router.get('/filas', listarFilas)
router.get('/assuntos', listarAssuntos)

module.exports = router
