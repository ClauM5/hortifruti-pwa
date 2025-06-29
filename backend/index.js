// Arquivo: backend/index.js (Versão 8 - Com Autenticação)

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
// 1. NOVOS IMPORTS PARA SEGURANÇA
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
  if (authorization === process.env.ADMIN_PASSWORD) { next(); } 
  else { res.status(403).send('Acesso negado: senha incorreta.'); }
};

// --- ROTAS ANTIGAS (sem alterações) ---
app.get('/api/produtos', async (req, res) => { try { const r = await pool.query('SELECT * FROM produtos ORDER BY id ASC'); res.json(r.rows); } catch (e) { res.status(500).send('Erro'); }});
app.post('/api/pedidos', async (req, res) => { const { nome_cliente, endereco_cliente, itens, metodo_pagamento, troco_para } = req.body; const v = itens.reduce((s, i) => s + Number(i.preco) * i.quantity, 0); const c = await pool.connect(); if (!nome_cliente || !endereco_cliente || !itens || !itens.length || !metodo_pagamento) { return res.status(400).send('Dados incompletos.'); } try { await c.query('BEGIN'); const p = await c.query(`INSERT INTO pedidos (nome_cliente, endereco_cliente, valor_total, metodo_pagamento, troco_para) VALUES ($1, $2, $3, $4, $5) RETURNING id`, [nome_cliente, endereco_cliente, v, metodo_pagamento, troco_para || null]); const pId = p.rows[0].id; for (const i of itens) { await c.query('INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)', [pId, i.id, i.quantity, i.preco]); } await c.query('COMMIT'); res.status(201).json({ message: 'Pedido criado!', pedidoId: pId }); } catch (e) { await c.query('ROLLBACK'); console.error('Erro:', e); res.status(500).send('Erro.'); } finally { c.release(); } });
app.post('/api/upload', checkPassword, upload.single('image'), async (req, res) => { if (!req.file) return res.status(400).send('No file.'); const b64 = Buffer.from(req.file.buffer).toString("base64"); let dURI = "data:" + req.file.mimetype + ";base64," + b64; try { const r = await cloudinary.uploader.upload(dURI, { folder: "hortifruti-pwa" }); res.status(200).json({ imageUrl: r.secure_url }); } catch (e) { res.status(500).send('Error.'); }});
app.post('/api/produtos', checkPassword, async (req, res) => { const { nome, preco, unidade, imagem } = req.body; try { const r = await pool.query('INSERT INTO produtos (nome, preco, unidade, imagem) VALUES ($1, $2, $3, $4) RETURNING *', [nome, preco, unidade, imagem]); res.status(201).json(r.rows[0]); } catch (e) { res.status(500).send('Error.'); }});
app.put('/api/produtos/:id', checkPassword, async (req, res) => { const { id } = req.params; const { nome, preco, unidade, imagem } = req.body; try { const r = await pool.query('UPDATE produtos SET nome = $1, preco = $2, unidade = $3, imagem = $4 WHERE id = $5 RETURNING *', [nome, preco, unidade, imagem, id]); res.json(r.rows[0]); } catch (e) { res.status(500).send('Error.'); }});
app.delete('/api/produtos/:id', checkPassword, async (req, res) => { const { id } = req.params; try { await pool.query('DELETE FROM produtos WHERE id = $1', [id]); res.status(204).send(); } catch (e) { res.status(500).send('Error.'); }});
app.get('/api/pedidos', checkPassword, async (req, res) => { try { const pResult = await pool.query('SELECT * FROM pedidos ORDER BY data_pedido DESC'); const p = pResult.rows; for (const ped of p) { const iResult = await pool.query('SELECT * FROM itens_pedido WHERE pedido_id = $1', [ped.id]); ped.itens = iResult.rows; } res.json(p); } catch (e) { res.status(500).send('Error.'); }});
app.put('/api/pedidos/:id/status', checkPassword, async (req, res) => { const { id } = req.params; const { status } = req.body; if (!status) return res.status(400).send('No status.'); try { const u = await pool.query('UPDATE pedidos SET status = $1 WHERE id = $2 RETURNING *', [status, id]); res.json(u.rows[0]); } catch (e) { res.status(500).send('Error.'); }});

// ========================================================================
// >> NOVAS ROTAS DE AUTENTICAÇÃO DE USUÁRIO <<
// ========================================================================

// Rota para REGISTRAR um novo usuário
app.post('/api/auth/register', async (req, res) => {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha) {
    return res.status(400).json({ message: 'Por favor, preencha todos os campos.' });
  }
  try {
    // Criptografa a senha antes de salvar
    const salt = await bcrypt.genSalt(10);
    const senha_hash = await bcrypt.hash(senha, salt);

    const newUser = await pool.query(
      'INSERT INTO usuarios (nome, email, senha_hash) VALUES ($1, $2, $3) RETURNING id, nome, email',
      [nome, email, senha_hash]
    );
    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    // Verifica se o erro é de chave duplicada (email já existe)
    if (err.code === '23505') { 
      return res.status(400).json({ message: 'Este e-mail já está cadastrado.' });
    }
    console.error('Erro no registro:', err);
    res.status(500).json({ message: 'Erro no servidor.' });
  }
});

// Rota para LOGIN de um usuário
app.post('/api/auth/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ message: 'Por favor, preencha todos os campos.' });
  }
  try {
    // Encontra o usuário pelo email
    const userResult = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Credenciais inválidas.' }); // Usuário não encontrado
    }
    const user = userResult.rows[0];

    // Compara a senha enviada com a senha criptografada no banco
    const isMatch = await bcrypt.compare(senha, user.senha_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciais inválidas.' }); // Senha não bate
    }

    // Se a senha estiver correta, cria o "crachá digital" (JWT)
    const payload = {
      id: user.id,
      nome: user.nome
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' }); // Token expira em 1 dia

    res.json({ token, user: payload });

  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ message: 'Erro no servidor.' });
  }
});


// --- INICIALIZAÇÃO DO SERVIDOR ---
app.listen(PORT, () => {
  console.log(`Servidor do Hortifruti rodando na porta ${PORT}`);
});