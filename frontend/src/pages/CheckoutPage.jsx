// Arquivo: frontend/src/pages/CheckoutPage.jsx

import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import './CheckoutPage.css';

const API_PEDIDOS_URL = 'https://hortifruti-backend.onrender.com/api/pedidos';

function CheckoutPage() {
  const { cartItems, addToCart, removeFromCart, updateQuantity } = useCart(); // Adicionamos as funções do carrinho para limpar depois
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
      // Limpar o carrinho - aqui vamos precisar de uma nova função no context
      // Por enquanto, vamos apenas mostrar a mensagem de sucesso
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Se o pedido foi um sucesso, mostra uma mensagem de agradecimento
  if (pedidoSucesso) {
    return (
      <div className="checkout-container success-message">
        <h2>Obrigado pelo seu pedido!</h2>
        <p>Seu pedido nº <strong>{pedidoSucesso}</strong> foi recebido com sucesso.</p>
        <p>Em breve você receberá atualizações sobre a entrega.</p>
        <button onClick={() => navigate('/')} className="primary-button">Voltar para a Loja</button>
      </div>
    );
  }

  return (
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
        <input
          type="text"
          id="nome_cliente"
          name="nome_cliente"
          value={formData.nome_cliente}
          onChange={handleInputChange}
          required
        />
        
        <label htmlFor="endereco_cliente">Endereço de Entrega</label>
        <textarea
          id="endereco_cliente"
          name="endereco_cliente"
          value={formData.endereco_cliente}
          onChange={handleInputChange}
          required
          rows="4"
        />

        {error && <p className="error-message">{error}</p>}
        
        <button type="submit" disabled={isLoading || cartItems.length === 0} className="primary-button">
          {isLoading ? 'Enviando Pedido...' : 'Finalizar Pedido'}
        </button>
      </form>
    </div>
  );
}

export default CheckoutPage;