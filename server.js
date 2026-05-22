const app = require('./src/app');
const { iniciarSincronizacaoAutomatica } = require('./src/services/digisacSync.service')

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
      iniciarSincronizacaoAutomatica()
});