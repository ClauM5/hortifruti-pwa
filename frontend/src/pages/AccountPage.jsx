// Arquivo: frontend/src/pages/AccountPage.jsx (Com Polling)

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNavigate, Link } from 'react-router-dom';
import { subscribeUserToPush } from '../utils/push-notifications';
import './AuthPages.css';

const API_BASE_URL = 'https://hortifruti-backend.onrender.com/api';

function AccountPage() {
  const { user, token, logout } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPedidos = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/meus-pedidos`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Falha ao buscar seus pedidos.');
      const data = await response.json();
      setPedidos(data);
    } catch (err) { setError(err.message); } finally { if(isLoading) setIsLoading(false); }
  };

  // Efeito para a busca inicial
  useEffect(() => {
    fetchPedidos();
  }, [token]);

  // Efeito para o polling da lista de pedidos
  useEffect(() => {
    if (!token) return;
    // A cada 15 segundos, busca a lista de pedidos novamente
    const intervalId = setInterval(() => {
        fetchPedidos();
    }, 15000); // 15 segundos
    
    return () => clearInterval(intervalId);
  }, [token]);


  const handleLogout = () => { logout(); navigate('/'); };
  const handleReorder = (itensDoPedido) => { fetch(`${API_BASE_URL}/produtos`).then(res => res.json()).then(allProducts => { itensDoPedido.forEach(item => { const produtoCompleto = allProducts.find(p => p.id === item.produto_id); if (produtoCompleto) { for (let i = 0; i < item.quantidade; i++) { addToCart(produtoCompleto); } } }); navigate('/checkout'); }); };
  const handleEnableNotifications = async () => { if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) { alert('Seu navegador não suporta notificações push.'); return; } if (Notification.permission === 'granted') { alert('As notificações já estão ativadas.'); await subscribeUserToPush(token); } else if (Notification.permission !== 'denied') { const permission = await Notification.requestPermission(); if (permission === 'granted') { await subscribeUserToPush(token); } } else { alert('As notificações estão bloqueadas nas configurações do seu navegador.'); } };

  if (isLoading) return <p>Carregando seus dados...</p>;
  if (!user) { return ( <div className="auth-container"> <p>Você precisa estar logado.</p> <button onClick={() => navigate('/login')}>Fazer Login</button> </div> ); }

  return (
    <div className="auth-container">
      <div className="account-page">
        <div className="account-header"><h2>Minha Conta</h2><button onClick={handleLogout} className="logout-button">Sair</button></div>
        <p>Olá, <strong>{user.nome}!</strong></p>
        <div className="account-links">
          <Link to="/meus-favoritos" className="account-link-box">Meus Favoritos</Link>
          <Link to="/meus-enderecos" className="account-link-box">Meus Endereços</Link>
          <button onClick={handleEnableNotifications} className="account-link-box notification-button">Ativar Notificações</button>
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