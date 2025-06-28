// Arquivo: frontend/src/App.jsx

import React, { useState, useEffect } from 'react';
import './App.css';

// ========================================================================
// >> É AQUI QUE VOCÊ COLA A URL! <<
// Substitua 'SUA_URL_AQUI' pela URL do seu backend que você copiou do Render.
const API_URL = 'https://hortifruti-backend.onrender.com/api/produtos';
// ========================================================================


function App() {
  // 'useState' para guardar a lista de produtos e o estado de carregamento
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 'useEffect' para buscar os dados da API assim que o componente carregar
  useEffect(() => {
    fetch(API_URL)
      .then(response => {
        if (!response.ok) {
          throw new Error('Falha ao conectar com o servidor. O backend está rodando?');
        }
        return response.json();
      })
      .then(data => {
        setProdutos(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erro ao buscar produtos:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []); // O array vazio [] garante que isso só rode uma vez

  return (
    <div className="App">
      <header className="App-header">
        <h1>Hortifruti Frescor</h1>
        <p>Peça online, receba em casa!</p>
      </header>
      <main className="product-grid">
        {loading && <p className="status-message">Carregando produtos...</p>}
        {error && <p className="status-message error">{error}</p>}
        {!loading && !error && produtos.map(produto => (
          <div key={produto.id} className="product-card">
            <img src={produto.imagem} alt={produto.nome} className="product-image" />
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

export default App;