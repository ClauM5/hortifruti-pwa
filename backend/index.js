// Arquivo: backend/index.js (Versão 4 - Com Upload de Imagem)

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
// NOVOS IMPORTS
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

// NOVA CONFIGURAÇÃO: Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// NOVA CONFIGURAÇÃO: Multer
// Vamos configurar o multer para guardar o arquivo em memória temporariamente
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- MIDDLEWARE DE AUTENTICAÇÃO ---
const checkPassword = (req, res, next) => {
  // ... (código do checkPassword continua o mesmo)
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
  // ... (código da rota GET continua o mesmo)
  try {
    const result = await pool.query('SELECT * FROM produtos ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('Erro no servidor');
  }
});

// NOVA ROTA: Upload de imagem (protegida)
// Usa o multer como middleware para pegar um único arquivo chamado 'image'
app.post('/api/upload', checkPassword, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('Nenhum arquivo enviado.');
  }

  // Converte o buffer do arquivo para um formato que o Cloudinary entende
  const b64 = Buffer.from(req.file.buffer).toString("base64");
  let dataURI = "data:" + req.file.mimetype + ";base64," + b64;

  try {
    // Envia o arquivo para o Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "hortifruti-pwa" // Opcional: cria uma pasta no Cloudinary para organizar
    });
    // Devolve a URL segura da imagem
    res.status(200).json({ imageUrl: result.secure_url });
  } catch (error) {
    console.error("Erro no upload para o Cloudinary:", error);
    res.status(500).send('Erro ao fazer upload da imagem.');
  }
});


// Rotas CRUD de produtos (protegidas)
app.post('/api/produtos', checkPassword, async (req, res) => {
  // ... (código da rota POST continua o mesmo)
  const { nome, preco, unidade, imagem } = req.body;
  try {
    const newProduct = await pool.query(
      'INSERT INTO produtos (nome, preco, unidade, imagem) VALUES ($1, $2, $3, $4) RETURNING *',
      [nome, preco, unidade, imagem]
    );
    res.status(201).json(newProduct.rows[0]);
  } catch (err) {
    res.status(500).send('Erro no servidor');
  }
});

app.put('/api/produtos/:id', checkPassword, async (req, res) => {
  // ... (código da rota PUT continua o mesmo)
  const { id } = req.params;
  const { nome, preco, unidade, imagem } = req.body;
  try {
    const updatedProduct = await pool.query(
      'UPDATE produtos SET nome = $1, preco = $2, unidade = $3, imagem = $4 WHERE id = $5 RETURNING *',
      [nome, preco, unidade, imagem, id]
    );
    res.json(updatedProduct.rows[0]);
  } catch (err) {
    res.status(500).send('Erro no servidor');
  }
});

app.delete('/api/produtos/:id', checkPassword, async (req, res) => {
  // ... (código da rota DELETE continua o mesmo)
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM produtos WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).send('Erro no servidor');
  }
});

// --- INICIALIZAÇÃO DO SERVIDOR ---
app.listen(PORT, () => {
  console.log(`Servidor do Hortifruti rodando na porta ${PORT}`);
});