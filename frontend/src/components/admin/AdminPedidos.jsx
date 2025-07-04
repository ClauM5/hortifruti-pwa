// Arquivo: frontend/src/components/admin/AdminPedidos.jsx

import React, { useState, useEffect } from 'react';
import './AdminPedidos.css'; // Criaremos este arquivo de estilo a seguir

const API_BASE_URL = 'https://hortifruti-backend.onrender.com/api';

function AdminPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [pedidoExpandido, setPedidoExpandido] = useState(null);

  const fetchPedidos = async () => {
    setError('');
    try {
      const adminPassword = sessionStorage.getItem('admin_password');
      const response = await fetch(`${API_BASE_URL}/pedidos`, {
        headers: {
          'Authorization': adminPassword,
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao buscar pedidos. Verifique a senha de admin.');
      }
      const data = await response.json();
      setPedidos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPedidos();
  }, []);

  const handleToggleExpand = (pedidoId) => {
    setPedidoExpandido(pedidoExpandido === pedidoId ? null : pedidoId);
  };

  if (isLoading) {
    return <div className="admin-pedidos-container"><h2>Gerenciar Pedidos</h2><p>Carregando pedidos...</p></div>;
  }

  if (error) {
    return <div className="admin-pedidos-container"><h2>Gerenciar Pedidos</h2><p className="error-message">{error}</p></div>;
  }

  return (
    <div className="admin-pedidos-container">
      <h2>Gerenciar Pedidos</h2>
      <div className="pedidos-list">
        {pedidos.length > 0 ? (
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
                            {pedido.itens.map(item => (
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