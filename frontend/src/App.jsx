// Arquivo: frontend/src/App.jsx (Com Roteamento de Admin Corrigido)

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Importando os Layouts
import MainLayout from './layouts/MainLayout';
import AdminLayout from './pages/AdminLayout'; // O layout do painel com menu

// Importando as Páginas
import HomePage from './pages/HomePage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AccountPage from './pages/AccountPage';
import OrderDetailPage from './pages/OrderDetailPage';
import FavoritesPage from './pages/FavoritesPage';
import CartPage from './pages/CartPage';
import AdminLoginPage from './pages/AdminLoginPage'; // A nova página de login

// Importando os Provedores de Contexto
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';

import './App.css';

// Componente "Guardião" para proteger as rotas do admin
const ProtectedAdminRoute = ({ children }) => {
  const isAdminLoggedIn = sessionStorage.getItem('admin_logged_in') === 'true';
  return isAdminLoggedIn ? children : <Navigate to="/admin/login" />;
};


// Componentes placeholder para as seções do admin (por enquanto)
const AdminDashboard = () => <div><h2>Dashboard</h2><p>Visão geral do seu negócio.</p></div>;
const AdminPedidos = () => <div><h2>Gerenciar Pedidos</h2><p>Aqui você verá a lista de pedidos.</p></div>;
const AdminProdutos = () => <div><h2>Gerenciar Produtos</h2><p>Aqui você gerenciará seus produtos.</p></div>;
const AdminCategorias = () => <div><h2>Gerenciar Categorias</h2><p>Aqui você gerenciará as categorias.</p></div>;
const AdminBanners = () => <div><h2>Gerenciar Banners</h2><p>Aqui você gerenciará os banners.</p></div>;
const AdminCupons = () => <div><h2>Gerenciar Cupons</h2><p>Aqui você gerenciará os cupons.</p></div>;


function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>
            {/* Rotas dos Clientes com o Layout Principal */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<HomePage />} />
              <Route path="carrinho" element={<CartPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="minha-conta" element={<AccountPage />} />
              <Route path="meus-favoritos" element={<FavoritesPage />} />
              <Route path="pedido/:id" element={<OrderDetailPage />} />
            </Route>

            {/* Rota de Login do Admin */}
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Novas Rotas do Painel de Admin, agora protegidas */}
            <Route path="/admin" element={<ProtectedAdminRoute><AdminLayout /></ProtectedAdminRoute>}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="pedidos" element={<AdminPedidos />} />
              <Route path="produtos" element={<AdminProdutos />} />
              <Route path="categorias" element={<AdminCategorias />} />
              <Route path="banners" element={<AdminBanners />} />
              <Route path="cupons" element={<AdminCupons />} />
            </Route>
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;