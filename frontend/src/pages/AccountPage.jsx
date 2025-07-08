// Arquivo: frontend/src/pages/AccountPage.jsx (COMPLETO E OTIMIZADO)

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNavigate, Link } from 'react-router-dom';
import { subscribeUserToPush } from '../utils/push-notifications';
import './AuthPages.css';

const API_BASE_URL = 'https://hortifruti-backend.onrender.com/api';
const WS_URL = 'wss://hortifruti-backend.onrender.com'; // URL do WebSocket

function AccountPage() {
  const { user, token, logout, fetchWithAuth } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Busca os pedidos uma única vez ao carregar a página
  const fetchPedidos = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError('');
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
  }, [token, fetchWithAuth]);
  
  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);


  // Efeito para conectar ao WebSocket e receber atualizações em tempo real
  useEffect(() => {
    if (!token) return;

    const ws = new WebSocket(`${WS_URL}?token=${token}`);

    ws.onopen = () => {
      console.log('Conectado ao WebSocket na página da conta.');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'STATUS_UPDATE') {
        const { pedidoId, novoStatus } = message.payload;
        // Atualiza o status do pedido específico na lista, sem precisar recarregar tudo
        setPedidos(prevPedidos =>
          prevPedidos.map(p =>
            p.id === pedidoId ? { ...p, status: novoStatus } : p
          )
        );
      }
    };

    ws.onclose = () => {
      console.log('Desconectado do WebSocket na página da conta.');
    };

    // Limpa a conexão ao sair da página para evitar memory leaks
    return () => {
      ws.close();
    };
  }, [token]);


  const handleLogout = () => { logout(); };

  const handleReorder = (itensDoPedido) => {
    fetch(`${API_BASE_URL}/produtos`).then(res => res.json()).then(allProducts => {
      itensDoPedido.forEach(item => {
        const produtoCompleto = allProducts.find(p => p.id === item.produto_id);
        if (produtoCompleto) { for (let i = 0; i < item.quantidade; i++) { addToCart(produtoCompleto); } }
      });
      navigate('/checkout');
    });
  };

  const handleEnableNotifications = async () => {
    if (!token) {
        alert("Você precisa estar logado para ativar as notificações.");
        return;
    }
    await subscribeUserToPush(token);
  };

  if (isLoading) {
    return <div className="auth-container"><p>Carregando seus dados...</p></div>;
  }
  if (!user) {
    return ( <div className="auth-container"> <div className="account-page"> <p>Você precisa estar logado para ver esta página.</p> <button onClick={() => navigate('/login')} className="primary-button">Fazer Login</button> </div> </div> );
  }

  return (
    <div className="auth-container">
      <div className="account-page">
        <div className="account-header"><h2>Minha Conta</h2><button onClick={handleLogout} className="logout-button">Sair</button></div>
        <p>Olá, <strong>{user.nome}!</strong></p>
        
        <button onClick={handleEnableNotifications} className="notification-button">
          Ativar Notificações de Pedidos
        </button>
        
        <div className="account-links">
          <Link to="/meus-favoritos" className="account-link-box">Meus Favoritos</Link>
          <Link to="/meus-enderecos" className="account-link-box">Meus Endereços</Link>
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
                <div className="order-summary-body"><p><strong>Total:</strong> R$ {Number(pedido.valor_total).toFixed(2).replace(',', '.')}</p></div>
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