// Arquivo: backend/index.js - Esqueleto Inicial

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

const PORT = process.env.PORT || 3001;

// Rota de teste para verificar se o servidor está no ar
app.get('/', (req, res) => {
  res.send('Servidor base do Hortifruti v2.0 está no ar!');
});

server.listen(PORT, () => {
  console.log(`Servidor base rodando na porta ${PORT}`);
});