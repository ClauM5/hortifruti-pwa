// Arquivo: frontend/src/App.jsx - PARTE 1 DE 3

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import MainLayout from './layouts/MainLayout';
import AdminLayout from './pages/AdminLayout';

// Páginas
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

// Provedores de Contexto
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';

// Estilos
import './App.css';

// Componentes Reais do Admin que já construímos
import AdminDashboard from './components/admin/AdminDashboard';
import AdminCategorias from './components/admin/AdminCategorias';
import AdminProdutos from './components/admin/AdminProdutos';
import AdminPedidos from './components/admin/AdminPedidos';

// Componentes placeholder para as seções que AINDA VAMOS CONSTRUIR
const AdminBanners = () => <div className="admin-section-container"><h2>Gerenciar Banners</h2><p>Em breve...</p></div>;
const AdminCupons = () => <div className="admin-section-container"><h2>Gerenciar Cupons</h2><p>Em breve...</p></div>;


// Componente "Guardião" para proteger as rotas do admin
const ProtectedAdminRoute = ({ children }) => {
  const isAdminLoggedIn = sessionStorage.getItem('admin_logged_in') === 'true';
  return isAdminLoggedIn ? children : <Navigate to="/admin/login" replace />;
};

// Arquivo: frontend/src/App.jsx - PARTE 2 DE 3

function App() {
  return (
    // O <Router> é o componente mais externo, envolvendo todos os outros.
    <Router>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Rotas dos Clientes */}
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

            {/* Rota de Login do Admin */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            
            {/* Rotas do Painel de Admin com Layout e Proteção */}
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
          // Arquivo: frontend/src/App.jsx - PARTE 3 DE 3
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;