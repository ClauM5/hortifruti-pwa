// Arquivo: frontend/src/pages/CartPage.jsx

import React from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate, Link } from 'react-router-dom';
import './CartPage.css';

function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, clearCart } = useCart();
  const navigate = useNavigate();

  const total = cartItems.reduce((sum, item) => sum + Number(item.preco) * item.quantity, 0);

  return (
    <div className="cart-page-container">
      <h2>Meu Carrinho de Compras</h2>
      {cartItems.length === 0 ? (
        <div className="cart-empty">
          <p>Seu carrinho está vazio.</p>
          <button onClick={() => navigate('/')} className="primary-button">Continuar Comprando</button>
        </div>
      ) : (
        <>
          <div className="cart-items-list">
            {cartItems.map(item => (
              <div key={item.id} className="cart-page-item">
                <img src={item.imagem || 'https://via.placeholder.com/100'} alt={item.nome} />
                <div className="item-details">
                  <h3>{item.nome}</h3>
                  <p>Preço: R$ {Number(item.preco).toFixed(2).replace('.', ',')}</p>
                  <div className="quantity-controls">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                  </div>
                </div>
                <div className="item-total">
                  <p>Subtotal: R$ {(Number(item.preco) * item.quantity).toFixed(2).replace(',', '.')}</p>
                  <button onClick={() => removeFromCart(item.id)} className="remove-item-button">Remover</button>
                </div>
              </div>
            ))}
          </div>
          <div className="cart-summary">
            <h3>Resumo da Compra</h3>
            <div className="summary-row">
              <span>Total dos Produtos:</span>
              <span>R$ {total.toFixed(2).replace('.', ',')}</span>
            </div>
            {/* Futuramente, podemos adicionar o frete aqui */}
            <div className="summary-row total-row">
              <span>Total:</span>
              <span>R$ {total.toFixed(2).replace('.', ',')}</span>
            </div>
            <button onClick={() => navigate('/checkout')} className="primary-button">Ir para o Checkout</button>
            <button onClick={clearCart} className="secondary-button">Limpar Carrinho</button>
          </div>
        </>
      )}
    </div>
  );
}

export default CartPage;