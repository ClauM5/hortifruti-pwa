// Arquivo: frontend/src/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const AuthContext = createContext();

const API_AUTH_URL = 'https://hortifruti-backend.onrender.com/api/auth';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  // Efeito para verificar o token no localStorage ao carregar o app
  useEffect(() => {
    if (token) {
      // Aqui, em um app mais complexo, você verificaria se o token ainda é válido
      // Por enquanto, vamos assumir que se tem token, está logado.
      // E decodificar o token para pegar os dados do usuário.
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser(payload);
      } catch (e) {
        // Token inválido, limpa
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
    }
    setIsLoading(false);
  }, [token]);

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
  }, []);

  const value = { user, token, isLoading, login, register, logout };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}