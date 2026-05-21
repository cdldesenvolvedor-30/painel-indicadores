const pool = require('../database/connection')

function montarFiltros(queryParams, alias = 'i') {
    const { inicio, fim, setor, colaboradorId } = queryParams

    const condicoes = []
    const valores = []

    if (inicio && fim) {
        valores.push(inicio, fim)
        condicoes.push(`${alias}.data_registro BETWEEN $${valores.length - 1} AND $${valores.length}`)
    }

    if (setor) {
        valores.push(setor)
        condicoes.push(`c.setor = $${valores.length}`)
    }

    if (colaboradorId) {
        valores.push(colaboradorId)
        condicoes.push(`c.id = $${valores.length}`)
    }

    return {
        where: condicoes.length > 0 ? `WHERE ${condicoes.join(' AND ')}` : '',
        valores
    }
}

async function listarIndicadores(req, res) {
    try {
        const { where, valores } = montarFiltros(req.query)

        const result = await pool.query(`
            SELECT
                i.id,
                i.colaborador_id,
                c.nome AS colaborador,
                c.setor,
                c.foto_url,
                i.data_registro,
                i.total_atendimentos,
                i.total_vendas,
                i.valor_vendas,
                i.tat_medio_segundos,
                i.erros,
                i.solicitacoes_desconto,
                i.ligacoes_atendidas,
                i.data_criacao
            FROM indicadores i
            INNER JOIN colaboradores c
                ON c.id = i.colaborador_id
            ${where}
            ORDER BY i.data_registro DESC
        `, valores)

        res.json(result.rows)
    } catch (error) {
        console.error(error)
        res.status(500).json({ erro: 'Erro ao listar indicadores' })
    }
}

async function criarIndicador(req, res) {
    try {
        const {
            colaborador_id,
            data_registro,
            total_atendimentos,
            total_vendas,
            valor_vendas,
            tat_medio_segundos,
            erros,
            solicitacoes_desconto,
            ligacoes_atendidas
        } = req.body

        if (!colaborador_id || !data_registro) {
            return res.status(400).json({
                erro: 'Colaborador e data são obrigatórios'
            })
        }

        const result = await pool.query(
            `
            INSERT INTO indicadores
            (
                colaborador_id,
                data_registro,
                total_atendimentos,
                total_vendas,
                valor_vendas,
                tat_medio_segundos,
                erros,
                solicitacoes_desconto,
                ligacoes_atendidas
            )
            VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
            `,
            [
                colaborador_id,
                data_registro,
                total_atendimentos || 0,
                total_vendas || 0,
                valor_vendas || 0,
                tat_medio_segundos || 0,
                erros || 0,
                solicitacoes_desconto || 0,
                ligacoes_atendidas || 0
            ]
        )

        await pool.query(
            `
            INSERT INTO logs (usuario_id, acao)
            VALUES ($1, $2)
            `,
            [
                req.usuario.id,
                `Criou indicador para colaborador ID ${colaborador_id}`
            ]
        )

        res.status(201).json(result.rows[0])
    } catch (error) {
        console.error(error)
        res.status(500).json({ erro: 'Erro ao criar indicador' })
    }
}

async function resumoIndicadores(req, res) {
    try {
        const { where, valores } = montarFiltros(req.query)

        const result = await pool.query(`
            SELECT
                COUNT(DISTINCT i.colaborador_id) AS total_colaboradores,
                COALESCE(SUM(i.total_atendimentos), 0) AS total_atendimentos,
                COALESCE(SUM(i.total_vendas), 0) AS total_vendas,
                COALESCE(SUM(i.valor_vendas), 0) AS valor_total_vendas,
                COALESCE(ROUND(AVG(i.tat_medio_segundos), 2), 0) AS tat_medio_geral,
                COALESCE(SUM(i.erros), 0) AS total_erros,
                COALESCE(SUM(i.solicitacoes_desconto), 0) AS total_solicitacoes_desconto,
                COALESCE(SUM(i.ligacoes_atendidas), 0) AS total_ligacoes_atendidas
            FROM indicadores i
            INNER JOIN colaboradores c
                ON c.id = i.colaborador_id
            ${where}
        `, valores)

        res.json(result.rows[0])
    } catch (error) {
        console.error(error)
        res.status(500).json({ erro: 'Erro ao gerar resumo' })
    }
}

async function rankingColaboradores(req, res) {
    try {
        const { where, valores } = montarFiltros(req.query)

        const result = await pool.query(`
            SELECT
                c.id,
                c.nome,
                c.setor,
                c.foto_url,
                COALESCE(SUM(i.total_atendimentos), 0) AS total_atendimentos,
                COALESCE(SUM(i.total_vendas), 0) AS total_vendas,
                COALESCE(SUM(i.erros), 0) AS total_erros,
                (
                    (COALESCE(SUM(i.total_vendas), 0) * 5)
                    +
                    (COALESCE(SUM(i.total_atendimentos), 0) * 1)
                    -
                    (COALESCE(SUM(i.erros), 0) * 10)
                ) AS score
            FROM colaboradores c
            LEFT JOIN indicadores i
                ON c.id = i.colaborador_id
            ${where}
            GROUP BY c.id, c.nome, c.setor, c.foto_url
            ORDER BY score DESC
        `, valores)

        res.json(result.rows)
    } catch (error) {
        console.error(error)
        res.status(500).json({ erro: 'Erro ao gerar ranking' })
    }
}

async function alertasColaboradores(req, res) {
    try {
        const { where, valores } = montarFiltros(req.query)

        const result = await pool.query(`
            SELECT
                c.id,
                c.nome,
                c.setor,
                c.foto_url,
                COALESCE(SUM(i.total_atendimentos), 0) AS total_atendimentos,
                COALESCE(SUM(i.total_vendas), 0) AS total_vendas,
                COALESCE(SUM(i.erros), 0) AS total_erros,
                COALESCE(ROUND(AVG(i.tat_medio_segundos), 2), 0) AS tat_medio,
                CASE
                    WHEN COALESCE(SUM(i.erros), 0) >= 2 THEN 'Alto número de erros'
                    WHEN COALESCE(AVG(i.tat_medio_segundos), 0) > 160 THEN 'T.A.T acima do ideal'
                    WHEN COALESCE(SUM(i.total_vendas), 0) < 20 THEN 'Baixo volume de vendas'
                    ELSE 'Dentro do esperado'
                END AS alerta
            FROM colaboradores c
            LEFT JOIN indicadores i
                ON c.id = i.colaborador_id
            ${where}
            GROUP BY c.id, c.nome, c.setor, c.foto_url
            ORDER BY total_erros DESC, tat_medio DESC
        `, valores)

        res.json(result.rows)
    } catch (error) {
        console.error(error)
        res.status(500).json({ erro: 'Erro ao gerar alertas' })
    }
}

async function indicadoresPorColaborador(req, res) {
    try {
        const { id } = req.params

        const result = await pool.query(`
            SELECT
                c.id AS colaborador_id,
                c.nome,
                c.setor,
                c.cargo,
                c.foto_url,
                COALESCE(SUM(i.total_atendimentos), 0) AS total_atendimentos,
                COALESCE(SUM(i.total_vendas), 0) AS total_vendas,
                COALESCE(SUM(i.valor_vendas), 0) AS valor_total_vendas,
                COALESCE(ROUND(AVG(i.tat_medio_segundos), 2), 0) AS tat_medio,
                COALESCE(SUM(i.erros), 0) AS total_erros,
                COALESCE(SUM(i.solicitacoes_desconto), 0) AS total_solicitacoes_desconto,
                COALESCE(SUM(i.ligacoes_atendidas), 0) AS total_ligacoes_atendidas,
                (
                    (COALESCE(SUM(i.total_vendas), 0) * 5)
                    +
                    (COALESCE(SUM(i.total_atendimentos), 0) * 1)
                    -
                    (COALESCE(SUM(i.erros), 0) * 10)
                ) AS score
            FROM colaboradores c
            LEFT JOIN indicadores i
                ON c.id = i.colaborador_id
            WHERE c.id = $1
            GROUP BY c.id, c.nome, c.setor, c.cargo, c.foto_url
        `, [id])

        if (result.rows.length === 0) {
            return res.status(404).json({
                erro: 'Colaborador não encontrado'
            })
        }

        res.json(result.rows[0])
    } catch (error) {
        console.error(error)
        res.status(500).json({ erro: 'Erro ao buscar indicadores do colaborador' })
    }
}

async function indicadoresPorPeriodo(req, res) {
    try {
        const { inicio, fim } = req.query

        if (!inicio || !fim) {
            return res.status(400).json({
                erro: 'Informe data inicial e final'
            })
        }

        const result = await pool.query(`
            SELECT
                c.id,
                c.nome,
                c.setor,
                c.foto_url,
                SUM(i.total_atendimentos) AS total_atendimentos,
                SUM(i.total_vendas) AS total_vendas,
                SUM(i.valor_vendas) AS valor_total_vendas,
                ROUND(AVG(i.tat_medio_segundos), 2) AS tat_medio,
                SUM(i.erros) AS total_erros,
                (
                    (SUM(i.total_vendas) * 5)
                    +
                    (SUM(i.total_atendimentos) * 1)
                    -
                    (SUM(i.erros) * 10)
                ) AS score
            FROM indicadores i
            INNER JOIN colaboradores c
                ON c.id = i.colaborador_id
            WHERE i.data_registro BETWEEN $1 AND $2
            GROUP BY c.id, c.nome, c.setor, c.foto_url
            ORDER BY score DESC
        `, [inicio, fim])

        res.json(result.rows)
    } catch (error) {
        console.error(error)
        res.status(500).json({ erro: 'Erro ao buscar indicadores por período' })
    }
}

module.exports = {
    listarIndicadores,
    criarIndicador,
    resumoIndicadores,
    rankingColaboradores,
    alertasColaboradores,
    indicadoresPorColaborador,
    indicadoresPorPeriodo
}