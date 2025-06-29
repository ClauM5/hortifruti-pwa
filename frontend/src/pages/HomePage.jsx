// Arquivo: frontend/src/pages/HomePage.jsx (Versão Final e Limpa)

import React, { useState, useEffect } from 'react';
import '../App.css';
import { useCart } from '../context/CartContext';

const API_URL = 'https://hortifruti-backend.onrender.com/api/produtos';

function HomePage() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
      
  useEffect(() => {
    setLoading(true);
    fetch(API_URL).then(r=>r.json()).then(d=>{
        setProdutos(d);
        setLoading(false);
    });
  },[]);

  return (
    <>
      <header className="App-header">
        <h1>Hortifruti Frescor</h1>
        <p>Peça online, receba em casa!</p>
      </header>
      <div className="product-grid">
        {loading && <p>Carregando produtos...</p>}
        {produtos.map(produto => (
          <div key={produto.id} className="product-card">
            <img src={produto.imagem || 'https://via.placeholder.com/280x220?text=Sem+Imagem'} alt={produto.nome} className="product-image" />
            <div className="card-content">
              <h2 className="product-name">{produto.nome}</h2>
              <p className="product-price"> R$ {Number(produto.preco).toFixed(2).replace('.', ',')} / {produto.unidade} </p>
              <button onClick={() => addToCart(produto)} className="add-to-cart-button"> Adicionar ao Carrinho </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default HomePage;