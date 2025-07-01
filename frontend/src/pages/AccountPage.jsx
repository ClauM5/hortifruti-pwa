// Arquivo: frontend/src/pages/AccountPage.jsx (Com a função que faltava)

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNavigate, Link } from 'react-router-dom';
import { subscribeUserToPush } from '../utils/push-notifications'; // Importa a função de inscrição
import './AuthPages.css';

const API_BASE_URL = 'https://hortifruti-backend.onrender.com/api';
const WS_URL = 'wss://hortifruti-backend.onrender.com';

function AccountPage() {
  const { user, token, logout } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  
  const [pedidos, setPedidos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setIsLoading(false); return; }
    const fetchPedidos = async () => {
      setIsLoading(true); setError('');
      try {
        const response = await fetch(`${API_BASE_URL}/meus-pedidos`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error('Falha ao buscar seus pedidos.');
        const data = await response.json();
        setPedidos(data);
      } catch (err) { setError(err.message); } finally { setIsLoading(false); }
    };
    fetchPedidos();
  }, [token]);

  useEffect(() => {
    if (!token || !user) return;
    const ws = new WebSocket(`${WS_URL}?token=${token}`);
    ws.onopen = () => console.log('Conexão WebSocket aberta na página da conta.');
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'STATUS_UPDATE') {
        setPedidos(prevPedidos => 
          prevPedidos.map(p => 
            p.id === message.payload.pedidoId 
              ? { ...p, status: message.payload.novoStatus } 
              : p
          )
        );
      }
    };
    ws.onerror = (err) => console.error("Erro no WebSocket da conta:", err);
    ws.onclose = () => console.log('Conexão WebSocket da conta fechada.');
    return () => { ws.close(); };
  }, [token, user]);

  const handleLogout = () => { logout(); navigate('/'); };
  const handleReorder = (itensDoPedido) => {
    fetch(`${API_BASE_URL}/produtos`).then(res => res.json()).then(allProducts => {
      itensDoPedido.forEach(item => {
        const produtoCompleto = allProducts.find(p => p.id === item.produto_id);
        if (produtoCompleto) {
          for (let i = 0; i < item.quantidade; i++) { addToCart(produtoCompleto); }
        }
      });
      navigate('/checkout');
    });
  };

  // =======================================================
  // >> A FUNÇÃO QUE ESTAVA FALTANDO <<
  // =======================================================
  const handleEnableNotifications = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        alert('Seu navegador não suporta notificações push.');
        return;
    }

    if (Notification.permission === 'granted') {
        alert('As notificações já estão ativadas.');
        await subscribeUserToPush(token);
    } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            await subscribeUserToPush(token);
        }
    } else {
        alert('As notificações estão bloqueadas. Por favor, altere as permissões do site nas configurações do seu navegador.');
    }
  };


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
          {/* Este botão agora tem uma função para chamar */}
          <button onClick={handleEnableNotifications} className="account-link-box notification-button">
            Ativar Notificações de Pedidos
          </button>
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