// Arquivo: frontend/src/App.jsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './pages/AdminLayout';
import HomePage from './pages/HomePage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AccountPage from './pages/AccountPage';
import OrderDetailPage from './pages/OrderDetailPage';
import FavoritesPage from './pages/FavoritesPage';
import CartPage from './pages/CartPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AddressPage from './pages/AddressPage';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import './App.css';

// Componentes Reais do Admin
import AdminDashboard from './components/admin/AdminDashboard'; // << USA O COMPONENTE REAL
import AdminCategorias from './components/admin/AdminCategorias';
import AdminProdutos from './components/admin/AdminProdutos';
import AdminPedidos from './components/admin/AdminPedidos';

// Placeholders
const AdminBanners = () => <div className="admin-section-container"><h2>Gerenciar Banners</h2><p>Em breve...</p></div>;
const AdminCupons = () => <div className="admin-section-container"><h2>Gerenciar Cupons</h2><p>Em breve...</p></div>;

const ProtectedAdminRoute = ({ children }) => {
  const isAdminLoggedIn = sessionStorage.getItem('admin_password');
  return isAdminLoggedIn === '102030' ? children : <Navigate to="/admin/login" replace />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<HomePage />} />
              <Route path="carrinho" element={<CartPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="minha-conta" element={<AccountPage />} />
              <Route path="meus-favoritos" element={<FavoritesPage />} />
              <Route path="meus-enderecos" element={<AddressPage />} />
              <Route path="pedido/:id" element={<OrderDetailPage />} />
            </Route>
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<ProtectedAdminRoute><AdminLayout /></ProtectedAdminRoute>}>
              <Route index element={<Navigate to="dashboard" replace />} /> 
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="pedidos" element={<AdminPedidos />} />
              <Route path="produtos" element={<AdminProdutos />} />
              <Route path="categorias" element={<AdminCategorias />} />
              <Route path="banners" element={<AdminBanners />} />
              <Route path="cupons" element={<AdminCupons />} />
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;