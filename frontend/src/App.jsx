// Arquivo: frontend/src/App.jsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AccountPage from './pages/AccountPage';
import OrderDetailPage from './pages/OrderDetailPage';
import AdminPage from './pages/AdminPage'; // Manteremos a página de login do admin
import AdminLayout from './pages/AdminLayout'; // Nosso novo layout
import Navbar from './components/Navbar';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import './App.css';

// Componentes placeholder para as novas seções do admin
const AdminDashboard = () => <div><h2>Dashboard</h2><p>Em breve...</p></div>;
const AdminPedidos = () => <div><h2>Gerenciar Pedidos</h2><p>Em breve...</p></div>;
const AdminProdutos = () => <div><h2>Gerenciar Produtos</h2><p>Em breve...</p></div>;
const AdminCategorias = () => <div><h2>Gerenciar Categorias</h2><p>Em breve...</p></div>;
const AdminBanners = () => <div><h2>Gerenciar Banners</h2><p>Em breve...</p></div>;
const AdminCupons = () => <div><h2>Gerenciar Cupons</h2><p>Em breve...</p></div>;


function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Navbar />
          <div style={{ paddingTop: '80px' }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/minha-conta" element={<AccountPage />} />
              <Route path="/pedido/:id" element={<OrderDetailPage />} />
              
              {/* Rota de Login do Admin */}
              <Route path="/admin" element={<AdminPage />} />

              {/* Novas Rotas do Painel de Admin com o Layout */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="pedidos" element={<AdminPedidos />} />
                <Route path="produtos" element={<AdminProdutos />} />
                <Route path="categorias" element={<AdminCategorias />} />
                <Route path="banners" element={<AdminBanners />} />
                <Route path="cupons" element={<AdminCupons />} />
              </Route>
            </Routes>
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;