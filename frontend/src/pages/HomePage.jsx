// Arquivo: frontend/src/pages/HomePage.jsx (Final com Busca e Filtros)

import React, { useState, useEffect, useCallback } from 'react';
import '../App.css';
import './HomePage.css'; // << Novo arquivo de estilo para a Home
import { useCart } from '../context/CartContext';

const API_BASE_URL = 'https://hortifruti-backend.onrender.com/api';

function HomePage() {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(''); // << Estado para o filtro

  const { addToCart } = useCart();
      
  const fetchProdutos = useCallback(async () => {
    setLoading(true);
    // Constrói a URL da API com os parâmetros de busca e filtro
    let url = `${API_BASE_URL}/produtos?`;
    if (searchTerm) {
      url += `search=${searchTerm}`;
    }
    if (selectedCategory) {
      url += `${searchTerm ? '&' : ''}categoria=${selectedCategory}`;
    }

    try {
      const response = await fetch(url);
      const data = await response.json();
      setProdutos(data);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory]); // A função é recriada quando a busca ou o filtro mudam

  const fetchCategorias = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categorias`);
      const data = await response.json();
      setCategorias(data);
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
    }
  };
      
  useEffect(() => {
    fetchCategorias();
  }, []); // Busca as categorias uma vez quando a página carrega

  useEffect(() => {
    // Busca os produtos sempre que o termo de busca ou a categoria selecionada mudar
    const debounceTimer = setTimeout(() => {
        fetchProdutos();
    }, 500); // << Debounce: espera 500ms após o usuário parar de digitar para fazer a busca

    return () => clearTimeout(debounceTimer); // Limpa o timer
  }, [fetchProdutos]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
  };

  return (
    <>
      <header className="App-header">
        <h1>Hortifruti Frescor</h1>
        <p>Encontre os melhores produtos, frescos e selecionados para você.</p>
      </header>
      
      <div className="store-container">
        {/* ======================================================= */}
        {/* >> NOVA BARRA LATERAL DE FILTROS << */}
        {/* ======================================================= */}
        <aside className="filters-sidebar">
          <h4>Categorias</h4>
          <ul>
            <li 
              className={selectedCategory === '' ? 'active' : ''}
              onClick={() => setSelectedCategory('')}
            >
              Todas
            </li>
            {categorias.map(cat => (
              <li 
                key={cat.id}
                className={selectedCategory === cat.nome ? 'active' : ''}
                onClick={() => setSelectedCategory(cat.nome)}
              >
                {cat.nome}
              </li>
            ))}
          </ul>
        </aside>

        <main className="product-area">
          {/* ======================================================= */}
          {/* >> NOVA BARRA DE BUSCA << */}
          {/* ======================================================= */}
          <div className="search-bar">
            <input 
              type="text" 
              placeholder="O que você procura hoje?"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {(searchTerm || selectedCategory) && (
              <button onClick={handleClearFilters} className="clear-button">Limpar Filtros</button>
            )}
          </div>

          <div className="product-grid">
            {loading ? (
              <p>Carregando produtos...</p>
            ) : produtos.length > 0 ? (
              produtos.map(produto => (
                <div key={produto.id} className="product-card">
                  <img src={produto.imagem || 'https://via.placeholder.com/280x220?text=Sem+Imagem'} alt={produto.nome} className="product-image" />
                  <div className="card-content">
                    <h2 className="product-name">{produto.nome}</h2>
                    <p className="product-price"> R$ {Number(produto.preco).toFixed(2).replace('.', ',')} / {produto.unidade} </p>
                    <button onClick={() => addToCart(produto)} className="add-to-cart-button"> Adicionar ao Carrinho </button>
                  </div>
                </div>
              ))
            ) : (
              <p>Nenhum produto encontrado com os filtros selecionados.</p>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

export default HomePage;