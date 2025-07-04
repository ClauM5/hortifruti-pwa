// Arquivo: frontend/src/pages/AdminLoginPage.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminLoginPage.css';

function AdminLoginPage() {
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    if (senha === '102030') {
      sessionStorage.setItem('admin_password', senha); // Salva a senha correta
      navigate('/admin/dashboard');
    } else {
      setError('Senha incorreta!');
    }
  };

  return (
    <div className="admin-login-container">
      <h2>Painel de Administrador</h2>
      <p>Por favor, insira a senha para continuar.</p>
      <input type="password" placeholder="Digite a senha" value={senha} onChange={(e) => setSenha(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleLogin()} className="admin-input"/>
      {error && <p className="error-message">{error}</p>}
      <button onClick={handleLogin} className="admin-button">Entrar</button>
    </div>
  );
}

export default AdminLoginPage;