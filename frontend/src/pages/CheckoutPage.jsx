// Arquivo: frontend/src/pages/CheckoutPage.jsx (Versão 100% Completa e Corrigida)

import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import './CheckoutPage.css';

const API_PEDIDOS_URL = 'https://hortifruti-backend.onrender.com/api/pedidos';
const SUA_CHAVE_PIX = "sua-chave-pix-aqui"; // Lembre-se de colocar sua chave real aqui

function CheckoutPage() {
  const { cartItems, clearCart } = useCart();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    nome_cliente: '',
    endereco_cliente: '',
  });

  const [metodoPagamento, setMetodoPagamento] = useState('');
  const [trocoPara, setTrocoPara] = useState('');
  
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
    setError('');

    if (!formData.nome_cliente.trim() || !formData.endereco_cliente.trim()) {
      setError('Por favor, preencha seu nome e endereço.');
      return;
    }
    if (!metodoPagamento) {
      setError('Por favor, selecione uma forma de pagamento.');
      return;
    }

    setIsLoading(true);
    
    const pedido = {
      ...formData,
      itens: cartItems,
      metodo_pagamento: metodoPagamento,
      troco_para: metodoPagamento === 'Dinheiro' ? trocoPara : null,
    };

    try {
      const response = await fetch(API_PEDIDOS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pedido),
      });
      if (!response.ok) {
        throw new Error('Houve um problema ao finalizar seu pedido. Verifique os dados e tente novamente.');
      }
      const result = await response.json();
      setPedidoSucesso(result.pedidoId);
      clearCart();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if(pedidoSucesso) {
      const timer = setTimeout(() => navigate('/'), 5000);
      return () => clearTimeout(timer);
    }
  }, [pedidoSucesso, navigate]);
  
  if (pedidoSucesso) {
    return (
      <div className="checkout-container success-message">
        <h2>Obrigado pelo seu pedido!</h2>
        <p>Seu pedido nº <strong>{pedidoSucesso}</strong> foi recebido com sucesso.</p>
        {metodoPagamento === 'Pix' && (
          <div className="pix-info">
            <h4>Pague com nossa chave Pix:</h4>
            <p className="pix-key">{SUA_CHAVE_PIX}</p>
            <p>Por favor, envie o comprovante para nosso WhatsApp.</p>
          </div>
        )}
        <p>Você será redirecionado para a loja em 5 segundos.</p>
        <button onClick={() => navigate('/')} className="primary-button">Voltar para a Loja Agora</button>
      </div>
    );
  }

  // A PARTE ABAIXO ESTAVA FALTANDO NO CÓDIGO ANTERIOR
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
        <input type="text" id="nome_cliente" name="nome_cliente" value={formData.nome_cliente} onChange={handleInputChange} required/>
        
        <label htmlFor="endereco_cliente">Endereço de Entrega</label>
        <textarea id="endereco_cliente" name="endereco_cliente" value={formData.endereco_cliente} onChange={handleInputChange} required rows="4"/>

        <h3>Forma de Pagamento</h3>
        <div className="payment-options">
          <label><input type="radio" name="payment" value="Cartão na Entrega" onChange={(e) => setMetodoPagamento(e.target.value)} /> Cartão na Entrega</label>
          <label><input type="radio" name="payment" value="Pix" onChange={(e) => setMetodoPagamento(e.target.value)} /> Pix</label>
          <label><input type="radio" name="payment" value="Dinheiro" onChange={(e) => setMetodoPagamento(e.target.value)} /> Dinheiro</label>
        </div>
        
        {metodoPagamento === 'Dinheiro' && (
          <div className="troco-info">
            <label htmlFor="troco_para">Troco para quanto?</label>
            <input type="number" id="troco_para" value={trocoPara} onChange={(e) => setTrocoPara(e.target.value)} placeholder="Ex: 50.00" />
          </div>
        )}

        {error && <p className="error-message">{error}</p>}
        <button type="submit" disabled={isLoading || cartItems.length === 0} className="primary-button">{isLoading ? 'Enviando...' : 'Confirmar Pedido'}</button>
      </form>
    </div>
  );
}

export default CheckoutPage;