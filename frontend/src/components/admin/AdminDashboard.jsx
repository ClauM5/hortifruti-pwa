// Arquivo: frontend/src/components/admin/AdminDashboard.jsx (Com Filtros)

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './AdminDashboard.css';

const API_BASE_URL = 'https://hortifruti-backend.onrender.com/api';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('hoje'); // << Estado para controlar o filtro

  const adminToken = sessionStorage.getItem('admin_password');

  const fetchStats = useCallback(async () => {
    if (!adminToken) {
      setError("Sessão de admin não encontrada. Faça o login novamente.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      // Adiciona o parâmetro 'range' na URL da API
      const response = await fetch(`${API_BASE_URL}/admin/stats?range=${timeRange}`, {
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
  }, [adminToken, timeRange]); // << Roda a busca sempre que o timeRange mudar

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
      <div className="dashboard-header">
        <div>
          <h2>Dashboard</h2>
          <p>Uma visão geral do seu negócio.</p>
        </div>
        {/* >> NOVOS BOTÕES DE FILTRO << */}
        <div className="dashboard-filters">
          <button onClick={() => setTimeRange('hoje')} className={timeRange === 'hoje' ? 'active' : ''}>Hoje</button>
          <button onClick={() => setTimeRange('semana')} className={timeRange === 'semana' ? 'active' : ''}>Esta Semana</button>
          <button onClick={() => setTimeRange('mes')} className={timeRange === 'mes' ? 'active' : ''}>Este Mês</button>
          <button onClick={() => setTimeRange('ano')} className={timeRange === 'ano' ? 'active' : ''}>Este Ano</button>
          <button onClick={() => setTimeRange('total')} className={timeRange === 'total' ? 'active' : ''}>Total</button>
        </div>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h4>Receita (Entregue)</h4>
          <p>R$ {Number(stats.receitaTotal).toFixed(2).replace('.', ',')}</p>
        </div>
        <div className="stat-card">
          <h4>Pedidos no Período</h4>
          <p>{stats.totalPedidos}</p>
        </div>
        <div className="stat-card">
          <h4>Pedidos Pendentes</h4>
          <p>{stats.pedidosPendentes}</p>
        </div>
      </div>

      <div className="recent-orders">
        <h3>Últimos 5 Pedidos (Geral)</h3>
        <div className="order-list-header">
          <span>ID</span>
          <span>Cliente</span>
          <span>Total</span>
          <span>Status</span>
        </div>
        {stats.ultimosPedidos.map(pedido => (
          <Link to={`/admin/pedidos`} key={pedido.id} className="recent-order-item">
            <span>#{pedido.id}</span>
            <span>{pedido.nome_cliente}</span>
            <span>R$ {Number(pedido.valor_total).toFixed(2).replace('.', ',')}</span>
            <span><span className={`status status-${pedido.status.toLowerCase().replace(/\s+/g, '-')}`}>{pedido.status}</span></span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default AdminDashboard;