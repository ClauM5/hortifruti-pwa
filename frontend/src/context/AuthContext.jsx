// Arquivo: frontend/src/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const API_BASE_URL = 'https://hortifruti-backend.onrender.com/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [favoritos, setFavoritos] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setFavoritos(new Set());
    navigate('/');
  }, [navigate]);

  const fetchWithAuth = useCallback(async (url, options = {}) => {
    const currentToken = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401 || response.status === 403) {
      logout();
      throw new Error('Sua sessão expirou. Por favor, faça o login novamente.');
    }

    return response;
  }, [logout]);


  const fetchFavoritos = useCallback(async () => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) return;
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/meus-favoritos`);
      if (!response.ok) throw new Error('Falha ao buscar favoritos');
      const data = await response.json();
      setFavoritos(new Set(data));
    } catch (error) {
      console.error(error.message);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    const isAdminPage = location.pathname.startsWith('/admin');
    const currentToken = localStorage.getItem('token');
    if (currentToken && !isAdminPage) {
      try {
        const payload = JSON.parse(atob(currentToken.split('.')[1]));
        setUser(payload);
        fetchFavoritos();
      } catch (e) {
        logout();
      }
    }
    setIsLoading(false);
  }, [token, location.pathname, fetchFavoritos, logout]);

  const login = async (email, senha) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, senha }), });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    localStorage.setItem('token', data.token);
    setToken(data.token);
  };
  
  const register = async (nome, email, senha) => {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      return data;
  };

  const toggleFavorito = useCallback(async (produtoId) => {
    const isCurrentlyFavorito = favoritos.has(produtoId);
    
    // Atualiza a UI primeiro, de forma otimista
    const newFavoritos = new Set(favoritos);
    if (isCurrentlyFavorito) {
      newFavoritos.delete(produtoId);
    } else {
      newFavoritos.add(produtoId);
    }
    setFavoritos(newFavoritos);

    // Depois, envia a requisição para o backend
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/favoritos${isCurrentlyFavorito ? `/${produtoId}` : ''}`, {
        method: isCurrentlyFavorito ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: isCurrentlyFavorito ? null : JSON.stringify({ produtoId }),
      });

      if (!response.ok) {
        // Se a API falhar, desfaz a alteração na UI
        console.error('Falha na API, revertendo estado do favorito.');
        setFavoritos(favoritos); 
      }
    } catch (error) {
      console.error('Falha de rede ao atualizar favorito:', error);
      setFavoritos(favoritos);
    }
  }, [favoritos, fetchWithAuth]);

  const value = { user, token, isLoading, login, register, logout, favoritos, toggleFavorito, fetchWithAuth };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}