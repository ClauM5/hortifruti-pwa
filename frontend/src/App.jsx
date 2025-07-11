// Arquivo: frontend/src/App.jsx (COMPLETO E CORRIGIDO)

import React, { useState, useEffect, createContext, useContext } from 'react';
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

// Componentes Reais do Admin
import AdminDashboard from './components/admin/AdminDashboard';
import AdminCategorias from './components/admin/AdminCategorias';
import AdminProdutos from './components/admin/AdminProdutos';
import AdminPedidos from './components/admin/AdminPedidos';
import AdminBanners from './components/admin/AdminBanners';
import AdminCupons from './components/admin/AdminCupons';

// --- ADIÇÃO 1: CONTEXTO PARA INSTALAÇÃO DO PWA ---
const PWAInstallContext = createContext();
export const usePWAInstall = () => useContext(PWAInstallContext);

const PWAInstallProvider = ({ children }) => {
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      console.log('beforeinstallprompt event fired');
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      setInstallPrompt(null);
    });
  };
  
  return (
    <PWAInstallContext.Provider value={{ installPrompt, handleInstall }}>
      {children}
    </PWAInstallContext.Provider>
  );
};
// --- FIM DA ADIÇÃO ---


// Componente "Guardião" para proteger as rotas do admin
const ProtectedAdminRoute = ({ children }) => {
  const isAdminLoggedIn = sessionStorage.getItem('admin_password');
  return isAdminLoggedIn ? children : <Navigate to="/admin/login" replace />;
};

function App() {
  return (
    // --- ADIÇÃO 2: ENVOLVER OS PROVIDERS COM O NOVO PWAInstallProvider ---
    <PWAInstallProvider>
      <Router>
        <AuthProvider>
          <CartProvider>
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
          </CartProvider>
        </AuthProvider>
      </Router>
    </PWAInstallProvider>
    // --- FIM DA ADIÇÃO ---
  );
}

export default App;