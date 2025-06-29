// Arquivo: backend/index.js (Versão 7 - Com Gerenciamento de Pedidos)

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

const app = express();
app.use(cors());
app.use(express.json());

// --- CONFIGURAÇÕES E MIDDLEWARE (sem alterações) ---
const PORT = process.env.PORT || 3001;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const checkPassword = (req, res, next) => {
  const { authorization } = req.headers;
  if (authorization === process.env.ADMIN_PASSWORD) {
    next();
  } else {
    res.status(403).send('Acesso negado: senha incorreta.');
  }
};

// --- ROTAS PÚBLICAS (sem alterações) ---
app.get('/api/produtos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM produtos ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) { console.error('Erro ao buscar produtos:', err); res.status(500).send('Erro no servidor'); }
});
app.post('/api/pedidos', async (req, res) => {
  const { nome_cliente, endereco_cliente, itens } = req.body;
  const valor_total = itens.reduce((sum, item) => sum + Number(item.preco) * item.quantity, 0);
  const client = await pool.connect();
  if (!nome_cliente || !endereco_cliente || !itens || !itens.length) {
    return res.status(400).send('Dados do pedido incompletos.');
  }
  try {
    await client.query('BEGIN');
    const pedidoResult = await client.query(
      `INSERT INTO pedidos (nome_cliente, endereco_cliente, valor_total, metodo_pagamento, troco_para) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [req.body.nome_cliente, req.body.endereco_cliente, valor_total, req.body.metodo_pagamento, req.body.troco_para || null]
    );
    const pedidoId = pedidoResult.rows[0].id;
    for (const item of itens) {
      await client.query('INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)', [pedidoId, item.id, item.quantity, item.preco]);
    }
    await client.query('COMMIT');
    res.status(201).json({ message: 'Pedido criado com sucesso!', pedidoId: pedidoId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar pedido:', err);
    res.status(500).send('Erro no servidor ao criar pedido.');
  } finally {
    client.release();
  }
});

// --- ROTAS PROTEGIDAS ---

// Upload de Imagem (sem alterações)
app.post('/api/upload', checkPassword, upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).send('Nenhum arquivo enviado.');
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
    try {
      const result = await cloudinary.uploader.upload(dataURI, { folder: "hortifruti-pwa" });
      res.status(200).json({ imageUrl: result.secure_url });
    } catch (error) { console.error("Erro no upload para o Cloudinary:", error); res.status(500).send('Erro ao fazer upload da imagem.'); }
});

// CRUD de Produtos (sem alterações)
app.post('/api/produtos', checkPassword, async (req, res) => {
    const { nome, preco, unidade, imagem } = req.body;
    try {
      const newProduct = await pool.query('INSERT INTO produtos (nome, preco, unidade, imagem) VALUES ($1, $2, $3, $4) RETURNING *', [nome, preco, unidade, imagem]);
      res.status(201).json(newProduct.rows[0]);
    } catch (err) { console.error('Erro ao criar produto', err); res.status(500).send('Erro no servidor'); }
});
app.put('/api/produtos/:id', checkPassword, async (req, res) => {
    const { id } = req.params;
    const { nome, preco, unidade, imagem } = req.body;
    try {
      const updatedProduct = await pool.query('UPDATE produtos SET nome = $1, preco = $2, unidade = $3, imagem = $4 WHERE id = $5 RETURNING *', [nome, preco, unidade, imagem, id]);
      res.json(updatedProduct.rows[0]);
    } catch (err) { console.error('Erro ao atualizar produto', err); res.status(500).send('Erro no servidor'); }
});
app.delete('/api/produtos/:id', checkPassword, async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query('DELETE FROM produtos WHERE id = $1', [id]);
      res.status(204).send();
    } catch (err) { console.error('Erro ao deletar produto', err); res.status(500).send('Erro no servidor'); }
});


// ========================================================================
// >> NOVAS ROTAS DE GERENCIAMENTO DE PEDIDOS <<
// ========================================================================

// NOVA ROTA: Listar todos os pedidos para o admin
app.get('/api/pedidos', checkPassword, async (req, res) => {
  try {
    // Busca todos os pedidos, do mais novo para o mais antigo
    const pedidosResult = await pool.query('SELECT * FROM pedidos ORDER BY data_pedido DESC');
    const pedidos = pedidosResult.rows;

    // Para cada pedido, busca os itens correspondentes
    for (const pedido of pedidos) {
      const itensResult = await pool.query('SELECT * FROM itens_pedido WHERE pedido_id = $1', [pedido.id]);
      // Adiciona a lista de itens ao objeto do pedido
      pedido.itens = itensResult.rows;
    }

    res.json(pedidos);
  } catch (err) {
    console.error('Erro ao buscar pedidos:', err);
    res.status(500).send('Erro no servidor');
  }
});

// NOVA ROTA: Atualizar o status de um pedido específico
app.put('/api/pedidos/:id/status', checkPassword, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // Pega o novo status do corpo da requisição

  if (!status) {
    return res.status(400).send('Novo status não fornecido.');
  }

  try {
    const updatedPedido = await pool.query(
      'UPDATE pedidos SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    res.json(updatedPedido.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar status do pedido:', err);
    res.status(500).send('Erro no servidor');
  }
});


// --- INICIALIZAÇÃO DO SERVIDOR ---
app.listen(PORT, () => {
  console.log(`Servidor do Hortifruti rodando na porta ${PORT}`);
});