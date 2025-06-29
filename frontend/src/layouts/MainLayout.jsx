// Arquivo: frontend/src/layouts/MainLayout.jsx (Versão Final Refinada)

import React from 'react';
// 1. Importa o Outlet para renderizar as páginas e o useLocation para saber a URL atual
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Cart from '../components/Cart';
import './MainLayout.css'; // Vamos criar este novo arquivo de estilo

function MainLayout() {
  // 2. Pega a informação da localização (URL) atual
  const location = useLocation();

  // 3. Define em quais páginas o carrinho flutuante NÃO deve aparecer
  const hideCartOnPaths = ['/checkout', '/login', '/register', '/minha-conta'];
  const shouldShowCart = !hideCartOnPaths.includes(location.pathname);

  return (
    <div className="app-container">
      <Navbar />
      
      {/* 4. Renderiza o carrinho somente se shouldShowCart for verdadeiro */}
      {shouldShowCart && <Cart />}

      {/* 5. Adiciona uma div "page-content" para centralizar e dar espaçamento */}
      <main className="page-content">
        <Outlet />
      </main>
      
      {/* No futuro, poderíamos adicionar um <Footer /> aqui */}
    </div>
  );
}

export default MainLayout;