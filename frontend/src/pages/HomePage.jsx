// Arquivo: frontend/src/pages/HomePage.jsx (Versão Final com Carrinho)

import React, { useState, useEffect } from 'react';
import '../App.css';
import { useCart } from '../context/CartContext'; // Importa o hook do carrinho
import Cart from '../components/Cart';             // Importa o componente visual do carrinho

const API_URL = 'https://hortifruti-backend.onrender.com/api/produtos';

function HomePage() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart(); // "Puxa" a função addToCart do nosso contexto global

  useEffect(() => {
    fetch(API_URL)
      .then(res => {
        if (!res.ok) {
          throw new Error('Falha na comunicação com o servidor.');
        }
        return res.json();
      })
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
      {/* O componente do carrinho flutuante */}
      <Cart />

      <header className="App-header">
        <h1>Hortifruti Frescor</h1>
        <p>Peça online, receba em casa!</p>
      </header>

      <main className="product-grid">
        {loading && <p>Carregando produtos...</p>}
        {error && <p className="error-message">{error}</p>}
        
        {produtos.map(produto => (
          <div key={produto.id} className="product-card">
            <img src={produto.imagem || 'https://via.placeholder.com/280x220?text=Sem+Imagem'} alt={produto.nome} className="product-image" />
            <div className="card-content">
              <h2 className="product-name">{produto.nome}</h2>
              <p className="product-price">
                R$ {Number(produto.preco).toFixed(2).replace('.', ',')} / {produto.unidade}
              </p>
              {/* O botão agora chama a função addToCart, passando o produto inteiro */}
              <button onClick={() => addToCart(produto)} className="add-to-cart-button">
                Adicionar ao Carrinho
              </button>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}

export default HomePage;