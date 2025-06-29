// Arquivo: backend/index.js (Versão 11 - Com Categorias e Busca)

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const WebSocket = require('ws');

const app = express();
app.use(cors());
app.use(express.json());

// --- CONFIGURAÇÕES E MIDDLEWARES (sem alterações) ---
const PORT = process.env.PORT || 3001;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, });
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const checkPassword = (req, res, next) => { const { authorization } = req.headers; if (authorization === process.env.ADMIN_PASSWORD) { next(); } else { res.status(403).send('Acesso negado.'); } };
const verifyToken = (req, res, next) => { const authHeader = req.headers['authorization']; const token = authHeader && authHeader.split(' ')[1]; if (!token) { return res.status(401).send('Acesso negado: token não fornecido.'); } jwt.verify(token, process.env.JWT_SECRET, (err, user) => { if (err) { return res.status(403).send('Acesso negado: token inválido.'); } req.user = user; next(); }); };

// --- ROTAS ---

// ========================================================================
// >> ROTA DE PRODUTOS ATUALIZADA PARA BUSCA E FILTRO <<
// ========================================================================
app.get('/api/produtos', async (req, res) => {
  const { search, categoria } = req.query;
  let query = `
    SELECT p.*, array_agg(c.nome) as categorias
    FROM produtos p
    LEFT JOIN produto_categoria pc ON p.id = pc.produto_id
    LEFT JOIN categorias c ON pc.categoria_id = c.id
  `;
  const params = [];

  if (search) {
    query += ` WHERE p.nome ILIKE $${params.length + 1}`;
    params.push(`%${search}%`);
  }
  
  if (categoria) {
    query += search ? ' AND' : ' WHERE';
    query += ` p.id IN (SELECT produto_id FROM produto_categoria WHERE categoria_id = (SELECT id FROM categorias WHERE nome = $${params.length + 1}))`;
    params.push(categoria);
  }

  query += ' GROUP BY p.id ORDER BY p.id ASC';
  
  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar produtos:', err);
    res.status(500).send('Erro no servidor');
  }
});

// ... (Rotas de auth, pedidos, etc., sem alterações)
app.post('/api/auth/register', async (req, res) => { const { nome, email, senha } = req.body; if (!nome || !email || !senha) return res.status(400).json({ message: 'Preencha tudo.' }); try { const salt = await bcrypt.genSalt(10); const senha_hash = await bcrypt.hash(senha, salt); const newUser = await pool.query('INSERT INTO usuarios (nome, email, senha_hash) VALUES ($1, $2, $3) RETURNING id, nome, email', [nome, email, senha_hash]); res.status(201).json(newUser.rows[0]); } catch (err) { if (err.code === '23505') return res.status(400).json({ message: 'E-mail já cadastrado.' }); res.status(500).json({ message: 'Erro no servidor.' }); }});
app.post('/api/auth/login', async (req, res) => { const { email, senha } = req.body; if (!email || !senha) return res.status(400).json({ message: 'Preencha tudo.' }); try { const userResult = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]); if (userResult.rows.length === 0) return res.status(401).json({ message: 'Credenciais inválidas.' }); const user = userResult.rows[0]; const isMatch = await bcrypt.compare(senha, user.senha_hash); if (!isMatch) return res.status(401).json({ message: 'Credenciais inválidas.' }); const payload = { id: user.id, nome: user.nome }; const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' }); res.json({ token, user: payload }); } catch (err) { res.status(500).json({ message: 'Erro no servidor.' }); }});
app.post('/api/pedidos', async (req, res) => { const { nome_cliente, endereco_cliente, itens, metodo_pagamento, troco_para, token } = req.body; const v = itens.reduce((s, i) => s + Number(i.preco) * i.quantity, 0); const c = await pool.connect(); let uId = null; if (token) { try { const dUser = jwt.verify(token, process.env.JWT_SECRET); uId = dUser.id; } catch (err) { console.log("Token inválido"); } } if (!nome_cliente || !endereco_cliente || !itens || !itens.length || !metodo_pagamento) { return res.status(400).send('Dados incompletos.'); } try { await c.query('BEGIN'); const p = await c.query(`INSERT INTO pedidos (nome_cliente, endereco_cliente, valor_total, metodo_pagamento, troco_para, usuario_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [nome_cliente, endereco_cliente, v, metodo_pagamento, troco_para || null, uId]); const nPed = p.rows[0]; for (const i of itens) { await c.query('INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)', [nPed.id, i.id, i.quantity, i.preco]); } await c.query('COMMIT'); nPed.itens = itens; broadcast({ type: 'NOVO_PEDIDO', payload: nPed }); res.status(201).json({ message: 'Pedido criado!', pedidoId: nPed.id }); } catch (e) { await c.query('ROLLBACK'); console.error('Erro:', e); res.status(500).send('Erro ao criar pedido.'); } finally { c.release(); } });
app.get('/api/meus-pedidos', verifyToken, async (req, res) => { try { const pResult = await pool.query('SELECT * FROM pedidos WHERE usuario_id = $1 ORDER BY data_pedido DESC', [req.user.id]); const p = pResult.rows; for (const ped of p) { const iResult = await pool.query('SELECT * FROM itens_pedido WHERE pedido_id = $1', [ped.id]); ped.itens = iResult.rows; } res.json(p); } catch (err) { res.status(500).send('Error'); }});
app.post('/api/upload', checkPassword, upload.single('image'), async (req, res) => { if (!req.file) return res.status(400).send('No file.'); const b64 = Buffer.from(req.file.buffer).toString("base64"); let dURI = "data:" + req.file.mimetype + ";base64," + b64; try { const r = await cloudinary.uploader.upload(dURI, { folder: "hortifruti-pwa" }); res.status(200).json({ imageUrl: r.secure_url }); } catch (e) { res.status(500).send('Error.'); }});
app.put('/api/produtos/:id', checkPassword, async (req, res) => { const { id } = req.params; const { nome, preco, unidade, imagem, categorias } = req.body; const client = await pool.connect(); try { await client.query('BEGIN'); const updatedProduct = await client.query('UPDATE produtos SET nome = $1, preco = $2, unidade = $3, imagem = $4 WHERE id = $5 RETURNING *', [nome, preco, unidade, imagem, id]); await client.query('DELETE FROM produto_categoria WHERE produto_id = $1', [id]); if (categorias && categorias.length > 0) { for (const catId of categorias) { await client.query('INSERT INTO produto_categoria (produto_id, categoria_id) VALUES ($1, $2)', [id, catId]); } } await client.query('COMMIT'); res.json(updatedProduct.rows[0]); } catch (err) { await client.query('ROLLBACK'); console.error('Erro ao atualizar produto', err); res.status(500).send('Erro no servidor'); } finally { client.release(); }});
app.delete('/api/produtos/:id', checkPassword, async (req, res) => { const { id } = req.params; try { await pool.query('DELETE FROM produtos WHERE id = $1', [id]); res.status(204).send(); } catch (e) { res.status(500).send('Error.'); }});
app.get('/api/pedidos', checkPassword, async (req, res) => { try { const pResult = await pool.query('SELECT * FROM pedidos ORDER BY data_pedido DESC'); const p = pResult.rows; for (const ped of p) { const iResult = await pool.query('SELECT * FROM itens_pedido WHERE pedido_id = $1', [ped.id]); ped.itens = iResult.rows; } res.json(p); } catch (e) { res.status(500).send('Error.'); }});
app.put('/api/pedidos/:id/status', checkPassword, async (req, res) => { const { id } = req.params; const { status } = req.body; if (!status) return res.status(400).send('No status.'); try { const u = await pool.query('UPDATE pedidos SET status = $1 WHERE id = $2 RETURNING *', [status, id]); res.json(u.rows[0]); } catch (e) { res.status(500).send('Error.'); }});


// ========================================================================
// >> ROTA DE CRIAÇÃO DE PRODUTO ATUALIZADA <<
// ========================================================================
app.post('/api/produtos', checkPassword, async (req, res) => {
  const { nome, preco, unidade, imagem, categorias } = req.body; // Recebe o array de IDs de categoria
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const newProductResult = await client.query(
      'INSERT INTO produtos (nome, preco, unidade, imagem) VALUES ($1, $2, $3, $4) RETURNING *',
      [nome, preco, unidade, imagem]
    );
    const newProduct = newProductResult.rows[0];

    if (categorias && categorias.length > 0) {
      for (const catId of categorias) {
        await client.query(
          'INSERT INTO produto_categoria (produto_id, categoria_id) VALUES ($1, $2)',
          [newProduct.id, catId]
        );
      }
    }
    await client.query('COMMIT');
    res.status(201).json(newProduct);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar produto', err);
    res.status(500).send('Erro no servidor');
  } finally {
    client.release();
  }
});


// ========================================================================
// >> NOVAS ROTAS PARA GERENCIAR CATEGORIAS (protegidas) <<
// ========================================================================
app.get('/api/categorias', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categorias ORDER BY nome ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar categorias', err);
    res.status(500).send('Erro no servidor');
  }
});

app.post('/api/categorias', checkPassword, async (req, res) => {
  const { nome } = req.body;
  try {
    const newCategory = await pool.query('INSERT INTO categorias (nome) VALUES ($1) RETURNING *', [nome]);
    res.status(201).json(newCategory.rows[0]);
  } catch (err) {
    res.status(500).send('Erro no servidor');
  }
});

app.put('/api/categorias/:id', checkPassword, async (req, res) => {
  const { id } = req.params;
  const { nome } = req.body;
  try {
    const updatedCategory = await pool.query('UPDATE categorias SET nome = $1 WHERE id = $2 RETURNING *', [nome, id]);
    res.json(updatedCategory.rows[0]);
  } catch (err) {
    res.status(500).send('Erro no servidor');
  }
});

app.delete('/api/categorias/:id', checkPassword, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM categorias WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).send('Erro no servidor');
  }
});


// --- LÓGICA WEBSOCKET E INICIALIZAÇÃO DO SERVIDOR ---
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const clients = new Set();
wss.on('connection', (ws) => { console.log('Novo cliente admin conectado'); clients.add(ws); ws.on('close', () => { console.log('Cliente admin desconectado'); clients.delete(ws); }); ws.on('error', (error) => { console.error('Erro no WebSocket:', error); }); });
function broadcast(message) { const data = JSON.stringify(message); console.log('Enviando mensagem:', data); for (const client of clients) { if (client.readyState === WebSocket.OPEN) { client.send(data); } } }
server.listen(PORT, () => { console.log(`Servidor Híbrido rodando na porta ${PORT}`); });