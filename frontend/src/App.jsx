// Arquivo: frontend/src/App.jsx (Versão Final com Layout)

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Importando o nosso novo "molde" de página
import MainLayout from './layouts/MainLayout'; 

// Importando as páginas
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import CheckoutPage from './pages/CheckoutPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import AccountPage from './pages/AccountPage';

// Importando os Providers
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>
            {/* Todas as rotas aqui dentro usarão o MainLayout como "molde" */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<HomePage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="minha-conta" element={<AccountPage />} />
            </Route>

            {/* A rota do Admin continua separada, pois não usa o mesmo menu de navegação */}
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;