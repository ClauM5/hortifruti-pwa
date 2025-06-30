// Arquivo: frontend/src/pages/FavoritesPage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import '../App.css'; 
import './HomePage.css'; // Reutiliza estilos

const API_BASE_URL = 'https://hortifruti-backend.onrender.com/api';

function FavoritesPage() {
  const { user, token, favoritos } = useAuth();
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || favoritos.size === 0) {
      setLoading(false);
      setFavoriteProducts([]);
      return;
    }

    const fetchFavoriteProducts = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/produtos`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const allProducts = await response.json();
        
        const favs = allProducts.filter(p => favoritos.has(p.id));
        setFavoriteProducts(favs);
      } catch (error) {
        console.error("Erro ao buscar produtos favoritos:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFavoriteProducts();
  }, [token, favoritos]);

  if (loading) {
    return (
      <div className="auth-container">
        <p>Carregando seus favoritos...</p>
      </div>
    );
  }

  return (
    <div className="favorites-container">
      <h2>Meus Favoritos</h2>
      {favoriteProducts.length > 0 ? (
        <div className="product-grid">
          {favoriteProducts.map(produto => (
            <div key={produto.id} className="product-card">
              <img src={produto.imagem || 'https://via.placeholder.com/280x220?text=Sem+Imagem'} alt={produto.nome} className="product-image" />
              <div className="card-content">
                <h2 className="product-name">{produto.nome}</h2>
                <p className="product-price"> R$ {Number(produto.preco).toFixed(2).replace('.', ',')} / {produto.unidade} </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>Você ainda não favoritou nenhum produto. <Link to="/">Comece a explorar!</Link></p>
      )}
    </div>
  );
}
export default FavoritesPage;