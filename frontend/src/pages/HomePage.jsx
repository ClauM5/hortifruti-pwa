// Arquivo: frontend/src/pages/HomePage.jsx (Final com Navbar)
import React from 'react';
import Navbar from '../components/Navbar'; // Importa o Navbar
// ... outras importações ...
import { useCart } from '../context/CartContext';
import Cart from '../components/Cart';
import '../App.css';

const API_URL = 'https://hortifruti-backend.onrender.com/api/produtos';

function HomePage() {
  // ... toda a lógica de fetchProdutos e addToCart continua a mesma ...
  const [produtos, setProdutos] = React.useState([]);
  const { addToCart } = useCart();

  React.useEffect(() => {
    fetch(API_URL).then(r=>r.json()).then(d=>setProdutos(d));
  },[]);

  return (
    <div className="App">
      <Navbar /> {/* <-- Adiciona o Navbar no topo */}
      <Cart />
      <header className="App-header">
        <h1>Hortifruti Frescor</h1>
        <p>Peça online, receba em casa!</p>
      </header>
      <main className="product-grid">
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
      </main>
    </div>
  );
}
export default HomePage;