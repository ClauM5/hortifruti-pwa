// Arquivo: backend/index.js (Versão 5 - Com Criação de Pedidos)

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

const app = express();
app.use(cors());
app.use(express.json());

// --- CONFIGURAÇÕES ---
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

// --- MIDDLEWARE DE AUTENTICAÇÃO ---
const checkPassword = (req, res, next) => {
  const { authorization } = req.headers;
  if (authorization === process.env.ADMIN_PASSWORD) {
    next();
  } else {
    res.status(403).send('Acesso negado: senha incorreta.');
  }
};

// --- ROTAS ---

// Rota para LER todos os produtos (pública)
app.get('/api/produtos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM produtos ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar produtos:', err);
    res.status(500).send('Erro no servidor');
  }
});

// Rota de Upload de imagem (protegida)
app.post('/api/upload', checkPassword, upload.single('image'), async (req, res) => {
  // ... (código do upload continua o mesmo)
  if (!req.file) return res.status(400).send('Nenhum arquivo enviado.');
  const b64 = Buffer.from(req.file.buffer).toString("base64");
  let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
  try {
    const result = await cloudinary.uploader.upload(dataURI, { folder: "hortifruti-pwa" });
    res.status(200).json({ imageUrl: result.secure_url });
  } catch (error) {
    console.error("Erro no upload para o Cloudinary:", error);
    res.status(500).send('Erro ao fazer upload da imagem.');
  }
});

// Rotas CRUD de produtos (protegidas)
// ... (POST, PUT, DELETE para produtos continuam os mesmos)
app.post('/api/produtos', checkPassword, async (req, res) => {
    const { nome, preco, unidade, imagem } = req.body;
    try {
      const newProduct = await pool.query('INSERT INTO produtos (nome, preco, unidade, imagem) VALUES ($1, $2, $3, $4) RETURNING *', [nome, preco, unidade, imagem]);
      res.status(201).json(newProduct.rows[0]);
    } catch (err) { console.error('Erro ao criar produto', err); res.status(500).send('Erro no servidor'); }
});
app.put('/api/produtos/:id', checkPassword, async (req, res) => {
    const { id } = req.params;
    const { nome, preco, unidade, imagem } = req.body;
    try {
      const updatedProduct = await pool.query('UPDATE produtos SET nome = $1, preco = $2, unidade = $3, imagem = $4 WHERE id = $5 RETURNING *', [nome, preco, unidade, imagem, id]);
      res.json(updatedProduct.rows[0]);
    } catch (err) { console.error('Erro ao atualizar produto', err); res.status(500).send('Erro no servidor'); }
});
app.delete('/api/produtos/:id', checkPassword, async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query('DELETE FROM produtos WHERE id = $1', [id]);
      res.status(204).send();
    } catch (err) { console.error('Erro ao deletar produto', err); res.status(500).send('Erro no servidor'); }
});


// ========================================================================
// >> NOVA ROTA PARA CRIAR UM PEDIDO (pública) <<
// ========================================================================
app.post('/api/pedidos', async (req, res) => {
  const { nome_cliente, endereco_cliente, itens } = req.body;
  
  // Calcula o valor total no backend para segurança
  const valor_total = itens.reduce((sum, item) => sum + Number(item.preco) * item.quantity, 0);

  // Pega uma conexão do nosso "pool" para poder usar a transação
  const client = await pool.connect();

  // Validação básica dos dados recebidos
  if (!nome_cliente || !endereco_cliente || !itens || itens.length === 0) {
    return res.status(400).send('Dados do pedido incompletos.');
  }

  try {
    // Inicia a transação
    await client.query('BEGIN');

    // 1. Insere na tabela 'pedidos' e pega o ID do novo pedido
    const pedidoResult = await client.query(
      'INSERT INTO pedidos (nome_cliente, endereco_cliente, valor_total) VALUES ($1, $2, $3) RETURNING id',
      [nome_cliente, endereco_cliente, valor_total]
    );
    const pedidoId = pedidoResult.rows[0].id;

    // 2. Itera sobre os itens do carrinho e insere um por um na tabela 'itens_pedido'
    for (const item of itens) {
      await client.query(
        'INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)',
        [pedidoId, item.id, item.quantity, item.preco]
      );
    }
    
    // 3. Se tudo deu certo até aqui, confirma a transação
    await client.query('COMMIT');
    
    res.status(201).json({ message: 'Pedido criado com sucesso!', pedidoId: pedidoId });

  } catch (err) {
    // 4. Se qualquer um dos comandos acima falhou, desfaz tudo
    await client.query('ROLLBACK');
    console.error('Erro ao criar pedido:', err);
    res.status(500).send('Erro no servidor ao criar pedido.');
  } finally {
    // 5. Libera a conexão de volta para o pool, independentemente de sucesso ou falha
    client.release();
  }
});


// --- INICIALIZAÇÃO DO SERVIDOR ---
app.listen(PORT, () => {
  console.log(`Servidor do Hortifruti rodando na porta ${PORT}`);
});