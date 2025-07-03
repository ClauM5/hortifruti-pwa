// Arquivo: backend/index.js - Passo 3: Rotas Públicas

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const WebSocket = require('ws');
const url = require('url');
const webpush = require('web-push');

const app = express();
const server = http.createServer(app);

// --- CONFIGURAÇÕES GLOBAIS E MIDDLEWARES ---
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) { webpush.setVapidDetails('mailto:seu-email@exemplo.com', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY); }
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const checkPassword = (req, res, next) => { const { authorization } = req.headers; if (authorization === process.env.ADMIN_PASSWORD) { next(); } else { res.status(403).send('Acesso negado.'); } };
const verifyToken = (req, res, next) => { const authHeader = req.headers['authorization']; const token = authHeader && authHeader.split(' ')[1]; if (!token) { return res.status(401).json({ message: 'Token não fornecido.' }); } jwt.verify(token, process.env.JWT_SECRET, (err, user) => { if (err) { return res.status(403).json({ message: 'Token inválido.' }); } req.user = user; next(); }); };

// ========================================================================
// >> NOVO BLOCO: ROTAS PÚBLICAS <<
// ========================================================================

// Rota de Produtos (Pública, mas sensível ao login)
app.get('/api/produtos', async (req, res) => { const { search, categoria } = req.query; const authHeader = req.headers['authorization']; const token = authHeader && authHeader.split(' ')[1]; let userId = null; if (token) { try { const decoded = jwt.verify(token, process.env.JWT_SECRET); userId = decoded.id; } catch (e) {} } let query = ` SELECT p.*, array_agg(c.nome) as categorias, CASE WHEN f.produto_id IS NOT NULL THEN true ELSE false END as is_favorito FROM produtos p LEFT JOIN produto_categoria pc ON p.id = pc.produto_id LEFT JOIN categorias c ON pc.categoria_id = c.id LEFT JOIN favoritos f ON p.id = f.produto_id AND f.usuario_id = $1 `; const params = [userId]; const conditions = []; if (search) { params.push(`%${search}%`); conditions.push(`p.nome ILIKE $${params.length}`); } if (categoria) { params.push(categoria); conditions.push(`p.id IN (SELECT produto_id FROM produto_categoria WHERE categoria_id = (SELECT id FROM categorias WHERE nome = $${params.length}))`); } if (conditions.length > 0) { query += ` WHERE ${conditions.join(' AND ')}`; } query += ' GROUP BY p.id, f.produto_id ORDER BY p.id ASC'; try { const result = await pool.query(query, params); res.json(result.rows); } catch (err) { console.error('Erro ao buscar produtos:', err); res.status(500).send('Erro no servidor'); }});

// Rota de Categorias (Pública)
app.get('/api/categorias', async (req, res) => { try { const result = await pool.query('SELECT * FROM categorias ORDER BY nome ASC'); res.json(result.rows); } catch (err) { res.status(500).send('Erro no servidor'); }});

// Rota de Banners (Pública)
app.get('/api/banners/ativos', async (req, res) => { try { const result = await pool.query('SELECT * FROM banners WHERE is_active = true ORDER BY ordem ASC'); res.json(result.rows); } catch (err) { res.status(500).send('Erro no servidor'); }});

// Rota de Autenticação (Públicas)
app.post('/api/auth/register', async (req, res) => { const { nome, email, senha } = req.body; if (!nome || !email || !senha) return res.status(400).json({ message: 'Preencha tudo.' }); try { const salt = await bcrypt.genSalt(10); const senha_hash = await bcrypt.hash(senha, salt); await pool.query('INSERT INTO usuarios (nome, email, senha_hash) VALUES ($1, $2, $3)', [nome, email, senha_hash]); res.status(201).json({message: 'Usuário criado com sucesso'}); } catch (err) { if (err.code === '23505') return res.status(400).json({ message: 'E-mail já cadastrado.' }); res.status(500).json({ message: 'Erro no servidor.' }); }});
app.post('/api/auth/login', async (req, res) => { const { email, senha } = req.body; if (!email || !senha) return res.status(400).json({ message: 'Preencha tudo.' }); try { const userResult = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]); if (userResult.rows.length === 0) return res.status(401).json({ message: 'Credenciais inválidas.' }); const user = userResult.rows[0]; const isMatch = await bcrypt.compare(senha, user.senha_hash); if (!isMatch) return res.status(401).json({ message: 'Credenciais inválidas.' }); const payload = { id: user.id, nome: user.nome }; const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' }); res.json({ token, user: payload }); } catch (err) { res.status(500).json({ message: 'Erro no servidor.' }); }});

// Rota de Pedidos (Pública)
app.post('/api/pedidos', async (req, res) => { const { nome_cliente, endereco_cliente, itens, metodo_pagamento, troco_para, token, codigo_cupom } = req.body; const client = await pool.connect(); try { await client.query('BEGIN'); let valor_total = itens.reduce((sum, item) => sum + Number(item.preco) * item.quantity, 0); let valor_final = valor_total; if (codigo_cupom) { const cupomResult = await client.query('SELECT * FROM cupons WHERE codigo = $1 AND ativo = true FOR UPDATE', [codigo_cupom.toUpperCase()]); if (cupomResult.rows.length > 0) { const cupom = cupomResult.rows[0]; if (cupom.data_validade && new Date(cupom.data_validade) < new Date()) throw new Error('Cupom expirado.'); if (cupom.usos_maximos != null && cupom.usos_atuais >= cupom.usos_maximos) throw new Error('Cupom atingiu limite de usos.'); let desconto = 0; if (cupom.tipo_desconto === 'PERCENTUAL') { desconto = (valor_total * cupom.valor) / 100; } else { desconto = cupom.valor; } valor_final = Math.max(0, valor_total - desconto); await client.query('UPDATE cupons SET usos_atuais = usos_atuais + 1 WHERE id = $1', [cupom.id]); } } let usuarioId = null; if (token) { try { const decodedUser = jwt.verify(token, process.env.JWT_SECRET); usuarioId = decodedUser.id; } catch (err) {} } const pedidoResult = await client.query( `INSERT INTO pedidos (nome_cliente, endereco_cliente, valor_total, metodo_pagamento, troco_para, usuario_id, codigo_cupom) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, [nome_cliente, endereco_cliente, valor_final, metodo_pagamento, troco_para || null, usuarioId, codigo_cupom || null] ); const novoPedido = pedidoResult.rows[0]; for (const item of itens) { await client.query('INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)', [novoPedido.id, item.id, item.quantity, item.preco]); } await client.query('COMMIT'); novoPedido.itens = itens; res.status(201).json({ message: 'Pedido criado com sucesso!', pedidoId: novoPedido.id }); } catch (err) { await client.query('ROLLBACK'); res.status(500).json({ message: err.message || 'Erro no servidor.'}); } finally { client.release(); }});

// Rota de Cupons (Pública)
app.post('/api/cupons/validar', async (req, res) => { const { codigo } = req.body; if (!codigo) return res.status(400).json({ message: 'Código é obrigatório.' }); try { const result = await pool.query('SELECT * FROM cupons WHERE codigo = $1 AND ativo = true', [codigo.toUpperCase()]); if (result.rows.length === 0) return res.status(404).json({ message: 'Cupom inválido ou inativo.' }); const cupom = result.rows[0]; if (cupom.data_validade && new Date(cupom.data_validade) < new Date()) return res.status(400).json({ message: 'Cupom expirou.' }); if (cupom.usos_maximos != null && cupom.usos_atuais >= cupom.usos_maximos) return res.status(400).json({ message: 'Cupom atingiu limite.' }); res.json({ message: 'Cupom válido!', cupom }); } catch (err) { res.status(500).send('Erro no servidor'); }});

// Rota de Push Notifications (Pública)
app.get('/api/vapid-public-key', (req, res) => { res.send(process.env.VAPID_PUBLIC_KEY); });


// Rota de teste
app.get('/', (req, res) => {
  res.send('Servidor com rotas públicas carregado!');
});


// --- INICIALIZAÇÃO DO SERVIDOR ---
server.listen(PORT, () => {
  console.log(`Servidor base rodando na porta ${PORT}`);
});