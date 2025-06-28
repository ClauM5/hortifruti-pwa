// Arquivo: frontend/src/pages/AdminPage.jsx (Versão com Upload)

import React, { useState, useEffect } from 'react';
import './AdminPage.css';

// URLs da nossa API
const API_PRODUTOS_URL = 'https://hortifruti-backend.onrender.com/api/produtos';
const API_UPLOAD_URL = 'https://hortifruti-backend.onrender.com/api/upload';

function AdminPage() {
  // ... (os estados de produtos, senha, isLoggedIn, etc. continuam os mesmos) ...
  const [produtos, setProdutos] = useState([]);
  const [senha, setSenha] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formProduto, setFormProduto] = useState({
    id: null,
    nome: '',
    preco: '',
    unidade: 'kg',
    imagem: ''
  });
  // NOVO ESTADO: para o arquivo de imagem selecionado
  const [imagemFile, setImagemFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);


  // --- Funções de API ---

  const fetchProdutos = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_PRODUTOS_URL);
      const data = await response.json();
      setProdutos(data);
    } catch (err) {
      setError('Falha ao carregar produtos.');
    } finally {
      setIsLoading(false);
    }
  };

  // NOVA FUNÇÃO: para fazer o upload da imagem
  const handleImageUpload = async () => {
    if (!imagemFile) return null; // Se não tem arquivo, não faz nada

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', imagemFile); // 'image' deve ser o mesmo nome que o backend espera no multer

    try {
      const response = await fetch(API_UPLOAD_URL, {
        method: 'POST',
        headers: { 'authorization': senha },
        body: formData,
      });

      if (!response.ok) throw new Error('Falha no upload da imagem.');

      const data = await response.json();
      return data.imageUrl; // Retorna a URL da imagem do Cloudinary
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Passo 1: Fazer upload da imagem, se houver uma nova
    let imageUrl = formProduto.imagem; // Começa com a imagem atual
    if (imagemFile) {
      imageUrl = await handleImageUpload();
      if (!imageUrl) { // Se o upload falhou, para a execução
        setIsLoading(false);
        return;
      }
    }

    // Passo 2: Preparar os dados para salvar o produto
    const produtoData = { ...formProduto, imagem: imageUrl };
    const { id, ...data } = produtoData;
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_PRODUTOS_URL}/${id}` : API_PRODUTOS_URL;

    // Passo 3: Salvar o produto (criar ou atualizar)
    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'authorization': senha
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error(`Falha ao salvar produto.`);

      clearForm();
      fetchProdutos();

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (produtoId) => {
    // ... (função de deletar continua a mesma) ...
    if (!window.confirm("Tem certeza que deseja deletar este produto?")) return;
    setIsLoading(true);
    try {
      await fetch(`${API_PRODUTOS_URL}/${produtoId}`, {
        method: 'DELETE',
        headers: { 'authorization': senha }
      });
      fetchProdutos();
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  };

  // --- Funções Auxiliares ---

  const handleEdit = (produto) => {
    setFormProduto(produto);
    setImagemFile(null); // Limpa a seleção de arquivo ao editar
    window.scrollTo(0, 0);
  };

  const clearForm = () => {
    setFormProduto({ id: null, nome: '', preco: '', unidade: 'kg', imagem: '' });
    setImagemFile(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormProduto(prevState => ({ ...prevState, [name]: value }));
  };

  // NOVA: Função para lidar com a seleção do arquivo
  const handleFileChange = (e) => {
    setImagemFile(e.target.files[0]);
  };

  const handleLogin = () => {
    // Lembre-se de usar a sua senha aqui!
    if (senha === '102030') {
      setIsLoggedIn(true);
    } else {
      alert('Senha incorreta!');
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchProdutos();
    }
  }, [isLoggedIn]);

  // --- RENDERIZAÇÃO ---
  if (!isLoggedIn) {
    // ... (código da tela de login continua o mesmo) ...
    return (
        <div className="admin-login-container">
          <h2>Painel de Administrador</h2>
          <input
            type="password"
            placeholder="Digite a senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            className="admin-input"
          />
          <button onClick={handleLogin} className="admin-button">Entrar</button>
        </div>
      );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Gerenciar Produtos</h2>
        <button onClick={() => setIsLoggedIn(false)} className="admin-button logout-button">Sair</button>
      </div>

      {error && <p className="error-message">{error}</p>}
      {(isLoading || isUploading) && <p>{isUploading ? 'Enviando imagem...' : 'Carregando...'}</p>}

      <form onSubmit={handleSave} className="admin-form">
        <h3>{formProduto.id ? 'Editando Produto' : 'Adicionar Novo Produto'}</h3>
        <input type="text" name="nome" placeholder="Nome do Produto" value={formProduto.nome} onChange={handleFormChange} required />
        <input type="number" name="preco" placeholder="Preço (ex: 7.99)" value={formProduto.preco} onChange={handleFormChange} required step="0.01" />
        <input type="text" name="unidade" placeholder="Unidade (kg, un, etc)" value={formProduto.unidade} onChange={handleFormChange} required />

        {/* NOVO CAMPO DE UPLOAD */}
        <label htmlFor="imagem-upload">Imagem do Produto:</label>
        <input id="imagem-upload" type="file" name="imagem" onChange={handleFileChange} accept="image/*" />

        {/* Exibe a imagem atual ou a pré-visualização da nova */}
        {(formProduto.imagem || imagemFile) && (
          <div className="image-preview">
            <p>Pré-visualização:</p>
            <img src={imagemFile ? URL.createObjectURL(imagemFile) : formProduto.imagem} alt="Preview" />
          </div>
        )}

        <div className="form-buttons">
          <button type="submit" className="admin-button save-button" disabled={isUploading}>
            {isUploading ? 'Enviando...' : 'Salvar'}
          </button>
          {formProduto.id && <button type="button" onClick={clearForm} className="admin-button clear-button">Cancelar Edição</button>}
        </div>
      </form>

      <div className="product-list">
        {produtos.map(p => (
          <div key={p.id} className="product-item">
            <img src={p.imagem || 'https://via.placeholder.com/50'} alt={p.nome} className="item-thumbnail" />
            <span>{p.nome} - R$ {Number(p.preco).toFixed(2)}</span>
            <div className="item-buttons">
              <button onClick={() => handleEdit(p)} className="admin-button edit-button">Editar</button>
              <button onClick={() => handleDelete(p.id)} className="admin-button delete-button">Deletar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminPage;