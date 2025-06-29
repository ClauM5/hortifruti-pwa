// Arquivo: frontend/src/pages/AccountPage.jsx (Final com Histórico de Pedidos)

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AuthPages.css'; // Vamos reusar e adicionar estilos aqui

const API_MY_ORDERS_URL = 'https://hortifruti-backend.onrender.com/api/meus-pedidos';

function AccountPage() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  
  const [pedidos, setPedidos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Se não tem usuário ou token, não faz nada
    if (!token) {
      setIsLoading(false);
      return;
    }

    const fetchPedidos = async () => {
      try {
        const response = await fetch(API_MY_ORDERS_URL, {
          headers: {
            'Authorization': `Bearer ${token}` // Envia o token para a rota protegida
          }
        });
        if (!response.ok) {
          throw new Error('Falha ao buscar seus pedidos.');
        }
        const data = await response.json();
        setPedidos(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPedidos();
  }, [token]); // Roda o efeito sempre que o token mudar (ex: no login)

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (isLoading) {
    return <p>Carregando...</p>;
  }

  if (!user) {
    return (
      <div className="auth-container">
        <p>Você precisa estar logado para ver esta página.</p>
        <button onClick={() => navigate('/login')}>Fazer Login</button>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="account-page">
        <div className="account-header">
          <h2>Minha Conta</h2>
          <button onClick={handleLogout} className="logout-button">Sair</button>
        </div>
        <p>Olá, <strong>{user.nome}!</strong></p>
        
        <div className="order-history">
          <h3>Seus Pedidos</h3>
          {error && <p className="error-message">{error}</p>}
          {pedidos.length > 0 ? (
            pedidos.map(pedido => (
              <div key={pedido.id} className="order-summary-card">
                <div className="order-summary-header">
                  <span>Pedido #{pedido.id} - {new Date(pedido.data_pedido).toLocaleDateString('pt-BR')}</span>
                  <span className={`status status-${pedido.status.toLowerCase()}`}>{pedido.status}</span>
                </div>
                {/* Você pode adicionar mais detalhes dos itens aqui se quiser */}
                <div className="order-summary-footer">
                  <strong>Total: R$ {Number(pedido.valor_total).toFixed(2).replace('.',',')}</strong>
                </div>
              </div>
            ))
          ) : (
            <p>Você ainda não fez nenhum pedido.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AccountPage;