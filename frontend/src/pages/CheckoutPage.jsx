// Arquivo: frontend/src/pages/CheckoutPage.jsx (Com Endereços Salvos)

import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './CheckoutPage.css';

const API_PEDIDOS_URL = 'https://hortifruti-backend.onrender.com/api/pedidos';
const API_ENDERECOS_URL = 'https://hortifruti-backend.onrender.com/api/enderecos';

function CheckoutPage() {
  const { cartItems, clearCart } = useCart();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cartão de Crédito');
  const [troco, setTroco] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // << NOVOS ESTADOS PARA ENDEREÇOS >>
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');

  // Busca o nome do usuário logado
  useEffect(() => {
    if (user) {
      setCustomerName(user.nome);
    }
  }, [user]);

  // Busca os endereços salvos do usuário
  useEffect(() => {
    if (!token) return;
    const fetchAddresses = async () => {
      try {
        const response = await fetch(API_ENDERECOS_URL, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setSavedAddresses(data);
      } catch (err) {
        console.error("Falha ao buscar endereços", err);
      }
    };
    fetchAddresses();
  }, [token]);

  // << NOVA FUNÇÃO: Preenche o formulário quando um endereço é selecionado >>
  const handleAddressSelect = (addressId) => {
    setSelectedAddressId(addressId);
    if (addressId === "") {
        setCustomerAddress(""); // Limpa o campo se "Digitar novo" for selecionado
        return;
    }
    const selectedAddr = savedAddresses.find(addr => addr.id === parseInt(addressId));
    if (selectedAddr) {
      const fullAddress = `${selectedAddr.logradouro}, ${selectedAddr.numero}${selectedAddr.complemento ? ` - ${selectedAddr.complemento}` : ''}, ${selectedAddr.bairro}, ${selectedAddr.cidade} - ${selectedAddr.estado}, CEP: ${selectedAddr.cep}`;
      setCustomerAddress(fullAddress);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      setError('Seu carrinho está vazio.');
      return;
    }
    if (paymentMethod === 'Dinheiro' && !troco) {
        setError('Por favor, informe para quanto precisa de troco.');
        return;
    }

    setIsSubmitting(true);
    setError('');

    const orderData = {
      nome_cliente: customerName,
      endereco_cliente: customerAddress,
      itens: cartItems,
      metodo_pagamento: paymentMethod,
      troco_para: paymentMethod === 'Dinheiro' ? troco : null,
      token: token,
    };

    try {
      const response = await fetch(API_PEDIDOS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      if (!response.ok) throw new Error('Falha ao criar o pedido.');
      
      alert('Pedido realizado com sucesso!');
      clearCart();
      navigate('/minha-conta');

    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const total = cartItems.reduce((sum, item) => sum + Number(item.preco) * item.quantity, 0);

  return (
    <div className="checkout-container">
      <h2>Finalizar Compra</h2>
      <div className="checkout-content">
        <div className="order-summary">
          <h3>Resumo do Pedido</h3>
          {cartItems.map(item => (
            <div key={item.id} className="summary-item">
              <span>{item.quantity}x {item.nome}</span>
              <span>R$ {(item.preco * item.quantity).toFixed(2).replace('.', ',')}</span>
            </div>
          ))}
          <div className="summary-total">
            <strong>Total: R$ {total.toFixed(2).replace('.', ',')}</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="checkout-form">
          <h3>Detalhes da Entrega e Pagamento</h3>
          
          <label htmlFor="customerName">Seu Nome</label>
          <input type="text" id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />

          {/* << NOVO SELETOR DE ENDEREÇOS >> */}
          {user && savedAddresses.length > 0 && (
            <>
              <label htmlFor="savedAddress">Selecionar Endereço Salvo</label>
              <select id="savedAddress" value={selectedAddressId} onChange={(e) => handleAddressSelect(e.target.value)}>
                <option value="">-- Digitar um novo endereço --</option>
                {savedAddresses.map(addr => (
                  <option key={addr.id} value={addr.id}>{addr.nome_identificador}</option>
                ))}
              </select>
            </>
          )}

          <label htmlFor="customerAddress">Endereço Completo</label>
          <textarea id="customerAddress" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} rows="4" required />
          
          <label htmlFor="paymentMethod">Forma de Pagamento</label>
          <select id="paymentMethod" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option>Cartão de Crédito</option>
            <option>Cartão de Débito</option>
            <option>PIX</option>
            <option>Dinheiro</option>
          </select>

          {paymentMethod === 'Dinheiro' && (
            <>
              <label htmlFor="troco">Troco para quanto?</label>
              <input type="number" id="troco" value={troco} onChange={(e) => setTroco(e.target.value)} placeholder="Ex: 50" />
            </>
          )}

          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando Pedido...' : 'Finalizar Pedido'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CheckoutPage;