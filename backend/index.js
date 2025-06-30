// Arquivo: backend/index.js (Versão 14 - Com Rota de Detalhe do Pedido)

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

const app = express();
app.use(cors());
app.use(express.json());

// --- CONFIGURAÇÕES E MIDDLEWARES ---
const PORT = process.env.PORT || 3001;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const checkPassword = (req, res, next) => { const { authorization } = req.headers; if (authorization === process.env.ADMIN_PASSWORD) { next(); } else { res.status(403).send('Acesso negado.'); } };
const verifyToken = (req, res, next) => { const authHeader = req.headers['authorization']; const token = authHeader && authHeader.split(' ')[1]; if (!token) { return res.status(401).json({ message: 'Token não fornecido.' }); } jwt.verify(token, process.env.JWT_SECRET, (err, user) => { if (err) { return res.status(403).json({ message: 'Token inválido.' }); } req.user = user; next(); }); };

// --- ROTAS ---
app.get('/api/produtos', async (req, res) => { const { search, categoria } = req.query; const authHeader = req.headers['authorization']; const token = authHeader && authHeader.split(' ')[1]; let userId = null; if (token) { try { const decoded = jwt.verify(token, process.env.JWT_SECRET); userId = decoded.id; } catch (e) {} } let query = ` SELECT p.*, array_agg(c.nome) as categorias, CASE WHEN f.produto_id IS NOT NULL THEN true ELSE false END as is_favorito FROM produtos p LEFT JOIN produto_categoria pc ON p.id = pc.produto_id LEFT JOIN categorias c ON pc.categoria_id = c.id LEFT JOIN favoritos f ON p.id = f.produto_id AND f.usuario_id = $1 `; const params = [userId]; const conditions = []; if (search) { params.push(`%${search}%`); conditions.push(`p.nome ILIKE $${params.length}`); } if (categoria) { params.push(categoria); conditions.push(`p.id IN (SELECT produto_id FROM produto_categoria WHERE categoria_id = (SELECT id FROM categorias WHERE nome = $${params.length}))`); } if (conditions.length > 0) { query += ` WHERE ${conditions.join(' AND ')}`; } query += ' GROUP BY p.id, f.produto_id ORDER BY p.id ASC'; try { const result = await pool.query(query, params); res.json(result.rows); } catch (err) { console.error('Erro ao buscar produtos:', err); res.status(500).send('Erro no servidor'); }});
app.post('/api/auth/register', async (req, res) => { const { nome, email, senha } = req.body; if (!nome || !email || !senha) return res.status(400).json({ message: 'Preencha tudo.' }); try { const salt = await bcrypt.genSalt(10); const senha_hash = await bcrypt.hash(senha, salt); const newUser = await pool.query('INSERT INTO usuarios (nome, email, senha_hash) VALUES ($1, $2, $3) RETURNING id, nome, email', [nome, email, senha_hash]); res.status(201).json(newUser.rows[0]); } catch (err) { if (err.code === '23505') return res.status(400).json({ message: 'E-mail já cadastrado.' }); res.status(500).json({ message: 'Erro no servidor.' }); }});
app.post('/api/auth/login', async (req, res) => { const { email, senha } = req.body; if (!email || !senha) return res.status(400).json({ message: 'Preencha tudo.' }); try { const userResult = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]); if (userResult.rows.length === 0) return res.status(401).json({ message: 'Credenciais inválidas.' }); const user = userResult.rows[0]; const isMatch = await bcrypt.compare(senha, user.senha_hash); if (!isMatch) return res.status(401).json({ message: 'Credenciais inválidas.' }); const payload = { id: user.id, nome: user.nome }; const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' }); res.json({ token, user: payload }); } catch (err) { res.status(500).json({ message: 'Erro no servidor.' }); }});
app.post('/api/pedidos', async (req, res) => { const { nome_cliente, endereco_cliente, itens, metodo_pagamento, troco_para, token } = req.body; const v = itens.reduce((s, i) => s + Number(i.preco) * i.quantity, 0); const c = await pool.connect(); let uId = null; if (token) { try { const dUser = jwt.verify(token, process.env.JWT_SECRET); uId = dUser.id; } catch (err) { console.log("Token inválido"); } } if (!nome_cliente || !endereco_cliente || !itens || !itens.length || !metodo_pagamento) { return res.status(400).send('Dados incompletos.'); } try { await c.query('BEGIN'); const p = await c.query(`INSERT INTO pedidos (nome_cliente, endereco_cliente, valor_total, metodo_pagamento, troco_para, usuario_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [nome_cliente, endereco_cliente, v, metodo_pagamento, troco_para || null, uId]); const nPed = p.rows[0]; for (const i of itens) { await c.query('INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)', [nPed.id, i.id, i.quantity, i.preco]); } await c.query('COMMIT'); nPed.itens = itens; broadcastToAdmins({ type: 'NOVO_PEDIDO', payload: nPed }); res.status(201).json({ message: 'Pedido criado!', pedidoId: nPed.id }); } catch (e) { await c.query('ROLLBACK'); console.error('Erro:', e); res.status(500).send('Erro ao criar pedido.'); } finally { c.release(); } });
app.get('/api/meus-pedidos', verifyToken, async (req, res) => { try { const pResult = await pool.query('SELECT * FROM pedidos WHERE usuario_id = $1 ORDER BY data_pedido DESC', [req.user.id]); const p = pResult.rows; for (const ped of p) { const iResult = await pool.query('SELECT * FROM itens_pedido WHERE pedido_id = $1', [ped.id]); ped.itens = iResult.rows; } res.json(p); } catch (err) { res.status(500).send('Error'); }});
app.post('/api/upload', checkPassword, upload.single('image'), async (req, res) => { if (!req.file) return res.status(400).send('No file.'); const b64 = Buffer.from(req.file.buffer).toString("base64"); let dURI = "data:" + req.file.mimetype + ";base64," + b64; try { const r = await cloudinary.uploader.upload(dURI, { folder: "hortifruti-pwa" }); res.status(200).json({ imageUrl: r.secure_url }); } catch (e) { res.status(500).send('Error.'); }});
app.post('/api/produtos', checkPassword, async (req, res) => { const { nome, preco, unidade, imagem, categorias } = req.body; const client = await pool.connect(); try { await client.query('BEGIN'); const newProductResult = await pool.query('INSERT INTO produtos (nome, preco, unidade, imagem) VALUES ($1, $2, $3, $4) RETURNING *', [nome, preco, unidade, imagem]); const newProduct = newProductResult.rows[0]; if (categorias && categorias.length > 0) { for (const catId of categorias) { await client.query('INSERT INTO produto_categoria (produto_id, categoria_id) VALUES ($1, $2)', [newProduct.id, catId]); } } await client.query('COMMIT'); res.status(201).json(newProduct); } catch (err) { await client.query('ROLLBACK'); res.status(500).send('Erro no servidor'); } finally { client.release(); }});
app.put('/api/produtos/:id', checkPassword, async (req, res) => { const { id } = req.params; const { nome, preco, unidade, imagem, categorias } = req.body; const client = await pool.connect(); try { await client.query('BEGIN'); const updatedProduct = await pool.query('UPDATE produtos SET nome = $1, preco = $2, unidade = $3, imagem = $4 WHERE id = $5 RETURNING *', [nome, preco, unidade, imagem, id]); await client.query('DELETE FROM produto_categoria WHERE produto_id = $1', [id]); if (categorias && categorias.length > 0) { for (const catId of categorias) { await client.query('INSERT INTO produto_categoria (produto_id, categoria_id) VALUES ($1, $2)', [id, catId]); } } await client.query('COMMIT'); res.json(updatedProduct.rows[0]); } catch (err) { await client.query('ROLLBACK'); res.status(500).send('Erro no servidor'); } finally { client.release(); }});
app.delete('/api/produtos/:id', checkPassword, async (req, res) => { const { id } = req.params; try { await pool.query('DELETE FROM produtos WHERE id = $1', [id]); res.status(204).send(); } catch (e) { res.status(500).send('Error.'); }});
app.get('/api/pedidos', checkPassword, async (req, res) => { try { const pResult = await pool.query('SELECT * FROM pedidos ORDER BY data_pedido DESC'); const p = pResult.rows; for (const ped of p) { const iResult = await pool.query('SELECT ip.*, p.nome as produto_nome FROM itens_pedido ip JOIN produtos p ON ip.produto_id = p.id WHERE ip.pedido_id = $1', [ped.id]); ped.itens = iResult.rows; } res.json(p); } catch (e) { console.error(e); res.status(500).send('Error.'); }});
app.put('/api/pedidos/:id/status', checkPassword, async (req, res) => { const { id } = req.params; const { status } = req.body; if (!status) return res.status(400).send('No status.'); try { const result = await pool.query('UPDATE pedidos SET status = $1 WHERE id = $2 RETURNING *', [status, id]); const pedidoAtualizado = result.rows[0]; if (pedidoAtualizado.usuario_id) { sendMessageToUser(pedidoAtualizado.usuario_id, { type: 'STATUS_UPDATE', payload: { pedidoId: pedidoAtualizado.id, novoStatus: pedidoAtualizado.status } }); } res.json(pedidoAtualizado); } catch (err) { console.error('Erro ao atualizar status do pedido:', err); res.status(500).send('Erro no servidor'); }});
app.get('/api/categorias', async (req, res) => { try { const result = await pool.query('SELECT * FROM categorias ORDER BY nome ASC'); res.json(result.rows); } catch (err) { res.status(500).send('Erro no servidor'); }});
app.post('/api/categorias', checkPassword, async (req, res) => { const { nome } = req.body; try { const newCategory = await pool.query('INSERT INTO categorias (nome) VALUES ($1) RETURNING *', [nome]); res.status(201).json(newCategory.rows[0]); } catch (err) { res.status(500).send('Erro no servidor'); }});
app.put('/api/categorias/:id', checkPassword, async (req, res) => { const { id } = req.params; const { nome } = req.body; try { const updatedCategory = await pool.query('UPDATE categorias SET nome = $1 WHERE id = $2 RETURNING *', [nome, id]); res.json(updatedCategory.rows[0]); } catch (err) { res.status(500).send('Erro no servidor'); }});
app.delete('/api/categorias/:id', checkPassword, async (req, res) => { const { id } = req.params; try { await pool.query('DELETE FROM categorias WHERE id = $1', [id]); res.status(204).send(); } catch (err) { res.status(500).send('Erro no servidor'); }});
app.get('/api/meus-favoritos', verifyToken, async (req, res) => { try { const result = await pool.query('SELECT produto_id FROM favoritos WHERE usuario_id = $1', [req.user.id]); res.json(result.rows.map(row => row.produto_id)); } catch (err) { res.status(500).json({ message: 'Erro no servidor' }); }});
app.post('/api/favoritos', verifyToken, async (req, res) => { const { produtoId } = req.body; try { await pool.query('INSERT INTO favoritos (usuario_id, produto_id) VALUES ($1, $2)', [req.user.id, produtoId]); res.status(201).json({ message: 'Produto favoritado com sucesso.' }); } catch (err) { if (err.code === '23505') return res.status(400).json({ message: 'Produto já favoritado.' }); res.status(500).json({ message: 'Erro no servidor' }); }});
app.delete('/api/favoritos/:produtoId', verifyToken, async (req, res) => { const { produtoId } = req.params; try { await pool.query('DELETE FROM favoritos WHERE usuario_id = $1 AND produto_id = $2', [req.user.id, produtoId]); res.status(200).json({ message: 'Produto desfavoritado com sucesso.' }); } catch (err) { res.status(500).json({ message: 'Erro no servidor' }); }});


// ========================================================================
// >> NOVA ROTA PARA BUSCAR UM ÚNICO PEDIDO <<
// ========================================================================
app.get('/api/pedidos/:id', verifyToken, async (req, res) => {
    const { id: pedidoId } = req.params;
    const { id: usuarioId } = req.user;

    try {
        const pedidoResult = await pool.query(
            'SELECT * FROM pedidos WHERE id = $1 AND usuario_id = $2',
            [pedidoId, usuarioId]
        );

        if (pedidoResult.rows.length === 0) {
            return res.status(404).send('Pedido não encontrado ou não pertence a este usuário.');
        }

        const pedido = pedidoResult.rows[0];

        const itensResult = await pool.query(
            'SELECT ip.*, p.nome as produto_nome FROM itens_pedido ip JOIN produtos p ON ip.produto_id = p.id WHERE ip.pedido_id = $1',
            [pedidoId]
        );
        pedido.itens = itensResult.rows;

        res.json(pedido);
    } catch (err) {
        console.error('Erro ao buscar detalhes do pedido:', err);
        res.status(500).send('Erro no servidor');
    }
});


// --- LÓGICA WEBSOCKET E INICIALIZAÇÃO DO SERVIDOR ---
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const userConnections = new Map();
const adminConnections = new Set();
wss.on('connection', (ws, req) => { const parameters = new URL(req.url, `http://${req.headers.host}`).searchParams; const token = parameters.get('token'); if (token) { jwt.verify(token, process.env.JWT_SECRET, (err, user) => { if (err) { ws.close(); } else { console.log(`Cliente (ID: ${user.id}) conectado.`); userConnections.set(user.id, ws); ws.userId = user.id; } }); } else { console.log('Admin conectado.'); adminConnections.add(ws); } ws.on('close', () => { if (ws.userId) { console.log(`Cliente (ID: ${ws.userId}) desconectado.`); userConnections.delete(ws.userId); } else { console.log('Admin desconectado.'); adminConnections.delete(ws); } }); });
function sendMessageToUser(userId, message) { const connection = userConnections.get(userId); if (connection && connection.readyState === WebSocket.OPEN) { connection.send(JSON.stringify(message)); } }
function broadcastToAdmins(message) { const data = JSON.stringify(message); for (const client of adminConnections) { if (client.readyState === WebSocket.OPEN) { client.send(data); } } }
server.listen(PORT, () => { console.log(`Servidor Híbrido rodando na porta ${PORT}`); });