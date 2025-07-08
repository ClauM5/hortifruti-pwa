// Arquivo: frontend/src/components/Navbar.jsx (COMPLETO E CORRIGIDO)

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { usePWAInstall } from '../App'; // <-- ADIÇÃO 1: Importa o hook que criámos
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();
  const { installPrompt, handleInstall } = usePWAInstall(); // <-- ADIÇÃO 2: Usa o hook

  const handleLogout = () => { logout(); navigate('/'); };
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">Hortifruti Frescor</Link>
      <div className="navbar-links">
        {/* ADIÇÃO 3: Renderização condicional do botão de Instalar */}
        {installPrompt && (
          <button onClick={handleInstall} className="install-button">
            Instalar App
          </button>
        )}
        
        {user ? (
          <>
            <Link to="/minha-conta">Olá, {user.nome}</Link>
            <a href="#" onClick={handleLogout}>Sair</a>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Cadastrar</Link>
          </>
        )}
        <Link to="/carrinho" className="cart-link">
          🛒 Carrinho ({cartItemCount})
        </Link>
      </div>
    </nav>
  );
}
export default Navbar;