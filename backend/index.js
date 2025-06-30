// Arquivo: backend/index.js (Versão Final com Push Notifications)

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
const webpush = require('web-push'); // << 1. NOVO IMPORT

// --- CONFIGURAÇÕES E MIDDLEWARES ---
const PORT = process.env.PORT || 3001;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const checkPassword = (req, res, next) => { const { authorization } = req.headers; if (authorization === process.env.ADMIN_PASSWORD) { next(); } else { res.status(403).send('Acesso negado.'); } };
const verifyToken = (req, res, next) => { const authHeader = req.headers['authorization']; const token = authHeader && authHeader.split(' ')[1]; if (!token) { return res.status(401).json({ message: 'Token não fornecido.' }); } jwt.verify(token, process.env.JWT_SECRET, (err, user) => { if (err) { return res.status(403).json({ message: 'Token inválido.' }); } req.user = user; next(); }); };

// << 2. CONFIGURAÇÃO DO WEB-PUSH COM AS CHAVES VAPID >>
webpush.setVapidDetails(
    'mailto:seu-email-de-contato@exemplo.com', // Coloque um e-mail de contato seu aqui
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

const app = express();
app.use(cors());
app.use(express.json());

// --- ROTAS ---
// ... (Todas as rotas existentes, como produtos, auth, pedidos, etc., continuam aqui)
app.get('/api/produtos', async (req, res) => { const { search, categoria } = req.query; const authHeader = req.headers['authorization']; const token = authHeader && authHeader.split(' ')[1]; let userId = null; if (token) { try { const decoded = jwt.verify(token, process.env.JWT_SECRET); userId = decoded.id; } catch (e) { /* Token inválido, ignora */ } } let query = ` SELECT p.*, array_agg(c.nome) as categorias, CASE WHEN f.produto_id IS NOT NULL THEN true ELSE false END as is_favorito FROM produtos p LEFT JOIN produto_categoria pc ON p.id = pc.produto_id LEFT JOIN categorias c ON pc.categoria_id = c.id LEFT JOIN favoritos f ON p.id = f.produto_id AND f.usuario_id = $1 `; const params = [userId]; const conditions = []; if (search) { params.push(`%${search}%`); conditions.push(`p.nome ILIKE $${params.length}`); } if (categoria) { params.push(categoria); conditions.push(`p.id IN (SELECT produto_id FROM produto_categoria WHERE categoria_id = (SELECT id FROM categorias WHERE nome = $${params.length}))`); } if (conditions.length > 0) { query += ` WHERE ${conditions.join(' AND ')}`; } query += ' GROUP BY p.id, f.produto_id ORDER BY p.id ASC'; try { const result = await pool.query(query, params); res.json(result.rows); } catch (err) { console.error('Erro ao buscar produtos:', err); res.status(500).send('Erro no servidor'); }});
// ... (todas as outras rotas, como login, register, etc., ficam aqui no meio, sem alterações) ...
app.post('/api/auth/register', async (req, res) => { const { nome, email, senha } = req.body; if (!nome || !email || !senha) return res.status(400).json({ message: 'Preencha tudo.' }); try { const salt = await bcrypt.genSalt(10); const senha_hash = await bcrypt.hash(senha, salt); const newUser = await pool.query('INSERT INTO usuarios (nome, email, senha_hash) VALUES ($1, $2, $3) RETURNING id, nome, email', [nome, email, senha_hash]); res.status(201).json(newUser.rows[0]); } catch (err) { if (err.code === '23505') return res.status(400).json({ message: 'E-mail já cadastrado.' }); res.status(500).json({ message: 'Erro no servidor.' }); }});
app.post('/api/auth/login', async (req, res) => { const { email, senha } = req.body; if (!email || !senha) return res.status(400).json({ message: 'Preencha tudo.' }); try { const userResult = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]); if (userResult.rows.length === 0) return res.status(401).json({ message: 'Credenciais inválidas.' }); const user = userResult.rows[0]; const isMatch = await bcrypt.compare(senha, user.senha_hash); if (!isMatch) return res.status(401).json({ message: 'Credenciais inválidas.' }); const payload = { id: user.id, nome: user.nome }; const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' }); res.json({ token, user: payload }); } catch (err) { res.status(500).json({ message: 'Erro no servidor.' }); }});
app.post('/api/pedidos', async (req, res) => { const { nome_cliente, endereco_cliente, itens, metodo_pagamento, troco_para, token, codigo_cupom } = req.body; const c = await pool.connect(); try { await c.query('BEGIN'); let valor_total = itens.reduce((sum, item) => sum + Number(item.preco) * item.quantity, 0); let valor_final = valor_total; if (codigo_cupom) { const cupomResult = await c.query('SELECT * FROM cupons WHERE codigo = $1 AND ativo = true FOR UPDATE', [codigo_cupom.toUpperCase()]); if (cupomResult.rows.length > 0) { const cupom = cupomResult.rows[0]; if (cupom.data_validade && new Date(cupom.data_validade) < new Date()) throw new Error('Cupom expirado.'); if (cupom.usos_maximos != null && cupom.usos_atuais >= cupom.usos_maximos) throw new Error('Cupom atingiu limite de usos.'); let desconto = 0; if (cupom.tipo_desconto === 'PERCENTUAL') { desconto = (valor_total * cupom.valor) / 100; } else { desconto = cupom.valor; } valor_final = Math.max(0, valor_total - desconto); await c.query('UPDATE cupons SET usos_atuais = usos_atuais + 1 WHERE id = $1', [cupom.id]); } } let usuarioId = null; if (token) { try { const decodedUser = jwt.verify(token, process.env.JWT_SECRET); usuarioId = decodedUser.id; } catch (err) {} } const pedidoResult = await c.query( `INSERT INTO pedidos (nome_cliente, endereco_cliente, valor_total, metodo_pagamento, troco_para, usuario_id, codigo_cupom) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, [nome_cliente, endereco_cliente, valor_final, metodo_pagamento, troco_para || null, usuarioId, codigo_cupom || null] ); const novoPedido = pedidoResult.rows[0]; for (const item of itens) { await c.query('INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)', [novoPedido.id, item.id, item.quantity, item.preco]); } await c.query('COMMIT'); novoPedido.itens = itens; broadcastToAdmins({ type: 'NOVO_PEDIDO', payload: novoPedido }); res.status(201).json({ message: 'Pedido criado com sucesso!', pedidoId: novoPedido.id }); } catch (err) { await c.query('ROLLBACK'); console.error('Erro ao criar pedido:', err); res.status(500).json({ message: err.message || 'Erro no servidor ao criar pedido.'}); } finally { c.release(); }});
app.get('/api/meus-pedidos', verifyToken, async (req, res) => { try { const pResult = await pool.query('SELECT * FROM pedidos WHERE usuario_id = $1 ORDER BY data_pedido DESC', [req.user.id]); const p = pResult.rows; for (const ped of p) { const iResult = await pool.query('SELECT ip.*, p.nome as produto_nome FROM itens_pedido ip JOIN produtos p ON ip.produto_id = p.id WHERE ip.pedido_id = $1', [ped.id]); ped.itens = iResult.rows; } res.json(p); } catch (err) { res.status(500).send('Error'); }});
app.get('/api/pedidos/:id', verifyToken, async (req, res) => { const { id: pedidoId } = req.params; const { id: usuarioId } = req.user; try { const pedidoResult = await pool.query('SELECT * FROM pedidos WHERE id = $1 AND usuario_id = $2', [pedidoId, usuarioId]); if (pedidoResult.rows.length === 0) { return res.status(404).send('Pedido não encontrado ou não pertence a este usuário.'); } const pedido = pedidoResult.rows[0]; const itensResult = await pool.query('SELECT ip.*, p.nome as produto_nome FROM itens_pedido ip JOIN produtos p ON ip.produto_id = p.id WHERE ip.pedido_id = $1', [pedidoId]); pedido.itens = itensResult.rows; res.json(pedido); } catch (err) { console.error('Erro ao buscar detalhes do pedido:', err); res.status(500).send('Erro no servidor'); }});
app.get('/api/cupons/validar', async (req, res) => { const { codigo } = req.body; if (!codigo) return res.status(400).json({ message: 'Código do cupom é obrigatório.' }); try { const result = await pool.query('SELECT * FROM cupons WHERE codigo = $1 AND ativo = true', [codigo.toUpperCase()]); if (result.rows.length === 0) return res.status(404).json({ message: 'Cupom inválido ou inativo.' }); const cupom = result.rows[0]; if (cupom.data_validade && new Date(cupom.data_validade) < new Date()) return res.status(400).json({ message: 'Este cupom expirou.' }); if (cupom.usos_maximos != null && cupom.usos_atuais >= cupom.usos_maximos) return res.status(400).json({ message: 'Este cupom atingiu o limite de usos.' }); res.json({ message: 'Cupom válido!', cupom }); } catch (err) { res.status(500).send('Erro no servidor'); }});
// ... (todas as outras rotas de admin continuam iguais)

// ========================================================================
// >> NOVAS ROTAS PARA PUSH NOTIFICATIONS <<
// ========================================================================
// Rota para o frontend pegar a chave pública VAPID
app.get('/api/vapid-public-key', (req, res) => {
    res.send(process.env.VAPID_PUBLIC_KEY);
});

// Rota para o cliente se inscrever para receber notificações
app.post('/api/subscribe', verifyToken, async (req, res) => {
    const subscription = req.body.subscription;
    const userId = req.user.id;
    try {
        // Lógica de UPSERT: Tenta atualizar, se não conseguir, insere.
        const text = 'INSERT INTO notificacao_subscriptions (usuario_id, subscription_object) VALUES ($1, $2) ON CONFLICT (usuario_id) DO UPDATE SET subscription_object = $2';
        await pool.query(text, [userId, subscription]);
        res.status(201).json({ message: 'Inscrição salva com sucesso.' });
    } catch (err) {
        console.error('Erro ao salvar inscrição:', err);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});


// ========================================================================
// >> ROTA DE ATUALIZAÇÃO DE STATUS ATUALIZADA PARA ENVIAR PUSH <<
// ========================================================================
app.put('/api/pedidos/:id/status', checkPassword, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).send('Novo status não fornecido.');
    try {
        const result = await pool.query('UPDATE pedidos SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
        const pedidoAtualizado = result.rows[0];

        // Notificação via WebSocket (em tempo real, se o cliente estiver com o site aberto)
        if (pedidoAtualizado.usuario_id) {
            sendMessageToUser(pedidoAtualizado.usuario_id, {
                type: 'STATUS_UPDATE',
                payload: { pedidoId: pedidoAtualizado.id, novoStatus: pedidoAtualizado.status }
            });
            // Notificação via PUSH (mesmo com o site fechado)
            sendPushNotification(pedidoAtualizado.usuario_id, `Seu pedido #${pedidoAtualizado.id} foi atualizado para: ${pedidoAtualizado.status}`);
        }
        res.json(pedidoAtualizado);
    } catch (err) {
        console.error('Erro ao atualizar status do pedido:', err);
        res.status(500).send('Erro no servidor');
    }
});


// --- LÓGICA DE ENVIO DE PUSH ---
async function sendPushNotification(userId, messagePayload) {
    try {
        const subResult = await pool.query('SELECT subscription_object FROM notificacao_subscriptions WHERE usuario_id = $1', [userId]);
        if (subResult.rows.length > 0) {
            const subscription = subResult.rows[0].subscription_object;
            const payload = JSON.stringify({
                title: 'Hortifruti Frescor',
                body: messagePayload
            });

            await webpush.sendNotification(subscription, payload);
            console.log('Push notification enviada para o usuário:', userId);
        }
    } catch (error) {
        console.error('Erro ao enviar push notification:', error);
        // Se a inscrição for inválida (ex: 410 Gone), removemos do banco
        if (error.statusCode === 410) {
            await pool.query('DELETE FROM notificacao_subscriptions WHERE usuario_id = $1', [userId]);
        }
    }
}


// --- LÓGICA WEBSOCKET E INICIALIZAÇÃO DO SERVIDOR ---
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const userConnections = new Map();
const adminConnections = new Set();
wss.on('connection', (ws, req) => { const parameters = new URL(req.url, `http://${req.headers.host}`).searchParams; const token = parameters.get('token'); if (token) { jwt.verify(token, process.env.JWT_SECRET, (err, user) => { if (err) { ws.close(); } else { userConnections.set(user.id, ws); ws.userId = user.id; } }); } else { adminConnections.add(ws); } ws.on('close', () => { if (ws.userId) { userConnections.delete(ws.userId); } else { adminConnections.delete(ws); } }); });
function sendMessageToUser(userId, message) { const connection = userConnections.get(userId); if (connection && connection.readyState === WebSocket.OPEN) { connection.send(JSON.stringify(message)); } }
function broadcastToAdmins(message) { const data = JSON.stringify(message); for (const client of adminConnections) { if (client.readyState === WebSocket.OPEN) { client.send(data); } } }
server.listen(PORT, () => { console.log(`Servidor Híbrido rodando na porta ${PORT}`); });