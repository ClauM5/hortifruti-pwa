// Arquivo: frontend/src/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const API_AUTH_URL = 'https://hortifruti-backend.onrender.com/api/auth';
const API_FAVORITOS_URL = 'https://hortifruti-backend.onrender.com/api/favoritos';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [favoritos, setFavoritos] = useState(new Set()); // Usaremos um Set para performance
  const [isLoading, setIsLoading] = useState(true);

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
      console.error(error);
    }
  }, []);

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser(payload);
        fetchFavoritos(token);
      } catch (e) {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
    }
    setIsLoading(false);
  }, [token, fetchFavoritos]);

  const login = async (email, senha) => {
    const response = await fetch(`${API_AUTH_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (nome, email, senha) => {
    const response = await fetch(`${API_AUTH_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setFavoritos(new Set());
  }, []);

  const toggleFavorito = useCallback(async (produtoId) => {
    if (!token) return;
    const isFavorito = favoritos.has(produtoId);
    const method = isFavorito ? 'DELETE' : 'POST';
    const url = isFavorito ? `${API_FAVORITOS_URL}/${produtoId}` : API_FAVORITOS_URL;
    
    const newFavoritos = new Set(favoritos);
    if (isFavorito) {
      newFavoritos.delete(produtoId);
    } else {
      newFavoritos.add(produtoId);
    }
    setFavoritos(newFavoritos);
    
    try {
      await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: method === 'POST' ? JSON.stringify({ produtoId }) : null,
      });
    } catch (error) {
      console.error('Falha ao atualizar favorito:', error);
      setFavoritos(favoritos); 
    }
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