// Arquivo: backend/index.js (Versão de Teste Mínima)

const express = require('express');
const app = express();

const PORT = process.env.PORT || 3001;

app.get('/', (req, res) => {
  res.send('O servidor de teste do Hortifruti está funcionando!');
});

app.listen(PORT, () => {
  console.log(`Servidor de teste rodando na porta ${PORT}`);
});