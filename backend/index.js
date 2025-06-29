// Arquivo: backend/index.js (Versão 10 - Com WebSockets)

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. NOVOS IMPORTS PARA O SERVIDOR HÍBRIDO
const http = require('http');
const WebSocket = require('ws');

const app = express();
app.use(cors());
app.use(express.json());

// --- CONFIGURAÇÕES ---
const PORT = process.env.PORT || 3001;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
cloudinary.config({ /* ...cloudinary config... */ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, });
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- MIDDLEWARES ---
const checkPassword = (req, res, next) => { /* ...checkPassword... */ const { authorization } = req.headers; if (authorization === process.env.ADMIN_PASSWORD) { next(); } else { res.status(403).send('Acesso negado.'); } };
const verifyToken = (req, res, next) => { /* ...verifyToken... */ const authHeader = req.headers['authorization']; const token = authHeader && authHeader.split(' ')[1]; if (!token) { return res.status(401).send('Acesso negado: token não fornecido.'); } jwt.verify(token, process.env.JWT_SECRET, (err, user) => { if (err) { return res.status(403).send('Acesso negado: token inválido.'); } req.user = user; next(); }); };


// --- ROTAS ---
// ... (Todas as suas rotas de API, de /api/produtos até /api/meus-pedidos, continuam aqui, sem alterações)
app.get('/api/produtos', async (req, res) => { try { const r = await pool.query('SELECT * FROM produtos ORDER BY id ASC'); res.json(r.rows); } catch (e) { res.status(500).send('Erro'); }});
app.post('/api/auth/register', async (req, res) => { const { nome, email, senha } = req.body; if (!nome || !email || !senha) return res.status(400).json({ message: 'Preencha tudo.' }); try { const salt = await bcrypt.genSalt(10); const senha_hash = await bcrypt.hash(senha, salt); const newUser = await pool.query('INSERT INTO usuarios (nome, email, senha_hash) VALUES ($1, $2, $3) RETURNING id, nome, email', [nome, email, senha_hash]); res.status(201).json(newUser.rows[0]); } catch (err) { if (err.code === '23505') return res.status(400).json({ message: 'E-mail já cadastrado.' }); res.status(500).json({ message: 'Erro no servidor.' }); }});
app.post('/api/auth/login', async (req, res) => { const { email, senha } = req.body; if (!email || !senha) return res.status(400).json({ message: 'Preencha tudo.' }); try { const userResult = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]); if (userResult.rows.length === 0) return res.status(401).json({ message: 'Credenciais inválidas.' }); const user = userResult.rows[0]; const isMatch = await bcrypt.compare(senha, user.senha_hash); if (!isMatch) return res.status(401).json({ message: 'Credenciais inválidas.' }); const payload = { id: user.id, nome: user.nome }; const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' }); res.json({ token, user: payload }); } catch (err) { res.status(500).json({ message: 'Erro no servidor.' }); }});
app.post('/api/upload', checkPassword, upload.single('image'), async (req, res) => { if (!req.file) return res.status(400).send('No file.'); const b64 = Buffer.from(req.file.buffer).toString("base64"); let dURI = "data:" + req.file.mimetype + ";base64," + b64; try { const r = await cloudinary.uploader.upload(dURI, { folder: "hortifruti-pwa" }); res.status(200).json({ imageUrl: r.secure_url }); } catch (e) { res.status(500).send('Error.'); }});
app.post('/api/produtos', checkPassword, async (req, res) => { const { nome, preco, unidade, imagem } = req.body; try { const r = await pool.query('INSERT INTO produtos (nome, preco, unidade, imagem) VALUES ($1, $2, $3, $4) RETURNING *', [nome, preco, unidade, imagem]); res.status(201).json(r.rows[0]); } catch (e) { res.status(500).send('Error.'); }});
app.put('/api/produtos/:id', checkPassword, async (req, res) => { const { id } = req.params; const { nome, preco, unidade, imagem } = req.body; try { const r = await pool.query('UPDATE produtos SET nome = $1, preco = $2, unidade = $3, imagem = $4 WHERE id = $5 RETURNING *', [nome, preco, unidade, imagem, id]); res.json(r.rows[0]); } catch (e) { res.status(500).send('Error.'); }});
app.delete('/api/produtos/:id', checkPassword, async (req, res) => { const { id } = req.params; try { await pool.query('DELETE FROM produtos WHERE id = $1', [id]); res.status(204).send(); } catch (e) { res.status(500).send('Error.'); }});
app.get('/api/pedidos', checkPassword, async (req, res) => { try { const pResult = await pool.query('SELECT * FROM pedidos ORDER BY data_pedido DESC'); const p = pResult.rows; for (const ped of p) { const iResult = await pool.query('SELECT * FROM itens_pedido WHERE pedido_id = $1', [ped.id]); ped.itens = iResult.rows; } res.json(p); } catch (e) { res.status(500).send('Error.'); }});
app.put('/api/pedidos/:id/status', checkPassword, async (req, res) => { const { id } = req.params; const { status } = req.body; if (!status) return res.status(400).send('No status.'); try { const u = await pool.query('UPDATE pedidos SET status = $1 WHERE id = $2 RETURNING *', [status, id]); res.json(u.rows[0]); } catch (e) { res.status(500).send('Error.'); }});
app.get('/api/meus-pedidos', verifyToken, async (req, res) => { try { const pResult = await pool.query('SELECT * FROM pedidos WHERE usuario_id = $1 ORDER BY data_pedido DESC', [req.user.id]); const p = pResult.rows; for (const ped of p) { const iResult = await pool.query('SELECT * FROM itens_pedido WHERE pedido_id = $1', [ped.id]); ped.itens = iResult.rows; } res.json(p); } catch (err) { res.status(500).send('Error'); }});


// ========================================================================
// >> ROTA DE CRIAÇÃO DE PEDIDOS ATUALIZADA PARA NOTIFICAR <<
// ========================================================================
app.post('/api/pedidos', async (req, res) => {
  const { nome_cliente, endereco_cliente, itens, metodo_pagamento, troco_para, token } = req.body;
  const valor_total = itens.reduce((sum, item) => sum + Number(item.preco) * item.quantity, 0);
  const client = await pool.connect();
  let usuarioId = null;

  if (token) {
    try {
      const decodedUser = jwt.verify(token, process.env.JWT_SECRET);
      usuarioId = decodedUser.id;
    } catch (err) { console.log("Token de pedido inválido, criando como convidado."); }
  }

  if (!nome_cliente || !endereco_cliente || !itens || !itens.length || !metodo_pagamento) { return res.status(400).send('Dados incompletos.'); }
  try {
    await client.query('BEGIN');
    const pedidoResult = await client.query( `INSERT INTO pedidos (nome_cliente, endereco_cliente, valor_total, metodo_pagamento, troco_para, usuario_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [nome_cliente, endereco_cliente, valor_total, metodo_pagamento, troco_para || null, usuarioId] );
    const novoPedido = pedidoResult.rows[0];
    
    for (const item of itens) {
      await client.query('INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)', [novoPedido.id, item.id, item.quantity, item.preco]);
    }
    
    await client.query('COMMIT');
    
    // 4. "GRITA" PARA TODOS OS PAINÉIS DE ADMIN CONECTADOS
    broadcast({ type: 'NOVO_PEDIDO', payload: novoPedido });
    
    res.status(201).json({ message: 'Pedido criado!', pedidoId: novoPedido.id });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro:', err);
    res.status(500).send('Erro ao criar pedido.');
  } finally {
    client.release();
  }
});


// ========================================================================
// >> LÓGICA DO SERVIDOR WEBSOCKET <<
// ========================================================================

// 2. CRIA UM SERVIDOR HTTP A PARTIR DO NOSSO APP EXPRESS
const server = http.createServer(app);

// 3. CRIA O SERVIDOR WEBSOCKET E O "ANEXA" AO SERVIDOR HTTP
const wss = new WebSocket.Server({ server });

// Guarda todos os clientes (painéis de admin) conectados
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('Novo cliente admin conectado ao WebSocket');
  clients.add(ws);

  ws.on('close', () => {
    console.log('Cliente admin desconectado');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('Erro no WebSocket:', error);
  });
});

// Função para enviar uma mensagem para TODOS os clientes conectados
function broadcast(message) {
  const data = JSON.stringify(message);
  console.log('Enviando mensagem para todos os clientes:', data);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

// --- INICIALIZAÇÃO DO SERVIDOR ---
// Agora quem "ouve" na porta é o servidor híbrido, não mais o app
server.listen(PORT, () => {
  console.log(`Servidor Híbrido (HTTP + WebSocket) rodando na porta ${PORT}`);
});