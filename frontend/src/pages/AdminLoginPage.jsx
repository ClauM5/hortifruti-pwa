// Arquivo: frontend/src/pages/AdminLoginPage.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminLoginPage.css'; // Importa o novo nome do CSS

function AdminLoginPage() {
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    // A senha do admin que está no Render
    if (senha === '102030') {
      // Salva um item no sessionStorage para "lembrar" que o admin está logado
      // nesta sessão do navegador.
      sessionStorage.setItem('admin_logged_in', 'true');
      // Redireciona para o dashboard do novo painel
      navigate('/admin/dashboard');
    } else {
      setError('Senha incorreta!');
    }
  };

  return (
    <div className="admin-login-container">
      <h2>Painel de Administrador</h2>
      <p>Por favor, insira a senha para continuar.</p>
      <input
        type="password"
        placeholder="Digite a senha"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
        className="admin-input"
      />
      {error && <p className="error-message">{error}</p>}
      <button onClick={handleLogin} className="admin-button">Entrar</button>
    </div>
  );
}

export default AdminLoginPage;