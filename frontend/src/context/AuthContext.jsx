// Arquivo: frontend/src/context/AuthContext.jsx (Com lógica de separação)

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom'; // 1. Importa o useLocation para saber a URL atual

const API_AUTH_URL = 'https://hortifruti-backend.onrender.com/api/auth';
const API_FAVORITOS_URL = 'https://hortifruti-backend.onrender.com/api/favoritos';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [favoritos, setFavoritos] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation(); // 2. Pega a informação da localização atual

  const fetchFavoritos = useCallback(async (currentToken) => {
    if (!currentToken) return;
    try {
      const response = await fetch(`${API_FAVORITOS_URL.replace('/favoritos', '/meus-favoritos')}`, {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });
      if (!response.ok) throw new Error('Falha ao buscar favoritos');
      const data = await response.json();
      setFavoritos(new Set(data));
    } catch (error) {
      console.error(error); // Mantém o log do erro, mas não vai mais quebrar a experiência
    }
  }, []);

  useEffect(() => {
    // 3. Verifica se a rota atual começa com /admin
    const isAdminPage = location.pathname.startsWith('/admin');

    // Só tenta carregar dados do usuário se tiver token E NÃO for uma página de admin
    if (token && !isAdminPage) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser(payload);
        fetchFavoritos(token);
      } catch (e) {
        // Token inválido, limpa tudo
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
    }
    setIsLoading(false);
  }, [token, fetchFavoritos, location.pathname]); // Adiciona o caminho da URL como dependência

  const login = async (email, senha) => {
    // ... (função de login continua a mesma)
    const response = await fetch(`${API_AUTH_URL}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, senha }), });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (nome, email, senha) => {
    // ... (função de registro continua a mesma)
    const response = await fetch(`${API_AUTH_URL}/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome, email, senha }), });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
  };

  const logout = useCallback(() => {
    // ... (função de logout continua a mesma)
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setFavoritos(new Set());
  }, []);

  const toggleFavorito = useCallback(async (produtoId) => {
    // ... (função de favoritar continua a mesma)
    if (!token) return;
    const isFavorito = favoritos.has(produtoId);
    const method = isFavorito ? 'DELETE' : 'POST';
    const url = isFavorito ? `${API_FAVORITOS_URL}/${produtoId}` : API_FAVORITOS_URL;
    const newFavoritos = new Set(favoritos);
    if (isFavorito) { newFavoritos.delete(produtoId); } else { newFavoritos.add(produtoId); }
    setFavoritos(newFavoritos);
    try { await fetch(url, { method, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: method === 'POST' ? JSON.stringify({ produtoId }) : null, }); } catch (error) { setFavoritos(favoritos); }
  }, [token, favoritos]);

  const value = { user, token, isLoading, login, register, logout, favoritos, toggleFavorito };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}