import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AuthPages.css';

function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return <p>Você precisa estar logado para ver esta página.</p>;
  }

  return (
    <div className="auth-container">
        <div className="auth-form">
            <h2>Minha Conta</h2>
            <p>Olá, <strong>{user.nome}!</strong></p>
            <p>Bem-vindo à sua área de cliente. Em breve, você poderá ver seus pedidos aqui.</p>
            <button onClick={handleLogout}>Sair (Logout)</button>
        </div>
    </div>
  );
}
export default AccountPage;