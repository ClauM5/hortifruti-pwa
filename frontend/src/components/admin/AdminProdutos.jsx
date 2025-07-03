// Arquivo: frontend/src/components/admin/AdminProdutos.jsx

import React, { useState, useEffect, useCallback } from 'react';
import './AdminProdutos.css';

const API_BASE_URL = 'https://hortifruti-backend.onrender.com/api';

function AdminProdutos() {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [formProduto, setFormProduto] = useState({ id: null, nome: '', preco: '', unidade: 'kg', imagem: '', categorias: [] });
  const [imagemFile, setImagemFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const adminToken = '102030';

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [produtosRes, categoriasRes] = await Promise.all([
        fetch(`${API_BASE_URL}/produtos`),
        fetch(`${API_BASE_URL}/categorias`)
      ]);
      if (!produtosRes.ok || !categoriasRes.ok) throw new Error('Falha ao carregar dados');
      
      const produtosData = await produtosRes.json();
      const categoriasData = await categoriasRes.json();

      // Mapeia os nomes das categorias para IDs para o formulário
      const produtosComCategoriaIds = produtosData.map(p => {
        const categoriaIds = p.categorias.map(nomeCat => {
            const categoriaEncontrada = categoriasData.find(c => c.nome === nomeCat);
            return categoriaEncontrada ? categoriaEncontrada.id : null;
        }).filter(id => id !== null);
        return { ...p, categorias: categoriaIds };
      });

      setProdutos(produtosComCategoriaIds);
      setCategorias(categoriasData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleImageUpload = async (file) => {
    if (!file) return null;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: { 'authorization': adminToken },
        body: formData,
      });
      if (!response.ok) throw new Error('Falha no upload da imagem.');
      const data = await response.json();
      return data.imageUrl;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const clearFormProduto = () => {
    setFormProduto({ id: null, nome: '', preco: '', unidade: 'kg', imagem: '', categorias: [] });
    setImagemFile(null);
  };

  const handleSaveProduto = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    let imageUrl = formProduto.imagem;
    if (imagemFile) {
      imageUrl = await handleImageUpload(imagemFile);
      if (!imageUrl) {
        setIsLoading(false);
        return;
      }
    }

    const produtoData = { ...formProduto, imagem: imageUrl };
    const { id, ...data } = produtoData;
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_BASE_URL}/produtos/${id}` : `${API_BASE_URL}/produtos`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'authorization': adminToken
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(`Falha ao salvar produto.`);
      
      clearFormProduto();
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduto = async (produtoId) => {
    if (!window.confirm("Certeza que deseja deletar este produto?")) return;
    try {
      await fetch(`${API_BASE_URL}/produtos/${produtoId}`, {
        method: 'DELETE',
        headers: { 'authorization': adminToken }
      });
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditClick = (produto) => {
    setFormProduto({
        id: produto.id,
        nome: produto.nome,
        preco: produto.preco,
        unidade: produto.unidade,
        imagem: produto.imagem,
        categorias: produto.categorias || []
    });
    setImagemFile(null);
    window.scrollTo(0, 0);
  };

  const handleCategoryChange = (catId) => {
    setFormProduto(prev => {
      const newCategorias = prev.categorias.includes(catId)
        ? prev.categorias.filter(id => id !== catId)
        : [...prev.categorias, catId];
      return { ...prev, categorias: newCategorias };
    });
  };

  const handleFormInputChange = (e) => {
    setFormProduto(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    setImagemFile(e.target.files[0]);
  };

  return (
    <div className="admin-section-container">
      <h2>Gerenciar Produtos</h2>
      <p>Adicione, edite e remova os produtos da sua loja.</p>
      
      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleSaveProduto} className="admin-form product-form">
        <h3>{formProduto.id ? 'Editando Produto' : 'Adicionar Novo Produto'}</h3>
        <div className="form-grid">
            <input type="text" name="nome" placeholder="Nome do Produto" value={formProduto.nome} onChange={handleFormInputChange} required />
            <input type="number" name="preco" placeholder="Preço (ex: 9.99)" value={formProduto.preco} onChange={handleFormInputChange} required step="0.01" />
            <input type="text" name="unidade" placeholder="Unidade (kg, un, dz)" value={formProduto.unidade} onChange={handleFormInputChange} required />
        </div>
        
        <label>Imagem do Produto:</label>
        <input type="file" onChange={handleFileChange} accept="image/*" />
        {formProduto.imagem && !imagemFile && <img src={formProduto.imagem} alt="Preview" className="image-preview" />}

        <label>Categorias:</label>
        <div className="category-checkboxes">
          {categorias.map(cat => (
            <label key={cat.id} className="checkbox-label">
              <input 
                type="checkbox" 
                checked={formProduto.categorias.includes(cat.id)} 
                onChange={() => handleCategoryChange(cat.id)} 
              />
              {cat.nome}
            </label>
          ))}
        </div>

        <div className="form-buttons">
          <button type="submit" className="admin-button" disabled={isUploading}>
            {isUploading ? 'Enviando Imagem...' : (formProduto.id ? 'Atualizar Produto' : 'Salvar Produto')}
          </button>
          {formProduto.id && <button type="button" onClick={clearFormProduto} className="admin-button clear-button">Cancelar Edição</button>}
        </div>
      </form>

      <div className="product-list-admin">
        <h3>Lista de Produtos</h3>
        {isLoading ? <p>Carregando produtos...</p> : produtos.map(p => (
          <div key={p.id} className="product-item-admin">
            <img src={p.imagem || 'https://via.placeholder.com/50'} alt={p.nome} className="item-thumbnail" />
            <span>{p.nome}</span>
            <span>R$ {Number(p.preco).toFixed(2)}</span>
            <div className="item-buttons">
              <button onClick={() => handleEditClick(p)} className="admin-button edit-button">Editar</button>
              <button onClick={() => handleDeleteProduto(p.id)} className="admin-button delete-button">Deletar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminProdutos;