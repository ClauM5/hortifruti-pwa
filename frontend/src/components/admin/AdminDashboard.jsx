// Arquivo: frontend/src/components/admin/AdminDashboard.jsx (Corrigido)

import React, { useState, useEffect, useCallback } from 'react';
import './AdminDashboard.css';

const API_BASE_URL = 'https://hortifruti-backend.onrender.com/api';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const adminToken = sessionStorage.getItem('admin_password');

  const fetchStats = useCallback(async () => {
    if (!adminToken) {
      setError("Sessão de admin não encontrada. Faça o login novamente.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: { 'Authorization': adminToken }
      });
      if (!response.ok) throw new Error('Falha ao buscar estatísticas.');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (isLoading) {
    return <div className="admin-section-container"><p>Carregando dashboard...</p></div>;
  }

  if (error) {
    return <div className="admin-section-container"><p className="error-message">{error}</p></div>;
  }

  if (!stats) {
    return <div className="admin-section-container"><p>Não foi possível carregar os dados.</p></div>;
  }

  return (
    <div className="admin-section-container">
      <h2>Dashboard</h2>
      <p>Uma visão geral e em tempo real do seu negócio.</p>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h4>Receita Total (Entregue)</h4>
          <p>R$ {Number(stats.receitatotal).toFixed(2).replace('.', ',')}</p>
        </div>
        <div className="stat-card">
          <h4>Total de Pedidos</h4>
          <p>{stats.totalpedidos}</p>
        </div>
        <div className="stat-card">
          <h4>Pedidos Pendentes</h4>
          <p>{stats.pedidospendentes}</p>
        </div>
      </div>

      <div className="recent-orders">
        <h3>Últimos Pedidos</h3>
        <div className="order-list-header">
          <span>ID</span>
          <span>Cliente</span>
          <span>Total</span>
          <span>Status</span>
        </div>
        
        {/* CORREÇÃO APLICADA AQUI: de 'ultimospedidos' para 'ultimosPedidos' */}
        {stats.ultimosPedidos && stats.ultimosPedidos.map(pedido => (
          <div key={pedido.id} className="recent-order-item">
            <span>#{pedido.id}</span>
            <span>{pedido.nome_cliente}</span>
            <span>R$ {Number(pedido.valor_total).toFixed(2).replace('.', ',')}</span>
            <span><span className={`status status-${pedido.status.toLowerCase().replace(/\s+/g, '-')}`}>{pedido.status}</span></span>
          </div>
        ))}

      </div>
    </div>
  );
}

export default AdminDashboard;