// Arquivo: frontend/src/components/admin/AdminCategorias.jsx

import React, { useState, useEffect, useCallback } from 'react';
import './AdminCategorias.css';

const API_BASE_URL = 'https://hortifruti-backend.onrender.com/api';

function AdminCategorias() {
  const [categorias, setCategorias] = useState([]);
  const [formCategoria, setFormCategoria] = useState({ id: null, nome: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const adminToken = '102030'; // Senha do admin

  const fetchCategorias = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/categorias`);
      if (!response.ok) throw new Error('Falha ao buscar categorias');
      const data = await response.json();
      setCategorias(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategorias();
  }, [fetchCategorias]);

  const handleSaveCategoria = async (e) => {
    e.preventDefault();
    setError('');
    const { id, nome } = formCategoria;
    if (!nome.trim()) {
      setError('O nome da categoria não pode ser vazio.');
      return;
    }
    
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_BASE_URL}/categorias/${id}` : `${API_BASE_URL}/categorias`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'authorization': adminToken
        },
        body: JSON.stringify({ nome })
      });

      if (!response.ok) throw new Error('Falha ao salvar categoria.');
      
      setFormCategoria({ id: null, nome: '' }); // Limpa o formulário
      fetchCategorias(); // Recarrega a lista
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteCategoria = async (catId) => {
    if (!window.confirm("Certeza? Deletar uma categoria a removerá de todos os produtos associados.")) return;
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/categorias/${catId}`, {
        method: 'DELETE',
        headers: { 'authorization': adminToken }
      });
      if (!response.ok) throw new Error('Falha ao deletar categoria.');
      fetchCategorias();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditClick = (categoria) => {
    setFormCategoria({ id: categoria.id, nome: categoria.nome });
  };

  return (
    <div className="admin-section-container">
      <h2>Gerenciar Categorias</h2>
      <p>Crie e organize as categorias para seus produtos.</p>
      
      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleSaveCategoria} className="category-form">
        <input 
          type="text" 
          placeholder={formCategoria.id ? "Editando nome..." : "Nome da nova categoria"}
          value={formCategoria.nome} 
          onChange={(e) => setFormCategoria({ ...formCategoria, nome: e.target.value })} 
        />
        <button type="submit" className="admin-button">
          {formCategoria.id ? 'Atualizar Categoria' : 'Adicionar Categoria'}
        </button>
        {formCategoria.id && (
            <button type="button" onClick={() => setFormCategoria({id: null, nome: ''})} className="admin-button clear-button">
                Cancelar
            </button>
        )}
      </form>

      <div className="category-list-admin">
        {isLoading ? <p>Carregando categorias...</p> : categorias.map(cat => (
          <div key={cat.id} className="category-item-admin">
            <span>{cat.nome}</span>
            <div className="item-buttons">
                <button onClick={() => handleEditClick(cat)} className="admin-button edit-button">Editar</button>
                <button onClick={() => handleDeleteCategoria(cat.id)} className="admin-button delete-button">Deletar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminCategorias;