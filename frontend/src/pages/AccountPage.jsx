// Substitua todo o conteúdo do arquivo
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNavigate, Link } from 'react-router-dom';
import './AuthPages.css';

const API_BASE_URL = 'https://hortifruti-backend.onrender.com/api';

function AccountPage() {
  const { user, token, logout, fetchWithAuth } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setIsLoading(false); return; }
    const fetchPedidos = async () => {
      try {
        const response = await fetchWithAuth(`${API_BASE_URL}/meus-pedidos`);
        if (!response.ok) throw new Error('Falha ao buscar seus pedidos.');
        const data = await response.json();
        setPedidos(data);
      } catch (err) {
        if (err.message !== 'Sua sessão expirou. Por favor, faça o login novamente.') {
          setError(err.message);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchPedidos();
  }, [token, fetchWithAuth]);

  // Lógica de Polling
  useEffect(() => {
    if (!token || !user) return;
    const intervalId = setInterval(async () => {
      try {
        const response = await fetchWithAuth(`${API_BASE_URL}/meus-pedidos`);
        const data = await response.json();
        setPedidos(data);
      } catch(err) { console.error("Polling falhou:", err.message) }
    }, 15000);
    return () => clearInterval(intervalId);
  }, [token, user, fetchWithAuth]);

  const handleLogout = () => { logout(); };
  const handleReorder = (itensDoPedido) => { /* ... sem alterações ... */ };

  // ... (resto do componente)
}
export default AccountPage;