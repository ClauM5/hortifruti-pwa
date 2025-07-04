// Arquivo: frontend/src/pages/AdminLayout.jsx (Logout Corrigido)

import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import './AdminLayout.css';

function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Apaga a chave da memória do navegador que diz que o admin está logado
    sessionStorage.removeItem('admin_password');
    // Redireciona de volta para a página de login
    navigate('/admin/login');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h1 className="admin-logo">Hortifruti</h1>
        <nav className="admin-nav">
          <NavLink to="/admin/dashboard">Dashboard</NavLink>
          <NavLink to="/admin/pedidos">Pedidos</NavLink>
          <NavLink to="/admin/produtos">Produtos</NavLink>
          <NavLink to="/admin/categorias">Categorias</NavLink>
          <NavLink to="/admin/banners">Banners</NavLink>
          <NavLink to="/admin/cupons">Cupons</NavLink>
        </nav>
        <button onClick={handleLogout} className="admin-logout-button">
          Sair
        </button>
      </aside>
      <main className="admin-main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;