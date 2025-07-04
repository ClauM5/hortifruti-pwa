// Arquivo: frontend/src/components/admin/AdminCupons.jsx

import React, { useState, useEffect, useCallback } from 'react';
import './AdminShared.css'; // Reutilizando nosso CSS compartilhado

const API_BASE_URL = 'https://hortifruti-backend.onrender.com/api';

function AdminCupons() {
  const [cupons, setCupons] = useState([]);
  const [formCupom, setFormCupom] = useState({ id: null, codigo: '', tipo_desconto: 'PERCENTUAL', valor: '', data_validade: '', ativo: true, usos_maximos: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const adminToken = sessionStorage.getItem('admin_password');

  const fetchCupons = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/cupons`, {
        headers: { 'authorization': adminToken }
      });
      if (!response.ok) throw new Error('Falha ao buscar cupons.');
      const data = await response.json();
      setCupons(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    fetchCupons();
  }, [fetchCupons]);

  const clearForm = () => {
    setFormCupom({ id: null, codigo: '', tipo_desconto: 'PERCENTUAL', valor: '', data_validade: '', ativo: true, usos_maximos: '' });
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormCupom(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSaveCupom = async (e) => {
    e.preventDefault();
    setError('');
    const cupomData = {
        ...formCupom,
        usos_maximos: formCupom.usos_maximos || null,
        data_validade: formCupom.data_validade || null,
        valor: Number(formCupom.valor)
    };
    const { id, ...data } = cupomData;
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_BASE_URL}/cupons/${id}` : `${API_BASE_URL}/cupons`;
    try {
        const response = await fetch(url, { method, headers: {'Content-Type': 'application/json', 'authorization': adminToken}, body: JSON.stringify(data) });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Falha ao salvar cupom.');
        }
        clearForm();
        fetchCupons();
    } catch(err) {
        setError(err.message);
    }
  };

  const handleDeleteCupom = async (cupomId) => {
    if (!window.confirm("Tem certeza?")) return;
    try {
        await fetch(`${API_BASE_URL}/cupons/${cupomId}`, { method: 'DELETE', headers: { 'authorization': adminToken } });
        fetchCupons();
    } catch (err) {
        setError('Falha ao deletar cupom.');
    }
  };

  const handleEditCupom = (cupom) => {
    const dataFormatada = cupom.data_validade ? new Date(cupom.data_validade).toISOString().split('T')[0] : '';
    setFormCupom({ ...cupom, data_validade: dataFormatada, usos_maximos: cupom.usos_maximos || '' });
  };
  
  return (
    <div className="admin-section-container">
      <h2>Gerenciar Cupons de Desconto</h2>
      <p>Crie e administre cupons para suas campanhas promocionais.</p>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSaveCupom} className="admin-form">
        <h4>{formCupom.id ? 'Editando Cupom' : 'Adicionar Novo Cupom'}</h4>
        <div className="form-grid">
          <input type="text" name="codigo" placeholder="Código (ex: BEMVINDO10)" value={formCupom.codigo} onChange={handleFormChange} required />
          <input type="number" name="valor" placeholder="Valor do Desconto" value={formCupom.valor} onChange={handleFormChange} required step="0.01" />
          <select name="tipo_desconto" value={formCupom.tipo_desconto} onChange={handleFormChange}>
              <option value="PERCENTUAL">Percentual (%)</option>
              <option value="FIXO">Valor Fixo (R$)</option>
          </select>
          <input type="date" name="data_validade" value={formCupom.data_validade} onChange={handleFormChange} />
          <input type="number" name="usos_maximos" placeholder="Limite de Usos (opcional)" value={formCupom.usos_maximos} onChange={handleFormChange} />
        </div>
        <label className="checkbox-label-align"><input type="checkbox" name="ativo" checked={formCupom.ativo} onChange={handleFormChange} /> Ativo?</label>
        <div className="form-buttons">
          <button type="submit" className="admin-button save-button">Salvar Cupom</button>
          {formCupom.id && <button type="button" onClick={clearForm} className="admin-button clear-button">Cancelar Edição</button>}
        </div>
      </form>
      <div className="admin-list">
        <h3>Cupons Cadastrados</h3>
        {isLoading ? <p>Carregando...</p> : cupons.map(cupom => (
          <div key={cupom.id} className="list-item">
            <span><strong>{cupom.codigo}</strong></span>
            <span>{cupom.tipo_desconto === 'PERCENTUAL' ? `${cupom.valor}% OFF` : `R$ ${Number(cupom.valor).toFixed(2)} OFF`}</span>
            <span>Usos: {cupom.usos_atuais || 0} / {cupom.usos_maximos || '∞'}</span>
            <span className={cupom.ativo ? 'status-active' : 'status-inactive'}>{cupom.ativo ? 'Ativo' : 'Inativo'}</span>
            <div className="item-buttons">
              <button onClick={() => handleEditCupom(cupom)} className="admin-button edit-button">Editar</button>
              <button onClick={() => handleDeleteCupom(cupom.id)} className="admin-button delete-button">Deletar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminCupons;