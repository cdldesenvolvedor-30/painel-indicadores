const bcrypt = require('bcryptjs')

const pool = require('./src/database/connection')

async function criarUsuario() {

    try {

        const senhaCriptografada = await bcrypt.hash(
            '123456',
            10
        )

        await pool.query(

            `
            INSERT INTO usuarios
            (
                nome,
                email,
                senha,
                perfil
            )

            VALUES
            (
                $1,
                $2,
                $3,
                $4
            )
            `,

            [
                'Mateus',
                'admin@admin.com',
                senhaCriptografada,
                'gestor'
            ]

        )

        console.log('Usuário criado com sucesso 🚀')

        process.exit()

    } catch (error) {

        console.error(error)

        process.exit()

    }

}

criarUsuario()