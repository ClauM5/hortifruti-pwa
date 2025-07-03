// Arquivo: backend/index.js (Versão de Teste de Conexão WebSocket)

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

// --- CONFIGURAÇÕES E MIDDLEWARES (sem alterações) ---
const PORT = process.env.PORT || 3001;
app.use(cors()); app.use(express.json());
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) { webpush.setVapidDetails('mailto:seu-email@exemplo.com', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY); }
const storage = multer.memoryStorage(); const upload = multer({ storage: storage });
const checkPassword = (req, res, next) => { const { authorization } = req.headers; if (authorization === process.env.ADMIN_PASSWORD) { next(); } else { res.status(403).send('Acesso negado.'); } };
const verifyToken = (req, res, next) => { const authHeader = req.headers['authorization']; const token = authHeader && authHeader.split(' ')[1]; if (!token) { return res.status(401).json({ message: 'Token não fornecido.' }); } jwt.verify(token, process.env.JWT_SECRET, (err, user) => { if (err) { return res.status(403).json({ message: 'Token inválido.' }); } req.user = user; next(); }); };

// --- ROTAS (sem alterações) ---
// ... (O código completo de todas as suas rotas continua aqui)
app.get('/', (req, res) => res.send('Servidor no ar!'));
// (Cole aqui todas as rotas que já tínhamos na última versão completa)


// ========================================================================
// >> LÓGICA WEBSOCKET DE TESTE (SIMPLIFICADA) <<
// ========================================================================
const wss = new WebSocket.Server({ server });
const adminConnections = new Set(); // Usaremos apenas a lista de admins para o teste

wss.on('connection', (ws, req) => {
    // TESTE: REMOVEMOS TODA A LÓGICA DE VERIFICAÇÃO DE TOKEN
    // Simplesmente aceitamos a conexão e a registramos.
    console.log('!!! TESTE: Nova conexão WebSocket recebida e ACEITA incondicionalmente. !!!');
    adminConnections.add(ws);

    ws.on('close', () => {
        console.log('!!! TESTE: Conexão de teste fechada. !!!');
        adminConnections.delete(ws);
    });
    
    ws.on('error', (err) => {
        console.error("!!! TESTE: Erro na conexão de teste !!!", err)
    })
});

function broadcastToAdmins(message) { /*...código sem alteração...*/ }
function sendMessageToUser(userId, message) { /*...código sem alteração...*/ }
async function sendPushNotification(userId, messagePayload) { /*...código sem alteração...*/ }

// --- INICIALIZAÇÃO DO SERVIDOR ---
server.listen(PORT, () => {
  console.log(`Servidor Híbrido rodando na porta ${PORT}`);
});


// =================================================================================================
// >> ATENÇÃO: PARA FACILITAR, COLE TODAS AS SUAS ROTAS ANTIGAS AQUI EMBAIXO <<
// (As rotas de produtos, auth, pedidos, etc. que estavam entre os Middlewares e a Lógica do WebSocket)
// =================================================================================================
app.get('/api/produtos', async (req, res) => { const { search, categoria } = req.query; const authHeader = req.headers['authorization']; const token = authHeader && authHeader.split(' ')[1]; let userId = null; if (token) { try { const decoded = jwt.verify(token, process.env.JWT_SECRET); userId = decoded.id; } catch (e) { /* Token inválido, ignora */ } } let query = ` SELECT p.*, array_agg(c.nome) as categorias, CASE WHEN f.produto_id IS NOT NULL THEN true ELSE false END as is_favorito FROM produtos p LEFT JOIN produto_categoria pc ON p.id = pc.produto_id LEFT JOIN categorias c ON pc.categoria_id = c.id LEFT JOIN favoritos f ON p.id = f.produto_id AND f.usuario_id = $1 `; const params = [userId]; const conditions = []; if (search) { params.push(`%${search}%`); conditions.push(`p.nome ILIKE $${params.length}`); } if (categoria) { params.push(categoria); conditions.push(`p.id IN (SELECT produto_id FROM produto_categoria WHERE categoria_id = (SELECT id FROM categorias WHERE nome = $${params.length}))`); } if (conditions.length > 0) { query += ` WHERE ${conditions.join(' AND ')}`; } query += ' GROUP BY p.id, f.produto_id ORDER BY p.id ASC'; try { const result = await pool.query(query, params); res.json(result.rows); } catch (err) { console.error('Erro ao buscar produtos:', err); res.status(500).send('Erro no servidor'); }});
// ... E assim por diante para todas as outras rotas...