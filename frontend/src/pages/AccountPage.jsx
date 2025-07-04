// Arquivo: frontend/src/pages/AccountPage.jsx (Versão Refatorada e Corrigida)

import React, { useState, useEffect, useCallback } from 'react';
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

  const fetchPedidos = useCallback(async () => {
    // Não mostra o "Carregando..." para as atualizações de polling, só para a inicial
    if (!isLoading) setIsLoading(true);
    setError('');
    
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/meus-pedidos`);
      if (!response.ok) throw new Error('Falha ao buscar seus pedidos.');
      const data = await response.json();
      setPedidos(data);
    } catch (err) {
      // Se o erro for de sessão expirada, o fetchWithAuth já faz o logout
      if (err.message !== 'Sua sessão expirou. Por favor, faça o login novamente.') {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, fetchWithAuth]); // A dependência do isLoading foi removida para evitar loops

  useEffect(() => {
    if (token) {
        fetchPedidos(); // Busca os pedidos na primeira vez que a página carrega
    } else {
        setIsLoading(false);
    }
  }, [token, fetchPedidos]);


  const handleLogout = () => { logout(); };

  const handleReorder = (itensDoPedido) => {
    fetch(`${API_BASE_URL}/produtos`)
      .then(res => res.json())
      .then(allProducts => {
        itensDoPedido.forEach(item => {
          const produtoCompleto = allProducts.find(p => p.id === item.produto_id);
          if (produtoCompleto) {
            for (let i = 0; i < item.quantidade; i++) { addToCart(produtoCompleto); }
          }
        });
        navigate('/checkout');
      });
  };

  if (isLoading) {
    return <div className="auth-container"><p>Carregando seus dados...</p></div>;
  }

  if (!user) {
    return (
      <div className="auth-container">
        <div className="account-page">
          <p>Você precisa estar logado para ver esta página.</p>
          <button onClick={() => navigate('/login')} className="primary-button">Fazer Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="account-page">
        <div className="account-header"><h2>Minha Conta</h2><button onClick={handleLogout} className="logout-button">Sair</button></div>
        <p>Olá, <strong>{user.nome}!</strong></p>
        <div className="account-links">
          <Link to="/meus-favoritos" className="account-link-box">Meus Favoritos</Link>
          <Link to="/meus-enderecos" className="account-link-box">Meus Endereços</Link>
          {/* O botão de notificação pode ser adicionado de volta aqui quando quisermos */}
        </div>
        <div className="order-history">
          <h3>Seus Pedidos</h3>
          {error && <p className="error-message">{error}</p>}
          {pedidos.length > 0 ? (
            pedidos.map(pedido => (
              <div key={pedido.id} className="order-summary-card">
                <div className="order-summary-header">
                  <span>Pedido #{pedido.id} - {new Date(pedido.data_pedido).toLocaleDateString('pt-BR')}</span>
                  <span className={`status status-${pedido.status.toLowerCase().replace(/\s+/g, '-')}`}>{pedido.status}</span>
                </div>
                <div className="order-summary-body"><p><strong>Total:</strong> R$ {Number(pedido.valor_total).toFixed(2).replace('.',',')}</p></div>
                <div className="order-summary-actions">
                  <button onClick={() => navigate(`/pedido/${pedido.id}`)} className="details-button">Ver Detalhes</button>
                  <button onClick={(e) => { e.preventDefault(); handleReorder(pedido.itens); }} className="reorder-button">Pedir Novamente</button>
                </div>
              </div>
            ))
          ) : ( <p>Você ainda não fez nenhum pedido.</p> )}
        </div>
      </div>
    </div>
  );
}

export default AccountPage;