const pool = require('./src/database/connection');

async function testConnection() {
    try {
        const client = await pool.connect();

        console.log('Banco conectado com sucesso 🚀');

        client.release();
    } catch (error) {
        console.error('Erro ao conectar no banco:', error);
    }
}

testConnection();