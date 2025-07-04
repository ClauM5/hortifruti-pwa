// Arquivo: frontend/src/components/admin/AdminPedidos.jsx (Corrigido)

import React, { useState, useEffect, useCallback } from 'react';
import './AdminPedidos.css';

const API_BASE_URL = 'https://hortifruti-backend.onrender.com/api';

function AdminPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [pedidoExpandido, setPedidoExpandido] = useState(null);

  // CORREÇÃO: Pegare a senha do sessionStorage
  const adminToken = sessionStorage.getItem('admin_password');

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const headers = { 'authorization': adminToken };
      const [pedidosRes, produtosRes] = await Promise.all([
        fetch(`${API_BASE_URL}/pedidos`, { headers }),
        fetch(`${API_BASE_URL}/produtos`)
      ]);
      if (!pedidosRes.ok) throw new Error('Falha ao buscar pedidos. Sua sessão de admin pode ter expirado. Faça o login novamente.');
      if (!produtosRes.ok) throw new Error('Falha ao buscar produtos.');
      
      const pedidosData = await pedidosRes.json();
      const produtosData = await produtosRes.json();
      setPedidos(pedidosData);
      setProdutos(produtosData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    fetchInitialData();
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
      
      setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, status: novoStatus } : p));
    } catch (err) {
      setError(err.message);
    }
  };

  const getProductNameById = (id) => {
    const product = produtos.find(p => p.id === id);
    return product ? product.nome : `Produto ID ${id}`;
  };

  const handleToggleExpand = (pedidoId) => {
    setPedidoExpandido(pedidoExpandido === pedidoId ? null : pedidoId);
  };

  return (
    <div className="admin-section-container">
      <h2>Gerenciar Pedidos</h2>
      <p>Acompanhe e atualize o status dos pedidos recebidos.</p>
      
      {error && <p className="error-message">{error}</p>}
      
      <div className="pedidos-list">
        {isLoading ? <p>Carregando pedidos...</p> : pedidos.length > 0 ? (
          pedidos.map((pedido) => (
            <div key={pedido.id} className="pedido-card">
              <div className="pedido-card-header" onClick={() => handleToggleExpand(pedido.id)}>
                <div className="pedido-info">
                  <strong>Pedido #{pedido.id}</strong>
                  <span>{pedido.nome_cliente}</span>
                  <span>{new Date(pedido.data_pedido).toLocaleString('pt-BR')}</span>
                </div>
                <div className="pedido-info-right">
                    <span className={`status status-${pedido.status.toLowerCase().replace(/\s+/g, '-')}`}>{pedido.status}</span>
                    <strong>R$ {Number(pedido.valor_total).toFixed(2).replace('.', ',')}</strong>
                </div>
              </div>
              {pedidoExpandido === pedido.id && (
                <div className="pedido-card-body">
                  <div className="pedido-details-grid">
                    <div>
                        <h4>Itens do Pedido:</h4>
                        <ul>
                            {pedido.itens?.map(item => (
                                <li key={item.id}>
                                    {item.quantidade}x {item.produto_nome}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h4>Detalhes da Entrega:</h4>
                        <p><strong>Endereço:</strong> {pedido.endereco_cliente}</p>
                        <p><strong>Pagamento:</strong> {pedido.metodo_pagamento}</p>
                        {pedido.troco_para && <p><strong>Troco para:</strong> R$ {Number(pedido.troco_para).toFixed(2).replace('.', ',')}</p>}
                    </div>
                  </div>
                </div>
              )}
              <div className="pedido-card-footer-admin">
                  <div className="order-status-control">
                      <label>Mudar Status:</label>
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
          ))
        ) : (
          <p>Nenhum pedido encontrado.</p>
        )}
      </div>
    </div>
  );
}

export default AdminPedidos;