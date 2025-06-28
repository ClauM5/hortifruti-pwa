// Arquivo: frontend/src/App.jsx (Atualizado com o CartProvider)

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import { CartProvider } from './context/CartContext'; // <-- 1. Importe o provider

function App() {
  return (
    <CartProvider> {/* <-- 2. Envolva tudo com ele */}
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