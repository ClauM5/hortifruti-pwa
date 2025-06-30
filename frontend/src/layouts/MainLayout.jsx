// Arquivo: frontend/src/layouts/MainLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom'; // Removemos o useLocation
import Navbar from '../components/Navbar';
import './MainLayout.css';

function MainLayout() {
  return (
    <div className="app-container">
      <Navbar />
      <main className="page-content">
        <Outlet />
      </main>
    </div>
  );
}
export default MainLayout;