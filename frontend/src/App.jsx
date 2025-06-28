// Arquivo: frontend/src/App.jsx (Versão Final com CartProvider)

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import { CartProvider } from './context/CartContext';

function App() {
  return (
    // O CartProvider abraça o Router para que todas as rotas/páginas
    // tenham acesso ao estado do carrinho de compras.
    <CartProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </Router>
    </CartProvider>
  );
}

export default App;