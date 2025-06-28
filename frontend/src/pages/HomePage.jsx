// Arquivo: frontend/src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import '../App.css'; // Podemos reusar o estilo principal

const API_URL = import.meta.env.VITE_API_URL || 'https://hortifruti-backend.onrender.com/api/produtos';

function HomePage() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        setProdutos(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Falha ao carregar produtos.');
        setLoading(false);
      });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Hortifruti Frescor</h1>
        <p>Peça online, receba em casa!</p>
      </header>
      <main className="product-grid">
        {loading && <p>Carregando...</p>}
        {error && <p>{error}</p>}
        {produtos.map(produto => (
          <div key={produto.id} className="product-card">
            <img src={produto.imagem || 'https://via.placeholder.com/280x220?text=Sem+Imagem'} alt={produto.nome} className="product-image" />
            <div className="card-content">
              <h2 className="product-name">{produto.nome}</h2>
              <p className="product-price">
                R$ {Number(produto.preco).toFixed(2).replace('.', ',')} / {produto.unidade}
              </p>
              <button className="add-to-cart-button">Adicionar ao Carrinho</button>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}

export default HomePage;