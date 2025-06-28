// Arquivo: backend/index.js (Versão 3 - Com CRUD)

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
// NOVO: Middleware para o Express entender JSON no corpo das requisições
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Configuração da conexão com o banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// --- ROTAS PÚBLICAS (qualquer um pode acessar) ---

// Rota para LER (Read) todos os produtos
app.get('/api/produtos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM produtos ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar produtos', err);
    res.status(500).send('Erro no servidor');
  }
});

// --- MIDDLEWARE DE AUTENTICAÇÃO (nosso "segurança") ---
// Este é um "porteiro" que vai verificar a senha antes de deixar a pessoa acessar as rotas de admin
const checkPassword = (req, res, next) => {
  const { authorization } = req.headers; // Pega a senha do cabeçalho da requisição
  if (authorization === process.env.ADMIN_PASSWORD) {
    next(); // Senha correta, pode prosseguir!
  } else {
    res.status(403).send('Acesso negado: senha incorreta.'); // Senha incorreta, barra a entrada.
  }
};

// --- ROTAS PROTEGIDAS (só para o admin) ---

// Rota para CRIAR (Create) um novo produto
app.post('/api/produtos', checkPassword, async (req, res) => {
  const { nome, preco, unidade, imagem } = req.body;
  try {
    const newProduct = await pool.query(
      'INSERT INTO produtos (nome, preco, unidade, imagem) VALUES ($1, $2, $3, $4) RETURNING *',
      [nome, preco, unidade, imagem]
    );
    res.status(201).json(newProduct.rows[0]);
  } catch (err) {
    console.error('Erro ao criar produto', err);
    res.status(500).send('Erro no servidor');
  }
});

// Rota para ATUALIZAR (Update) um produto existente
app.put('/api/produtos/:id', checkPassword, async (req, res) => {
  const { id } = req.params;
  const { nome, preco, unidade, imagem } = req.body;
  try {
    const updatedProduct = await pool.query(
      'UPDATE produtos SET nome = $1, preco = $2, unidade = $3, imagem = $4 WHERE id = $5 RETURNING *',
      [nome, preco, unidade, imagem, id]
    );
    res.json(updatedProduct.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar produto', err);
    res.status(500).send('Erro no servidor');
  }
});

// Rota para DELETAR (Delete) um produto
app.delete('/api/produtos/:id', checkPassword, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM produtos WHERE id = $1', [id]);
    res.status(204).send(); // 204 significa "sucesso, sem conteúdo para devolver"
  } catch (err) {
    console.error('Erro ao deletar produto', err);
    res.status(500).send('Erro no servidor');
  }
});

app.listen(PORT, () => {
  console.log(`Servidor do Hortifruti rodando na porta ${PORT}`);
});