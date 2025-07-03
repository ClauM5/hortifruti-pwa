// Arquivo: backend/index.js - Passo 2: Configurações

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

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:seu-email-de-contato@exemplo.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const checkPassword = (req, res, next) => {
  const { authorization } = req.headers;
  if (authorization === process.env.ADMIN_PASSWORD) {
    next();
  } else {
    res.status(403).send('Acesso negado.');
  }
};

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido.' });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido.' });
    }
    req.user = user;
    next();
  });
};


// --- ROTAS (Ainda vazias, por enquanto) ---

// Rota de teste para verificar se o servidor está no ar
app.get('/', (req, res) => {
  res.send('Servidor com configurações carregadas!');
});


// --- INICIALIZAÇÃO DO SERVIDOR ---
server.listen(PORT, () => {
  console.log(`Servidor base rodando na porta ${PORT}`);
});