import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './AuthPages.css';

function RegisterPage() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(nome, email, senha);
      alert('Cadastro realizado com sucesso! Faça o login.');
      navigate('/login');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Crie sua Conta</h2>
        <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome Completo" required />
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" required />
        <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Senha" required />
        {error && <p className="error-message">{error}</p>}
        <button type="submit">Cadastrar</button>
        <p>Já tem uma conta? <Link to="/login">Faça o login</Link></p>
      </form>
    </div>
  );
}
export default RegisterPage;