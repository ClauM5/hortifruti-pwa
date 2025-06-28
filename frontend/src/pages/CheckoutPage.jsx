// Arquivo: frontend/src/pages/CheckoutPage.jsx (Final com clearCart)

import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import './CheckoutPage.css';

const API_PEDIDOS_URL = 'https://hortifruti-backend.onrender.com/api/pedidos';

function CheckoutPage() {
  // 1. Puxamos a nova função clearCart do nosso hook
  const { cartItems, clearCart } = useCart(); 
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    nome_cliente: '',
    endereco_cliente: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pedidoSucesso, setPedidoSucesso] = useState(null);

  const total = cartItems.reduce((sum, item) => sum + Number(item.preco) * item.quantity, 0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const pedido = {
      ...formData,
      itens: cartItems,
    };

    try {
      const response = await fetch(API_PEDIDOS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pedido),
      });

      if (!response.ok) {
        throw new Error('Houve um problema ao finalizar seu pedido. Tente novamente.');
      }

      const result = await response.json();
      setPedidoSucesso(result.pedidoId);
      clearCart(); // <-- 2. CHAMAMOS A FUNÇÃO AQUI! O carrinho é limpo após o sucesso.
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Quando o pedido for um sucesso, redireciona para a home após 5 segundos
  useEffect(() => {
    if(pedidoSucesso) {
      const timer = setTimeout(() => {
        navigate('/');
      }, 5000); // 5000 milissegundos = 5 segundos
      
      // Limpa o timer se o componente for desmontado
      return () => clearTimeout(timer);
    }
  }, [pedidoSucesso, navigate]);
  
  if (pedidoSucesso) {
    return (
      <div className="checkout-container success-message">
        <h2>Obrigado pelo seu pedido!</h2>
        <p>Seu pedido nº <strong>{pedidoSucesso}</strong> foi recebido com sucesso.</p>
        <p>Você será redirecionado para a loja em 5 segundos.</p>
        <button onClick={() => navigate('/')} className="primary-button">Voltar para a Loja Agora</button>
      </div>
    );
  }

  return (
    // ... O resto do JSX do formulário continua exatamente o mesmo ...
    <div className="checkout-container">
      <h2>Finalizar Pedido</h2>
      
      <div className="order-summary">
        <h3>Resumo do Pedido</h3>
        {cartItems.map(item => (
          <div key={item.id} className="summary-item">
            <span>{item.quantity}x {item.nome}</span>
            <span>R$ {(Number(item.preco) * item.quantity).toFixed(2).replace('.', ',')}</span>
          </div>
        ))}
        <div className="summary-total">
          <strong>Total: R$ {total.toFixed(2).replace('.', ',')}</strong>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="checkout-form">
        <h3>Seus Dados</h3>
        <label htmlFor="nome_cliente">Nome Completo</label>
        <input type="text" id="nome_cliente" name="nome_cliente" value={formData.nome_cliente} onChange={handleInputChange} required/>
        <label htmlFor="endereco_cliente">Endereço de Entrega</label>
        <textarea id="endereco_cliente" name="endereco_cliente" value={formData.endereco_cliente} onChange={handleInputChange} required rows="4"/>
        {error && <p className="error-message">{error}</p>}
        <button type="submit" disabled={isLoading || cartItems.length === 0} className="primary-button">
          {isLoading ? 'Enviando Pedido...' : 'Finalizar Pedido'}
        </button>
      </form>
    </div>
  );
}

export default CheckoutPage;