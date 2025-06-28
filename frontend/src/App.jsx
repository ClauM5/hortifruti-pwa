// Arquivo: frontend/src/App.jsx (Final com rota de Checkout)

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import CheckoutPage from './pages/CheckoutPage'; // 1. Importe a nova página
import { CartProvider } from './context/CartContext';

function App() {
  return (
    <CartProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/checkout" element={<CheckoutPage />} /> {/* 2. Adicione a nova rota */}
        </Routes>
      </Router>
    </CartProvider>
  );
}

export default App;