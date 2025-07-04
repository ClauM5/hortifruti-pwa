// Arquivo: backend/index.js - PARTE 1 DE 3

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const http = require('http');
const WebSocket = require('ws');
const url = require('url');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const webpush = require('web-push');

const app = express();
const server = http.createServer(app);

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

// Arquivo: backend/index.js - PARTE 2 DE 3

// --- ROTAS DA APLICAÇÃO ---
// (Todas as rotas de /api/produtos até /api/cupons/:id continuam aqui, sem alterações)
app.get('/api/produtos', async (req, res) => { const { search, categoria } = req.query; const authHeader = req.headers['authorization']; const token = authHeader && authHeader.split(' ')[1]; let userId = null; if (token) { try { const decoded = jwt.verify(token, process.env.JWT_SECRET); userId = decoded.id; } catch (e) {} } let query = ` SELECT p.*, array_agg(c.nome) as categorias, CASE WHEN f.produto_id IS NOT NULL THEN true ELSE false END as is_favorito FROM produtos p LEFT JOIN produto_categoria pc ON p.id = pc.produto_id LEFT JOIN categorias c ON pc.categoria_id = c.id LEFT JOIN favoritos f ON p.id = f.produto_id AND f.usuario_id = $1 `; const params = [userId]; const conditions = []; if (search) { params.push(`%${search}%`); conditions.push(`p.nome ILIKE $${params.length}`); } if (categoria) { params.push(categoria); conditions.push(`p.id IN (SELECT produto_id FROM produto_categoria WHERE categoria_id = (SELECT id FROM categorias WHERE nome = $${params.length}))`); } if (conditions.length > 0) { query += ` WHERE ${conditions.join(' AND ')}`; } query += ' GROUP BY p.id, f.produto_id ORDER BY p.id ASC'; try { const result = await pool.query(query, params); res.json(result.rows); } catch (err) { res.status(500).send('Erro no servidor'); }});
app.get('/api/categorias', async (req, res) => { try { const result = await pool.query('SELECT * FROM categorias ORDER BY nome ASC'); res.json(result.rows); } catch (err) { res.status(500).send('Erro no servidor'); }});
app.get('/api/banners/ativos', async (req, res) => { try { const result = await pool.query('SELECT * FROM banners WHERE is_active = true ORDER BY ordem ASC'); res.json(result.rows); } catch (err) { res.status(500).send('Erro no servidor'); }});
app.post('/api/auth/register', async (req, res) => { const { nome, email, senha } = req.body; if (!nome || !email || !senha) return res.status(400).json({ message: 'Preencha tudo.' }); try { const salt = await bcrypt.genSalt(10); const senha_hash = await bcrypt.hash(senha, salt); const newUser = await pool.query('INSERT INTO usuarios (nome, email, senha_hash) VALUES ($1, $2, $3) RETURNING id, nome, email', [nome, email, senha_hash]); res.status(201).json(newUser.rows[0]); } catch (err) { if (err.code === '23505') return res.status(400).json({ message: 'E-mail já cadastrado.' }); res.status(500).json({ message: 'Erro no servidor.' }); }});
app.post('/api/auth/login', async (req, res) => { const { email, senha } = req.body; if (!email || !senha) return res.status(400).json({ message: 'Preencha tudo.' }); try { const userResult = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]); if (userResult.rows.length === 0) return res.status(401).json({ message: 'Credenciais inválidas.' }); const user = userResult.rows[0]; const isMatch = await bcrypt.compare(senha, user.senha_hash); if (!isMatch) return res.status(401).json({ message: 'Credenciais inválidas.' }); const payload = { id: user.id, nome: user.nome }; const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' }); res.json({ token, user: payload }); } catch (err) { res.status(500).json({ message: 'Erro no servidor.' }); }});
app.post('/api/pedidos', async (req, res) => { const { nome_cliente, endereco_cliente, itens, metodo_pagamento, troco_para, token, codigo_cupom } = req.body; const client = await pool.connect(); try { await client.query('BEGIN'); let valor_total = itens.reduce((sum, item) => sum + Number(item.preco) * item.quantity, 0); let valor_final = valor_total; if (codigo_cupom) { const cupomResult = await client.query('SELECT * FROM cupons WHERE codigo = $1 AND ativo = true FOR UPDATE', [codigo_cupom.toUpperCase()]); if (cupomResult.rows.length > 0) { const cupom = cupomResult.rows[0]; if (cupom.data_validade && new Date(cupom.data_validade) < new Date()) throw new Error('Cupom expirado.'); if (cupom.usos_maximos != null && cupom.usos_atuais >= cupom.usos_maximos) throw new Error('Cupom atingiu limite de usos.'); let desconto = 0; if (cupom.tipo_desconto === 'PERCENTUAL') { desconto = (valor_total * cupom.valor) / 100; } else { desconto = cupom.valor; } valor_final = Math.max(0, valor_total - desconto); await client.query('UPDATE cupons SET usos_atuais = usos_atuais + 1 WHERE id = $1', [cupom.id]); } } let usuarioId = null; if (token) { try { const decodedUser = jwt.verify(token, process.env.JWT_SECRET); usuarioId = decodedUser.id; } catch (err) {} } const pedidoResult = await client.query( `INSERT INTO pedidos (nome_cliente, endereco_cliente, valor_total, metodo_pagamento, troco_para, usuario_id, codigo_cupom) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, [nome_cliente, endereco_cliente, valor_final, metodo_pagamento, troco_para || null, usuarioId, codigo_cupom || null] ); const novoPedido = pedidoResult.rows[0]; for (const item of itens) { await client.query('INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)', [novoPedido.id, item.id, item.quantity, item.preco]); } await client.query('COMMIT'); novoPedido.itens = itens; broadcastToAdmins({ type: 'NOVO_PEDIDO', payload: novoPedido }); res.status(201).json({ message: 'Pedido criado com sucesso!', pedidoId: novoPedido.id }); } catch (err) { await client.query('ROLLBACK'); res.status(500).json({ message: err.message || 'Erro no servidor.'}); } finally { client.release(); }});
app.post('/api/cupons/validar', async (req, res) => { const { codigo } = req.body; if (!codigo) return res.status(400).json({ message: 'Código é obrigatório.' }); try { const result = await pool.query('SELECT * FROM cupons WHERE codigo = $1 AND ativo = true', [codigo.toUpperCase()]); if (result.rows.length === 0) return res.status(404).json({ message: 'Cupom inválido ou inativo.' }); const cupom = result.rows[0]; if (cupom.data_validade && new Date(cupom.data_validade) < new Date()) return res.status(400).json({ message: 'Cupom expirou.' }); if (cupom.usos_maximos != null && cupom.usos_atuais >= cupom.usos_maximos) return res.status(400).json({ message: 'Cupom atingiu limite.' }); res.json({ message: 'Cupom válido!', cupom }); } catch (err) { res.status(500).send('Erro no servidor'); }});
app.get('/api/vapid-public-key', (req, res) => { res.send(process.env.VAPID_PUBLIC_KEY); });
app.get('/api/meus-pedidos', verifyToken, async (req, res) => { try { const pResult = await pool.query('SELECT * FROM pedidos WHERE usuario_id = $1 ORDER BY data_pedido DESC', [req.user.id]); const p = pResult.rows; for (const ped of p) { const iResult = await pool.query('SELECT ip.*, p.nome as produto_nome FROM itens_pedido ip JOIN produtos p ON ip.produto_id = p.id WHERE ip.pedido_id = $1', [ped.id]); ped.itens = iResult.rows; } res.json(p); } catch (err) { res.status(500).send('Erro'); }});
app.get('/api/pedidos/:id', verifyToken, async (req, res) => { const { id: pId } = req.params; const { id: uId } = req.user; try { const pResult = await pool.query('SELECT * FROM pedidos WHERE id = $1 AND usuario_id = $2', [pId, uId]); if (pResult.rows.length === 0) return res.status(404).send('Pedido não encontrado.'); const p = pResult.rows[0]; const iResult = await pool.query('SELECT ip.*, p.nome as produto_nome FROM itens_pedido ip JOIN produtos p ON ip.produto_id = p.id WHERE ip.pedido_id = $1', [pId]); p.itens = iResult.rows; res.json(p); } catch (err) { res.status(500).send('Erro'); }});
app.get('/api/meus-favoritos', verifyToken, async (req, res) => { try { const result = await pool.query('SELECT produto_id FROM favoritos WHERE usuario_id = $1', [req.user.id]); res.json(result.rows.map(row => row.produto_id)); } catch (err) { res.status(500).json({ message: 'Erro' }); }});
app.post('/api/favoritos', verifyToken, async (req, res) => { const { produtoId } = req.body; try { await pool.query('INSERT INTO favoritos (usuario_id, produto_id) VALUES ($1, $2)', [req.user.id, produtoId]); res.status(201).json({ message: 'Favoritado.' }); } catch (err) { if (err.code === '23505') return res.status(400).json({ message: 'Já favoritado.' }); res.status(500).json({ message: 'Erro' }); }});
app.delete('/api/favoritos/:produtoId', verifyToken, async (req, res) => { const { produtoId } = req.params; try { await pool.query('DELETE FROM favoritos WHERE usuario_id = $1 AND produto_id = $2', [req.user.id, produtoId]); res.status(200).json({ message: 'Desfavoritado.' }); } catch (err) { res.status(500).json({ message: 'Erro' }); }});
app.get('/api/enderecos', verifyToken, async (req, res) => { try { const result = await pool.query('SELECT * FROM enderecos WHERE usuario_id = $1', [req.user.id]); res.json(result.rows); } catch (err) { res.status(500).json({ message: 'Erro' }); }});
app.post('/api/enderecos', verifyToken, async (req, res) => { const { logradouro, numero, complemento, bairro, cidade, estado, cep, nome_identificador } = req.body; try { const newAddress = await pool.query('INSERT INTO enderecos (usuario_id, logradouro, numero, complemento, bairro, cidade, estado, cep, nome_identificador) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *', [req.user.id, logradouro, numero, complemento, bairro, cidade, estado, cep, nome_identificador]); res.status(201).json(newAddress.rows[0]); } catch (err) { res.status(500).json({ message: 'Erro' }); }});
app.delete('/api/enderecos/:id', verifyToken, async (req, res) => { const { id } = req.params; try { await pool.query('DELETE FROM enderecos WHERE id = $1 AND usuario_id = $2', [id, req.user.id]); res.status(204).send(); } catch (err) { res.status(500).json({ message: 'Erro' }); }});
app.post('/api/subscribe', verifyToken, async (req, res) => { const { subscription } = req.body; try { await pool.query('INSERT INTO notificacao_subscriptions (usuario_id, subscription_object) VALUES ($1, $2) ON CONFLICT (usuario_id) DO UPDATE SET subscription_object = $2', [req.user.id, subscription]); res.status(201).json({ message: 'Inscrito.' }); } catch (err) { res.status(500).json({ message: 'Erro' }); }});
app.post('/api/upload', checkPassword, upload.single('image'), async (req, res) => { if (!req.file) return res.status(400).send('No file.'); const b64 = Buffer.from(req.file.buffer).toString("base64"); let dURI = "data:" + req.file.mimetype + ";base64," + b64; try { const r = await cloudinary.uploader.upload(dURI, { folder: "hortifruti-pwa" }); res.status(200).json({ imageUrl: r.secure_url }); } catch (e) { res.status(500).send('Error.'); }});
app.post('/api/produtos', checkPassword, async (req, res) => { const { nome, preco, unidade, imagem, categorias } = req.body; const client = await pool.connect(); try { await client.query('BEGIN'); const r = await pool.query('INSERT INTO produtos (nome, preco, unidade, imagem) VALUES ($1, $2, $3, $4) RETURNING *', [nome, preco, unidade, imagem]); const nP = r.rows[0]; if (categorias && categorias.length > 0) { for (const cId of categorias) { await client.query('INSERT INTO produto_categoria (produto_id, categoria_id) VALUES ($1, $2)', [nP.id, cId]); } } await client.query('COMMIT'); res.status(201).json(nP); } catch (err) { await client.query('ROLLBACK'); res.status(500).send('Erro'); } finally { client.release(); }});
app.put('/api/produtos/:id', checkPassword, async (req, res) => { const { id } = req.params; const { nome, preco, unidade, imagem, categorias } = req.body; const client = await pool.connect(); try { await client.query('BEGIN'); const r = await pool.query('UPDATE produtos SET nome = $1, preco = $2, unidade = $3, imagem = $4 WHERE id = $5 RETURNING *', [nome, preco, unidade, imagem, id]); await client.query('DELETE FROM produto_categoria WHERE produto_id = $1', [id]); if (categorias && categorias.length > 0) { for (const cId of categorias) { await client.query('INSERT INTO produto_categoria (produto_id, categoria_id) VALUES ($1, $2)', [id, cId]); } } await client.query('COMMIT'); res.json(r.rows[0]); } catch (err) { await client.query('ROLLBACK'); res.status(500).send('Erro'); } finally { client.release(); }});
app.delete('/api/produtos/:id', checkPassword, async (req, res) => { const { id } = req.params; try { await pool.query('DELETE FROM produtos WHERE id = $1', [id]); res.status(204).send(); } catch (e) { res.status(500).send('Error.'); }});
app.get('/api/pedidos', checkPassword, async (req, res) => { try { const pResult = await pool.query('SELECT * FROM pedidos ORDER BY data_pedido DESC'); const p = pResult.rows; for (const ped of p) { const iResult = await pool.query('SELECT ip.*, p.nome as produto_nome FROM itens_pedido ip JOIN produtos p ON ip.produto_id = p.id WHERE ip.pedido_id = $1', [ped.id]); ped.itens = iResult.rows; } res.json(p); } catch (e) { res.status(500).send('Error.'); }});
app.put('/api/pedidos/:id/status', checkPassword, async (req, res) => { const { id } = req.params; const { status } = req.body; if (!status) return res.status(400).send('No status.'); try { const result = await pool.query('UPDATE pedidos SET status = $1 WHERE id = $2 RETURNING *', [status, id]); const pA = result.rows[0]; if (pA.usuario_id) { sendMessageToUser(pA.usuario_id, { type: 'STATUS_UPDATE', payload: { pedidoId: pA.id, novoStatus: pA.status } }); sendPushNotification(pA.usuario_id, `Seu pedido #${pA.id} foi atualizado para: ${pA.status}`); } res.json(pA); } catch (err) { res.status(500).send('Erro'); }});
app.post('/api/categorias', checkPassword, async (req, res) => { const { nome } = req.body; try { const r = await pool.query('INSERT INTO categorias (nome) VALUES ($1) RETURNING *', [nome]); res.status(201).json(r.rows[0]); } catch (err) { res.status(500).send('Erro'); }});
app.put('/api/categorias/:id', checkPassword, async (req, res) => { const { id } = req.params; const { nome } = req.body; try { const r = await pool.query('UPDATE categorias SET nome = $1 WHERE id = $2 RETURNING *', [nome, id]); res.json(r.rows[0]); } catch (err) { res.status(500).send('Erro'); }});
app.delete('/api/categorias/:id', checkPassword, async (req, res) => { const { id } = req.params; try { await pool.query('DELETE FROM categorias WHERE id = $1', [id]); res.status(204).send(); } catch (err) { res.status(500).send('Erro'); }});
app.get('/api/banners', checkPassword, async (req, res) => { try { const r = await pool.query('SELECT * FROM banners ORDER BY ordem ASC'); res.json(r.rows); } catch (err) { res.status(500).send('Erro'); }});
app.post('/api/banners', checkPassword, async (req, res) => { const { imagem_url, link_url, titulo, subtitulo, is_active, ordem } = req.body; try { const r = await pool.query('INSERT INTO banners (imagem_url, link_url, titulo, subtitulo, is_active, ordem) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [imagem_url, link_url, titulo, subtitulo, is_active, ordem]); res.status(201).json(r.rows[0]); } catch (err) { res.status(500).send('Erro'); }});
app.put('/api/banners/:id', checkPassword, async (req, res) => { const { id } = req.params; const { imagem_url, link_url, titulo, subtitulo, is_active, ordem } = req.body; try { const r = await pool.query('UPDATE banners SET imagem_url = $1, link_url = $2, titulo = $3, subtitulo = $4, is_active = $5, ordem = $6 WHERE id = $7 RETURNING *', [imagem_url, link_url, titulo, subtitulo, is_active, ordem, id]); res.json(r.rows[0]); } catch (err) { res.status(500).send('Erro'); }});
app.delete('/api/banners/:id', checkPassword, async (req, res) => { const { id } = req.params; try { await pool.query('DELETE FROM banners WHERE id = $1', [id]); res.status(204).send(); } catch (err) { res.status(500).send('Erro'); }});
app.get('/api/cupons', checkPassword, async (req, res) => { try { const r = await pool.query('SELECT * FROM cupons ORDER BY id ASC'); res.json(r.rows); } catch (err) { res.status(500).send('Erro'); }});
app.post('/api/cupons', checkPassword, async (req, res) => { const { codigo, tipo_desconto, valor, data_validade, ativo, usos_maximos } = req.body; try { const r = await pool.query('INSERT INTO cupons (codigo, tipo_desconto, valor, data_validade, ativo, usos_maximos) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [codigo.toUpperCase(), tipo_desconto, valor, data_validade || null, ativo, usos_maximos || null]); res.status(201).json(r.rows[0]); } catch (err) { if (err.code === '23505') return res.status(400).json({ message: 'Código já existe.' }); res.status(500).send('Erro'); }});
app.put('/api/cupons/:id', checkPassword, async (req, res) => { const { id } = req.params; const { codigo, tipo_desconto, valor, data_validade, ativo, usos_maximos } = req.body; try { const r = await pool.query('UPDATE cupons SET codigo = $1, tipo_desconto = $2, valor = $3, data_validade = $4, ativo = $5, usos_maximos = $6 WHERE id = $7 RETURNING *', [codigo.toUpperCase(), tipo_desconto, valor, data_validade || null, ativo, usos_maximos || null, id]); res.json(r.rows[0]); } catch (err) { if (err.code === '23505') return res.status(400).json({ message: 'Código já existe.' }); res.status(500).send('Erro'); }});
app.delete('/api/cupons/:id', checkPassword, async (req, res) => { const { id } = req.params; try { await pool.query('DELETE FROM cupons WHERE id = $1', [id]); res.status(204).send(); } catch (err) { res.status(500).send('Erro'); }});

// ROTA NOVA PARA O DASHBOARD
app.get('/api/admin/stats', checkPassword, async (req, res) => {
  try {
    const totalPedidosResult = await pool.query('SELECT COUNT(*) FROM pedidos');
    const receitaResult = await pool.query("SELECT SUM(valor_total) FROM pedidos WHERE status = 'Entregue'");
    const pendentesResult = await pool.query("SELECT COUNT(*) FROM pedidos WHERE status NOT IN ('Entregue', 'Cancelado')");
    const ultimosPedidosResult = await pool.query('SELECT id, nome_cliente, valor_total, status FROM pedidos ORDER BY data_pedido DESC LIMIT 5');

    res.json({
      totalPedidos: totalPedidosResult.rows[0].count,
      receitaTotal: receitaResult.rows[0].sum || 0,
      pedidosPendentes: pendentesResult.rows[0].count,
      ultimosPedidos: ultimosPedidosResult.rows,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar estatísticas.' });
  }
});

// Arquivo: backend/index.js - PARTE 3 DE 3

// --- LÓGICA WEBSOCKET E PUSH NOTIFICATIONS ---
const wss = new WebSocket.Server({ server });
const userConnections = new Map();
const adminConnections = new Set();

wss.on('connection', (ws, req) => {
    const parameters = new URL(req.url, `http://${req.headers.host}`).searchParams;
    const token = parameters.get('token');
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                console.error('Erro de verificação do JWT no WebSocket:', err.message);
                ws.close();
            } else {
                userConnections.set(user.id, ws);
                ws.userId = user.id;
            }
        });
    } else {
        adminConnections.add(ws);
    }
    ws.on('close', () => {
        if (ws.userId) {
            userConnections.delete(ws.userId);
        } else {
            adminConnections.delete(ws);
        }
    });
});

async function sendPushNotification(userId, messagePayload) {
    if (!process.env.VAPID_PUBLIC_KEY) return;
    try {
        const subResult = await pool.query('SELECT subscription_object FROM notificacao_subscriptions WHERE usuario_id = $1', [userId]);
        if (subResult.rows.length > 0) {
            const subscription = subResult.rows[0].subscription_object;
            const payload = JSON.stringify({ title: 'Hortifruti Frescor', body: messagePayload });
            await webpush.sendNotification(subscription, payload);
        }
    } catch (error) {
        if (error.statusCode === 410) {
            await pool.query('DELETE FROM notificacao_subscriptions WHERE usuario_id = $1', [userId]);
        } else {
            console.error('Erro ao enviar push notification:', error);
        }
    }
}

function sendMessageToUser(userId, message) {
    const connection = userConnections.get(userId);
    if (connection && connection.readyState === WebSocket.OPEN) {
        connection.send(JSON.stringify(message));
    }
}

function broadcastToAdmins(message) {
    const data = JSON.stringify(message);
    for (const client of adminConnections) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    }
}

// --- INICIALIZAÇÃO FINAL DO SERVIDOR ---
server.listen(PORT, () => {
  console.log(`Servidor Híbrido rodando na porta ${PORT}`);
});