// Arquivo: frontend/src/components/admin/AdminDashboard.jsx (Com Filtro de Data Customizado)

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './AdminDashboard.css';

const API_BASE_URL = 'https://hortifruti-backend.onrender.com/api';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // << NOVOS ESTADOS PARA O FILTRO DE DATA >>
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const adminToken = sessionStorage.getItem('admin_password');

  const fetchStats = useCallback(async (start, end) => {
    if (!adminToken) {
      setError("Sessão de admin não encontrada. Faça o login novamente.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    
    // Constrói a URL com as datas, se elas existirem
    let url = `${API_BASE_URL}/admin/stats`;
    if (start && end) {
      url += `?startDate=${start}&endDate=${end}`;
    }

    try {
      const response = await fetch(url, {
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

  // Busca os dados totais na primeira vez que a página carrega
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Função chamada pelo botão "Filtrar"
  const handleFilter = () => {
    if (startDate && endDate) {
      fetchStats(startDate, endDate);
    } else {
      // Se as datas não estiverem completas, busca o total
      fetchStats();
    }
  };
  
  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    fetchStats(); // Volta a buscar o total geral
  }

  return (
    <div className="admin-section-container">
      <div className="dashboard-header">
        <div>
          <h2>Dashboard</h2>
          <p>Uma visão geral do seu negócio.</p>
        </div>
        
        {/* >> NOVOS FILTROS DE DATA << */}
        <div className="dashboard-filters">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <span>até</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <button onClick={handleFilter} className="filter-button">Filtrar</button>
          <button onClick={clearFilters} className="clear-button-dash">Limpar</button>
        </div>
      </div>
      
      {isLoading && <p>Carregando...</p>}
      {error && <p className="error-message">{error}</p>}
      
      {stats && (
        <>
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
        </>
      )}
    </div>
  );
}

export default AdminDashboard;