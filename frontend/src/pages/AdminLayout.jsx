// Arquivo: frontend/src/pages/AdminLayout.jsx

import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './AdminLayout.css';

function AdminLayout() {
  const handleLogout = () => {
    // Para simplificar, vamos apenas redirecionar por enquanto.
    // A lógica de logout real pode ser mais complexa se envolver tokens.
    window.location.href = '/admin';
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