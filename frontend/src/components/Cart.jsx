// Arquivo: frontend/src/components/Cart.jsx

import React from 'react';
import { useCart } from '../context/CartContext';
import './Cart.css';

function Cart() {
  const { cartItems, removeFromCart, updateQuantity } = useCart();

  const total = cartItems.reduce((sum, item) => sum + Number(item.preco) * item.quantity, 0);

  if (cartItems.length === 0) {
    return (
      <div className="cart-container">
        <h3>Meu Carrinho</h3>
        <p>Seu carrinho está vazio.</p>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h3>Meu Carrinho</h3>
      {cartItems.map(item => (
        <div key={item.id} className="cart-item">
          <span>{item.nome}</span>
          <div className="cart-item-controls">
            <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
            <span>{item.quantity}</span>
            <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
          </div>
          <span>R$ {(Number(item.preco) * item.quantity).toFixed(2).replace('.',',')}</span>
          <button onClick={() => removeFromCart(item.id)} className="remove-button">×</button>
        </div>
      ))}
      <div className="cart-total">
        <strong>Total: R$ {total.toFixed(2).replace('.',',')}</strong>
      </div>
    </div>
  );
}

export default Cart;