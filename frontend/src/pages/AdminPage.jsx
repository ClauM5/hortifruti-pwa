// Arquivo: frontend/src/pages/AdminPage.jsx (Versão Funcional)

import React, { useState, useEffect } from 'react';
import './AdminPage.css';

// A URL base da nossa API
const API_BASE_URL = 'https://hortifruti-backend.onrender.com/api/produtos';

function AdminPage() {
  const [produtos, setProdutos] = useState([]);
  const [senha, setSenha] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Estado para o formulário
  const [formProduto, setFormProduto] = useState({
    id: null, // Se tiver um id, estamos editando. Se for null, estamos criando.
    nome: '',
    preco: '',
    unidade: 'kg',
    imagem: ''
  });

  // --- Funções de API ---

  const fetchProdutos = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_BASE_URL);
      const data = await response.json();
      setProdutos(data);
    } catch (err) {
      setError('Falha ao carregar produtos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault(); // Previne o recarregamento da página pelo formulário
    setIsLoading(true);
    setError('');

    const { id, ...data } = formProduto;
    const method = id ? 'PUT' : 'POST'; // Se tem ID, método é PUT (Update), senão é POST (Create)
    const url = id ? `${API_BASE_URL}/${id}` : API_BASE_URL;

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'authorization': senha // Enviando a senha no cabeçalho para nosso "porteiro"
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Falha ao salvar produto: ${response.statusText}`);
      }

      // Limpa o formulário e recarrega a lista de produtos
      clearForm();
      fetchProdutos();

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (produtoId) => {
    if (!window.confirm("Tem certeza que deseja deletar este produto?")) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/${produtoId}`, {
        method: 'DELETE',
        headers: { 'authorization': senha }
      });

      if (!response.ok) {
        throw new Error(`Falha ao deletar: ${response.statusText}`);
      }
      fetchProdutos(); // Recarrega a lista

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Funções Auxiliares ---

  // Preenche o formulário para edição
  const handleEdit = (produto) => {
    setFormProduto(produto);
    window.scrollTo(0, 0); // Rola a página para o topo, onde está o formulário
  };

  // Limpa o formulário
  const clearForm = () => {
    setFormProduto({ id: null, nome: '', preco: '', unidade: 'kg', imagem: '' });
  };

  // Atualiza o estado do formulário enquanto o usuário digita
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormProduto(prevState => ({ ...prevState, [name]: value }));
  };

  const handleLogin = () => {
    // A senha precisa ser a mesma que você colocou no Render!
    if (senha === '102030') { // <<--- MUDE AQUI PARA A SUA SENHA
      setIsLoggedIn(true);
    } else {
      alert('Senha incorreta!');
    }
  };

  // Carrega os produtos assim que o login é feito
  useEffect(() => {
    if (isLoggedIn) {
      fetchProdutos();
    }
  }, [isLoggedIn]);


  // --- RENDERIZAÇÃO ---

  // Tela de Login
  if (!isLoggedIn) {
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

  // Painel Principal
  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Gerenciar Produtos</h2>
        <button onClick={() => setIsLoggedIn(false)} className="admin-button logout-button">Sair</button>
      </div>

      {error && <p className="error-message">{error}</p>}
      {isLoading && <p>Carregando...</p>}

      {/* Formulário de Criação/Edição */}
      <form onSubmit={handleSave} className="admin-form">
        <h3>{formProduto.id ? 'Editando Produto' : 'Adicionar Novo Produto'}</h3>
        <input type="text" name="nome" placeholder="Nome do Produto" value={formProduto.nome} onChange={handleFormChange} required />
        <input type="number" name="preco" placeholder="Preço (ex: 7.99)" value={formProduto.preco} onChange={handleFormChange} required step="0.01" />
        <input type="text" name="unidade" placeholder="Unidade (kg, un, etc)" value={formProduto.unidade} onChange={handleFormChange} required />
        <input type="text" name="imagem" placeholder="URL da Imagem" value={formProduto.imagem} onChange={handleFormChange} />
        <div className="form-buttons">
            <button type="submit" className="admin-button save-button">Salvar</button>
            {formProduto.id && <button type="button" onClick={clearForm} className="admin-button clear-button">Cancelar Edição</button>}
        </div>
      </form>

      {/* Lista de Produtos */}
      <div className="product-list">
        {produtos.map(p => (
          <div key={p.id} className="product-item">
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