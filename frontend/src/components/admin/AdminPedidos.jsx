// Arquivo: frontend/src/components/admin/AdminPedidos.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import './AdminPedidos.css';

const API_BASE_URL = 'https://hortifruti-backend.onrender.com/api';
const WS_URL = 'wss://hortifruti-backend.onrender.com';

function AdminPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [produtos, setProdutos] = useState([]); // Precisamos dos produtos para pegar os nomes
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const notificationSound = useRef(null);
  const adminToken = '102030';

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const headers = { 'authorization': adminToken };
      const [pedidosRes, produtosRes] = await Promise.all([
        fetch(`${API_BASE_URL}/pedidos`, { headers }),
        fetch(`${API_BASE_URL}/produtos`)
      ]);
      if (!pedidosRes.ok || !produtosRes.ok) throw new Error('Falha ao carregar dados iniciais');
      
      const pedidosData = await pedidosRes.json();
      const produtosData = await produtosRes.json();
      setPedidos(pedidosData);
      setProdutos(produtosData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();

    // Configuração do WebSocket para notificações de novos pedidos
    notificationSound.current = new Audio('/notification.mp3');
    const ws = new WebSocket(WS_URL);
    ws.onopen = () => console.log('Admin conectado ao WebSocket para pedidos.');
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'NOVO_PEDIDO') {
        notificationSound.current.play().catch(e => console.error("Erro ao tocar som:", e));
        // Adiciona o novo pedido no topo da lista
        setPedidos(prevPedidos => [message.payload, ...prevPedidos]);
        document.title = ">> NOVO PEDIDO! <<";
        setTimeout(() => { document.title = "Painel de Admin"; }, 5000);
      }
    };
    ws.onclose = () => console.log('Admin desconectado do WebSocket.');
    ws.onerror = (error) => setError('Erro na conexão em tempo real.');

    return () => ws.close();
  }, [fetchInitialData]);

  const handleStatusChange = async (pedidoId, novoStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/pedidos/${pedidoId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'authorization': adminToken
        },
        body: JSON.stringify({ status: novoStatus })
      });
      if (!response.ok) throw new Error('Falha ao atualizar status.');
      
      // Atualiza o estado localmente para feedback imediato
      setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, status: novoStatus } : p));
    } catch (err) {
      setError(err.message);
    }
  };

  const getProductNameById = (id) => {
    const product = produtos.find(p => p.id === id);
    return product ? product.nome : `Produto ID ${id}`;
  };

  return (
    <div className="admin-section-container">
      <h2>Gerenciar Pedidos</h2>
      <p>Acompanhe e atualize o status dos pedidos recebidos.</p>
      
      {error && <p className="error-message">{error}</p>}
      
      <div className="order-list-admin">
        {isLoading ? <p>Carregando pedidos...</p> : pedidos.length > 0 ? pedidos.map(pedido => (
          <div key={pedido.id} className="order-card-admin">
            <div className="order-card-header">
              <h4>Pedido #{pedido.id}</h4>
              <span>{new Date(pedido.data_pedido).toLocaleString('pt-BR')}</span>
            </div>
            <div className="order-card-body">
              <p><strong>Cliente:</strong> {pedido.nome_cliente}</p>
              <p><strong>Endereço:</strong> {pedido.endereco_cliente}</p>
              <p><strong>Pagamento:</strong> {pedido.metodo_pagamento} {pedido.troco_para ? `(Troco p/ R$ ${Number(pedido.troco_para).toFixed(2)})` : ''}</p>
              <p><strong>Itens:</strong></p>
              <ul className="item-list-admin">
                {pedido.itens?.map(item => (
                  <li key={item.id}>{item.quantidade}x {getProductNameById(item.produto_id)}</li>
                ))}
              </ul>
            </div>
            <div className="order-card-footer-admin">
              <span className="order-total-admin">Total: R$ {Number(pedido.valor_total).toFixed(2)}</span>
              <div className="order-status-control">
                <label>Status:</label>
                <select value={pedido.status} onChange={(e) => handleStatusChange(pedido.id, e.target.value)}>
                  <option value="Recebido">Recebido</option>
                  <option value="Em Preparo">Em Preparo</option>
                  <option value="Pronto para retirada">Pronto para retirada</option>
                  <option value="Saiu para Entrega">Saiu para Entrega</option>
                  <option value="Entregue">Entregue</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>
            </div>
          </div>
        )) : <p>Nenhum pedido recebido ainda.</p>}
      </div>
    </div>
  );
}

export default AdminPedidos;