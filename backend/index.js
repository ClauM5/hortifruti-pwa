// Arquivo: backend/index.js (Versão 2 - com Banco de Dados)

const express = require('express');
const cors = require('cors');
// 1. Importando a nova biblioteca do PostgreSQL
const { Pool } = require('pg');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3001;

// 2. Configurando a conexão com o banco de dados
//    Ele vai automaticamente usar a variável de ambiente DATABASE_URL que criamos no Render.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// 3. Rota de teste para verificar a conexão com o banco de dados
app.get('/api/test-db', async (req, res) => {
  try {
    const client = await pool.connect();
    res.status(200).send('Conexão com o banco de dados bem-sucedida!');
    client.release(); // Libera o cliente de volta para o pool de conexões
  } catch (err) {
    console.error('Erro ao conectar ao banco de dados', err);
    res.status(500).send('Falha ao conectar ao banco de dados');
  }
});

// 4. Modificando a rota de produtos para buscar do banco de dados
app.get('/api/produtos', async (req, res) => {
  try {
    // O pool.query executa um comando SQL no nosso banco de dados
    const result = await pool.query('SELECT * FROM produtos');
    // O resultado da busca fica em result.rows
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar produtos', err);
    res.status(500).send('Erro no servidor');
  }
});

app.listen(PORT, () => {
  console.log(`Servidor do Hortifruti rodando na porta ${PORT}`);
});