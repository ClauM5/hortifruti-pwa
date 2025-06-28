// Arquivo: backend/index.js

// 1. Importando as ferramentas que instalamos
const express = require('express');
const cors = require('cors');

// 2. Inicializando o express
const app = express();

// 3. Configurando o CORS para permitir acesso do nosso frontend
app.use(cors());

// 4. Definindo a porta em que o servidor vai rodar
//    process.env.PORT é uma variável que o Render (nosso hospedeiro) usará.
//    Localmente, ele usará a porta 3001.
const PORT = process.env.PORT || 3001;

// 5. Nossos dados "fake" por enquanto. Na próxima fase, isso virá do banco de dados.
const produtos = [
  { id: 1, nome: 'Banana Prata', preco: 7.99, unidade: 'kg', imagem: 'https://i.imgur.com/kS5t3a6.png' },
  { id: 2, nome: 'Alface Crespa', preco: 3.50, unidade: 'un', imagem: 'https://i.imgur.com/v82rYSt.png' },
  { id: 3, nome: 'Tomate Italiano', preco: 8.90, unidade: 'kg', imagem: 'https://i.imgur.com/r8mB1BS.png' },
  { id: 4, nome: 'Maçã Fuji', preco: 9.99, unidade: 'kg', imagem: 'https://i.imgur.com/dJk9o4V.png' },
  { id: 5, nome: 'Cenoura', preco: 4.50, unidade: 'kg', imagem: 'https://i.imgur.com/Y3U22hb.png' },
  { id: 6, nome: 'Abacate', preco: 6.00, unidade: 'un', imagem: 'https://i.imgur.com/8zOpJk5.png' }
];

// 6. Criando nossa primeira "rota" (endpoint) da API
//    Quando o frontend chamar o endereço "/api/produtos", este código será executado.
app.get('/api/produtos', (req, res) => {
  // Ele simplesmente devolve a nossa lista de produtos no formato JSON
  res.json(produtos);
});

// 7. Comando final para ligar o servidor e deixá-lo "escutando" por requisições
app.listen(PORT, () => {
  console.log(`Servidor do Hortifruti rodando na porta ${PORT}`);
});