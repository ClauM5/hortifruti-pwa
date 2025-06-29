// Arquivo: frontend/src/layouts/MainLayout.jsx

import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Cart from '../components/Cart';

// Este é o nosso "molde" de página
function MainLayout() {
  return (
    <div>
      <Navbar />
      <Cart /> {/* Mantemos o carrinho flutuante aqui também */}
      <main>
        {/* O <Outlet /> é o espaço reservado onde o React Router irá
            renderizar o conteúdo da página atual (Home, Login, etc.) */}
        <Outlet />
      </main>
      {/* No futuro, poderíamos adicionar um <Footer /> aqui */}
    </div>
  );
}

export default MainLayout;