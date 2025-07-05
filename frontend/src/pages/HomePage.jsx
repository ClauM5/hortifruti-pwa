// Arquivo: frontend/src/pages/HomePage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import ProductCard from '../components/ProductCard';
import BannerCarousel from '../components/BannerCarousel';
import './HomePage.css';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = 'https://hortifruti-backend.onrender.com/api';

function HomePage() {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Puxa o token e a lista de favoritos do contexto de autenticação
  const { token, favoritos } = useAuth();

  const fetchProdutos = useCallback(async () => {
    setIsLoading(true);
    let url = new URL(`${API_BASE_URL}/produtos`);
    if (searchTerm) {
      url.searchParams.append('search', searchTerm);
    }
    if (selectedCategory !== 'Todos') {
      url.searchParams.append('categoria', selectedCategory);
    }

    try {
      const response = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await response.json();
      setProdutos(data);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedCategory, token]);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/categorias`);
        const data = await response.json();
        setCategorias([{ id: 0, nome: 'Todos' }, ...data]);
      } catch (error) { console.error("Erro ao buscar categorias:", error); }
    };
    fetchCategorias();
  }, []);

  // Este useEffect agora também depende da lista de 'favoritos'.
  // Se a lista de favoritos mudar, ele vai buscar os produtos novamente.
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
        fetchProdutos();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [fetchProdutos, favoritos]);


  // A lógica de filtragem agora é feita no backend, então aqui só exibimos os produtos recebidos.
  const filteredProducts = produtos; 

  return (
    <>
      <BannerCarousel />
      <div className="store-container">
        <aside className="filters-sidebar">
          <h4>Categorias</h4>
          <ul>
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
          <div className="search-bar">
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {(searchTerm || selectedCategory !== 'Todos') && <button onClick={() => { setSearchTerm(''); setSelectedCategory('Todos'); }} className="clear-button">Limpar Filtros</button>}
          </div>
          {isLoading ? (
            <p>Carregando produtos...</p>
          ) : (
            <div className="product-grid">
              {filteredProducts.length > 0 ? filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              )) : <p>Nenhum produto encontrado.</p>}
            </div>
          )}
        </main>
      </div>
    </>
  );
}

export default HomePage;