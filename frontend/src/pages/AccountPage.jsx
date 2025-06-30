// Arquivo: frontend/src/pages/AccountPage.jsx (Com botão "Pedir Novamente")

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext'; // 1. Importa o useCart
import { useNavigate, Link } from 'react-router-dom';
import './AuthPages.css';

const API_BASE_URL = 'https://hortifruti-backend.onrender.com/api';

function AccountPage() {
  const { user, token, logout } = useAuth();
  const { addToCart } = useCart(); // 2. Puxa a função addToCart
  const navigate = useNavigate();
  
  const [pedidos, setPedidos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) { setIsLoading(false); return; }
    const fetchPedidos = async () => {
      // ... (código para buscar os pedidos continua o mesmo) ...
      try {
        const response = await fetch(`${API_BASE_URL}/meus-pedidos`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error('Falha ao buscar seus pedidos.');
        const data = await response.json();
        setPedidos(data);
      } catch (err) { console.error(err.message); } finally { setIsLoading(false); }
    };
    fetchPedidos();
  }, [token]);

  const handleLogout = () => { logout(); navigate('/'); };

  // 3. NOVA FUNÇÃO para a recompra
  const handleReorder = (itensDoPedido) => {
    // Busca a lista de todos os produtos para ter os detalhes completos
    fetch(`${API_BASE_URL}/produtos`)
      .then(res => res.json())
      .then(allProducts => {
        itensDoPedido.forEach(item => {
          const produtoCompleto = allProducts.find(p => p.id === item.produto_id);
          if (produtoCompleto) {
            // Adiciona o produto ao carrinho a quantidade de vezes do pedido original
            for (let i = 0; i < item.quantidade; i++) {
              addToCart(produtoCompleto);
            }
          }
        });
        // Leva o usuário para o checkout após adicionar os itens
        navigate('/checkout');
      });
  };

  if (isLoading) return <p>Carregando...</p>;
  if (!user) { return ( <div className="auth-container"> <p>Você precisa estar logado.</p> <button onClick={() => navigate('/login')}>Fazer Login</button> </div> ); }

  return (
    <div className="auth-container">
      <div className="account-page">
        <div className="account-header">
          <h2>Minha Conta</h2>
          <button onClick={handleLogout} className="logout-button">Sair</button>
        </div>
        <p>Olá, <strong>{user.nome}!</strong></p>
        
        <div className="account-links">
          <Link to="/meus-favoritos" className="account-link-box">Ver meus favoritos</Link>
        </div>

        <div className="order-history">
          <h3>Seus Pedidos</h3>
          {pedidos.length > 0 ? (
            pedidos.map(pedido => (
              <div key={pedido.id} className="order-summary-card">
                <div className="order-summary-header">
                  <span>Pedido #{pedido.id} - {new Date(pedido.data_pedido).toLocaleDateString('pt-BR')}</span>
                  <span className={`status status-${pedido.status.toLowerCase().replace(/\s+/g, '-')}`}>{pedido.status}</span>
                </div>
                
                <div className="order-summary-footer">
                  <strong>Total: R$ {Number(pedido.valor_total).toFixed(2).replace('.',',')}</strong>
                  {/* 4. O NOVO BOTÃO */}
                  <button onClick={() => handleReorder(pedido.itens)} className="reorder-button">
                    Pedir Novamente
                  </button>
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