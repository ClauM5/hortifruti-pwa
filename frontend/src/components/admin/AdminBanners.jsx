// Arquivo: frontend/src/components/admin/AdminBanners.jsx

import React, { useState, useEffect, useCallback } from 'react';
import './AdminShared.css'; // Usaremos um CSS compartilhado para as seções do admin

const API_BASE_URL = 'https://hortifruti-backend.onrender.com/api';

function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [formBanner, setFormBanner] = useState({ id: null, titulo: '', subtitulo: '', imagem_url: '', link_url: '', is_active: true, ordem: 0 });
  const [bannerFile, setBannerFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const adminToken = sessionStorage.getItem('admin_password');

  const fetchBanners = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/banners`, {
        headers: { 'authorization': adminToken }
      });
      if (!response.ok) throw new Error('Falha ao buscar banners');
      const data = await response.json();
      setBanners(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);
  
  const handleImageUpload = async (file) => {
    if (!file) return null;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const response = await fetch(`${API_BASE_URL}/upload`, { method: 'POST', headers: { 'authorization': adminToken }, body: formData });
      if (!response.ok) throw new Error('Falha no upload da imagem.');
      return (await response.json()).imageUrl;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const clearFormBanner = () => {
    setFormBanner({ id: null, titulo: '', subtitulo: '', imagem_url: '', link_url: '', is_active: true, ordem: 0 });
    setBannerFile(null);
    document.getElementById('banner-file-input').value = ''; // Limpa o input de arquivo
  };

  const handleSaveBanner = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    let imageUrl = formBanner.imagem_url;
    if (bannerFile) {
      imageUrl = await handleImageUpload(bannerFile);
      if (!imageUrl) {
        setIsLoading(false);
        return;
      }
    }
    const bannerData = { ...formBanner, imagem_url: imageUrl, ordem: Number(formBanner.ordem) };
    const { id, ...data } = bannerData;
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_BASE_URL}/banners/${id}` : `${API_BASE_URL}/banners`;

    try {
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'authorization': adminToken }, body: JSON.stringify(data) });
      if (!response.ok) throw new Error('Falha ao salvar o banner.');
      clearFormBanner();
      fetchBanners();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBanner = async (bannerId) => {
    if (!window.confirm("Tem certeza que deseja deletar este banner?")) return;
    try {
      await fetch(`${API_BASE_URL}/banners/${bannerId}`, { method: 'DELETE', headers: { 'authorization': adminToken } });
      fetchBanners();
    } catch (err) {
      setError('Falha ao deletar o banner.');
    }
  };
  
  const handleEditBanner = (banner) => {
    setFormBanner(banner);
    setBannerFile(null);
  };
  
  const handleBannerFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormBanner(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };
  
  const handleBannerFileChange = (e) => {
    setBannerFile(e.target.files[0]);
  };

  return (
    <div className="admin-section-container">
      <h2>Gerenciar Banners</h2>
      <p>Adicione, edite e organize os banners rotativos da sua página inicial.</p>
      
      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleSaveBanner} className="admin-form">
        <h4>{formBanner.id ? 'Editando Banner' : 'Adicionar Novo Banner'}</h4>
        <div className="form-grid-col-2">
          <input type="text" name="titulo" placeholder="Título do Banner (opcional)" value={formBanner.titulo} onChange={handleBannerFormChange} />
          <input type="text" name="subtitulo" placeholder="Subtítulo (opcional)" value={formBanner.subtitulo} onChange={handleBannerFormChange} />
        </div>
        <input type="text" name="link_url" placeholder="URL de destino (ex: /carrinho)" value={formBanner.link_url} onChange={handleBannerFormChange} />
        <div className="form-grid-col-2">
          <input type="number" name="ordem" placeholder="Ordem de exibição" value={formBanner.ordem} onChange={handleBannerFormChange} />
          <label className="checkbox-label-align"><input type="checkbox" name="is_active" checked={formBanner.is_active} onChange={handleBannerFormChange} /> Ativo?</label>
        </div>
        <label>Imagem do Banner (16:9, ex: 1600x900px):</label>
        <input id="banner-file-input" type="file" onChange={handleBannerFileChange} accept="image/*" />

        <div className="form-buttons">
          <button type="submit" className="admin-button save-button" disabled={isUploading}>
            {isUploading ? 'Enviando Imagem...' : (formBanner.id ? 'Atualizar Banner' : 'Salvar Banner')}
          </button>
          {formBanner.id && <button type="button" onClick={clearFormBanner} className="admin-button clear-button">Cancelar Edição</button>}
        </div>
      </form>

      <div className="admin-list">
        <h3>Banners Cadastrados</h3>
        {isLoading ? <p>Carregando...</p> : banners.map(banner => (
          <div key={banner.id} className="list-item">
            <img src={banner.imagem_url} alt={banner.titulo || 'Banner'} className="item-thumbnail"/>
            <span>{banner.titulo || 'Banner sem título'} (Ordem: {banner.ordem})</span>
            <span className={banner.is_active ? 'status-active' : 'status-inactive'}>{banner.is_active ? 'Ativo' : 'Inativo'}</span>
            <div className="item-buttons">
              <button onClick={() => handleEditBanner(banner)} className="admin-button edit-button">Editar</button>
              <button onClick={() => handleDeleteBanner(banner.id)} className="admin-button delete-button">Deletar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminBanners;