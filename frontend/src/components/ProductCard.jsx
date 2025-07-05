// Arquivo: frontend/src/components/ProductCard.jsx

import React from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './ProductCard.css'; // Criaremos este arquivo a seguir

function ProductCard({ product }) {
  const { addToCart, cartItems } = useCart();
  const { user, favoritos, toggleFavorito } = useAuth();

  const isInCart = cartItems.some(item => item.id === product.id);
  const isFavorito = user && favoritos.has(product.id);

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (user) {
      toggleFavorito(product.id);
    } else {
      alert('Você precisa estar logado para adicionar aos favoritos.');
    }
  };

  return (
    <div className="product-card">
      <div className="product-image-container">
        <img src={product.imagem} alt={product.nome} className="product-image" />
        {user && (
          <button 
            onClick={handleFavoriteClick} 
            className={`favorite-button ${isFavorito ? 'favorited' : ''}`}
            aria-label="Adicionar aos favoritos"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
        )}
      </div>
      <div className="card-content">
        <h3 className="product-name">{product.nome}</h3>
        <p className="product-price">
          R$ {Number(product.preco).toFixed(2).replace('.', ',')}
          <span className="product-unit"> / {product.unidade}</span>
        </p>
        <button 
          onClick={() => addToCart(product)} 
          className={`add-to-cart-button ${isInCart ? 'added' : ''}`}
          disabled={isInCart}
        >
          {isInCart ? 'Adicionado ✓' : 'Adicionar'}
        </button>
      </div>
    </div>
  );
}

export default ProductCard;