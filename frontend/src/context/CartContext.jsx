// Arquivo: frontend/src/components/ProductCard.jsx
import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './ProductCard.css';

const HeartIconFilled = () => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"> <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/> </svg> );
const HeartIconOutlined = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24"> <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /> </svg> );

function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { user, favoritos, toggleFavorito } = useAuth();
  const [isJustAdded, setIsJustAdded] = useState(false);

  // O isFavorito agora vem direto da prop, que é atualizada pela HomePage
  const isFavorited = product.is_favorito;

  const handleAddToCart = () => {
    addToCart(product);
    setIsJustAdded(true);
    setTimeout(() => { setIsJustAdded(false); }, 1500);
  };

  return (
    <div className="product-card">
      <div className="product-image-container">
        <img src={product.imagem || 'https://via.placeholder.com/280x220?text=Sem+Imagem'} alt={product.nome} className="product-image" />
        {user && (
          <button 
            onClick={() => toggleFavorito(product.id)} 
            className={`favorite-button ${isFavorited ? 'favorited' : ''}`}
            aria-label="Adicionar aos favoritos"
          >
            {isFavorited ? <HeartIconFilled /> : <HeartIconOutlined />}
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
          onClick={handleAddToCart} 
          className={`add-to-cart-button ${isJustAdded ? 'just-added' : ''}`}
          disabled={isJustAdded}
        >
          {isJustAdded ? 'Adicionado ✓' : 'Adicionar ao Carrinho'}
        </button>
      </div>
    </div>
  );
}

export default ProductCard;