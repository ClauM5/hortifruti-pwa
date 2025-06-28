// Arquivo: frontend/src/pages/AdminPage.jsx

import React, { useState, useEffect } from 'react';
import './AdminPage.css'; // Vamos criar este arquivo de estilo a seguir

const API_URL = import.meta.env.VITE_API_URL || 'https://hortifruti-backend.onrender.com/api/produtos';

function AdminPage() {
  const [produtos, setProdutos] = useState([]);
  const [senha, setSenha] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Formulário para criar/editar produto
  const [formProduto, setFormProduto] = useState({
    id: null,
    nome: '',
    preco: '',
    unidade: 'kg',
    imagem: ''
  });

  // Função para carregar os produtos do backend
  const fetchProdutos = async () => {
    const response = await fetch(API_URL.replace('/admin', ''));
    const data = await response.json();
    setProdutos(data);
  };

  // Função para lidar com o login
  const handleLogin = () => {
    // Futuramente, podemos validar a senha aqui, mas por agora vamos simplificar
    setIsLoggedIn(true);
  };

  // Carrega os produtos quando a página é carregada (se logado)
  useEffect(() => {
    if (isLoggedIn) {
      fetchProdutos();
    }
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="admin-login-container">
        <h2>Painel de Administrador</h2>
        <input
          type="password"
          placeholder="Digite a senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="admin-input"
        />
        <button onClick={handleLogin} className="admin-button">Entrar</button>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <h2>Gerenciar Produtos</h2>
      {/* AQUI ENTRARÁ O FORMULÁRIO E A LISTA DE PRODUTOS */}
      <p>Bem-vindo ao painel! Em breve você poderá gerenciar seus produtos aqui.</p>
    </div>
  );
}

export default AdminPage;