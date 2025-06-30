// Arquivo: frontend/src/pages/CheckoutPage.jsx (Final com Lógica de Cupom)

import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './CheckoutPage.css';

const API_BASE_URL = 'https://hortifruti-backend.onrender.com/api';

function CheckoutPage() {
  const { cartItems, clearCart } = useCart();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  // Estados do formulário e do pedido
  const [deliveryMethod, setDeliveryMethod] = useState('delivery');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cartão na Entrega'); // Alterado para um valor padrão
  const [troco, setTroco] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');

  // << NOVOS ESTADOS PARA CUPOM >>
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');

  const total = cartItems.reduce((sum, item) => sum + Number(item.preco) * item.quantity, 0);
  const finalTotal = total - discount; // << NOVO TOTAL FINAL

  useEffect(() => { if (user) setCustomerName(user.nome); }, [user]);
  useEffect(() => { if (!token) return; const fetchAddresses = async () => { try { const res = await fetch(`${API_BASE_URL}/enderecos`, { headers: { 'Authorization': `Bearer ${token}` } }); setSavedAddresses(await res.json()); } catch (err) { console.error("Falha ao buscar endereços", err); } }; fetchAddresses(); }, [token]);
  useEffect(() => { if (deliveryMethod === 'pickup') { setCustomerAddress('Retirada na Loja'); } else { setCustomerAddress(''); setSelectedAddressId(''); } }, [deliveryMethod]);
  
  const handleAddressSelect = (addressId) => { setSelectedAddressId(addressId); if (addressId === "") { setCustomerAddress(""); return; } const selectedAddr = savedAddresses.find(addr => addr.id === parseInt(addressId)); if (selectedAddr) { const fullAddress = `${selectedAddr.logradouro}, ${selectedAddr.numero}${selectedAddr.complemento ? ` - ${selectedAddr.complemento}` : ''}, ${selectedAddr.bairro}, ${selectedAddr.cidade} - ${selectedAddr.estado}, CEP: ${selectedAddr.cep}`; setCustomerAddress(fullAddress); } };
  
  // << NOVA FUNÇÃO PARA APLICAR O CUPOM >>
  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setCouponMessage('');
    try {
        const response = await fetch(`${API_BASE_URL}/cupons/validar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codigo: couponCode })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        
        // Calcula o desconto no frontend para feedback visual
        let discountValue = 0;
        if (data.cupom.tipo_desconto === 'PERCENTUAL') {
            discountValue = (total * data.cupom.valor) / 100;
        } else { // FIXO
            discountValue = data.cupom.valor;
        }

        setDiscount(discountValue);
        setAppliedCoupon(data.cupom);
        setCouponMessage('Cupom aplicado com sucesso!');

    } catch(err) {
        setDiscount(0);
        setAppliedCoupon(null);
        setCouponMessage(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim() || !customerAddress.trim()) { setError('Por favor, preencha seu nome e endereço.'); return; }
    
    setIsSubmitting(true);
    setError('');

    const orderData = {
      nome_cliente: customerName,
      endereco_cliente: customerAddress,
      itens: cartItems,
      metodo_pagamento: paymentMethod,
      troco_para: paymentMethod === 'Dinheiro' ? troco : null,
      token: token,
      codigo_cupom: appliedCoupon ? appliedCoupon.codigo : null, // Envia o código do cupom
    };

    try {
      const response = await fetch(`${API_BASE_URL}/pedidos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderData) });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Falha ao criar o pedido.');
      }
      alert('Pedido realizado com sucesso!');
      clearCart();
      navigate('/minha-conta');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="checkout-container">
      <h2>Finalizar Compra</h2>
      <div className="checkout-content">
        <div className="order-summary">
          <h3>Resumo do Pedido</h3>
          {cartItems.map(item => ( <div key={item.id} className="summary-item"> <span>{item.quantity}x {item.nome}</span> <span>R$ {(item.preco * item.quantity).toFixed(2).replace('.', ',')}</span> </div> ))}
          <div className="summary-row"> <span>Subtotal:</span> <span>R$ {total.toFixed(2).replace('.', ',')}</span> </div>
          {discount > 0 && ( <div className="summary-row discount"> <span>Desconto:</span> <span>- R$ {discount.toFixed(2).replace('.', ',')}</span> </div> )}
          <div className="summary-total"> <strong>Total:</strong> <strong>R$ {finalTotal.toFixed(2).replace('.', ',')}</strong> </div>
        </div>

        <form onSubmit={handleSubmit} className="checkout-form">
          <h3>Detalhes do Pedido</h3>
          <div className="delivery-method-selector">
             <label><input type="radio" name="deliveryMethod" value="delivery" checked={deliveryMethod === 'delivery'} onChange={(e) => setDeliveryMethod(e.target.value)} /> Delivery</label>
             <label><input type="radio" name="deliveryMethod" value="pickup" checked={deliveryMethod === 'pickup'} onChange={(e) => setDeliveryMethod(e.target.value)} /> Retirar na Loja</label>
          </div>
          <label htmlFor="customerName">Seu Nome</label>
          <input type="text" id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
          {deliveryMethod === 'delivery' ? ( <> {user && savedAddresses.length > 0 && ( <> <label htmlFor="savedAddress">Selecionar Endereço Salvo</label> <select id="savedAddress" value={selectedAddressId} onChange={(e) => handleAddressSelect(e.target.value)}> <option value="">-- Digitar um novo endereço --</option> {savedAddresses.map(addr => (<option key={addr.id} value={addr.id}>{addr.nome_identificador}</option>))} </select> </> )} <label htmlFor="customerAddress">Endereço Completo</label> <textarea id="customerAddress" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} rows="4" required /> </> ) : ( <div className="pickup-info"> <p>Você poderá retirar seu pedido em nosso endereço.</p> </div> )}
          
          {/* >> CAMPO DE CUPOM << */}
          <label htmlFor="couponCode">Cupom de Desconto</label>
          <div className="coupon-input-group">
            <input type="text" id="couponCode" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Digite seu cupom" />
            <button type="button" onClick={handleApplyCoupon}>Aplicar</button>
          </div>
          {couponMessage && <p className={`coupon-message ${appliedCoupon ? 'success' : 'error'}`}>{couponMessage}</p>}


          <label htmlFor="paymentMethod">Forma de Pagamento</label>
          <select id="paymentMethod" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="Cartão de Crédito">Cartão de Crédito (na entrega)</option>
            <option value="Cartão de Débito">Cartão de Débito (na entrega)</option>
            <option value="Pix">Pix</option>
            <option value="Dinheiro">Dinheiro</option>
          </select>
          {paymentMethod === 'Dinheiro' && ( <> <label htmlFor="troco">Troco para quanto?</label> <input type="number" id="troco" value={troco} onChange={(e) => setTroco(e.target.value)} placeholder="Ex: 50.00" /> </> )}

          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="primary-button" disabled={isSubmitting || cartItems.length === 0}>{isSubmitting ? 'Enviando...' : 'Confirmar Pedido'}</button>
        </form>
      </div>
    </div>
  );
}

export default CheckoutPage;