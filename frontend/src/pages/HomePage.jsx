// Arquivo: frontend/src/pages/HomePage.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

  const { token, favoritos } = useAuth();

  useEffect(() => {
    const fetchProdutos = async () => {
      setIsLoading(true);
      let url = new URL(`${API_BASE_URL}/produtos`);
      if (searchTerm) url.searchParams.append('search', searchTerm);
      if (selectedCategory !== 'Todos') url.searchParams.append('categoria', selectedCategory);

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
    };
    fetchProdutos();
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

  const produtosComFavoritos = useMemo(() => {
    return produtos.map(produto => ({
      ...produto,
      is_favorito: favoritos.has(produto.id)
    }));
  }, [produtos, favoritos]);

  return (
    <>
      <BannerCarousel />
      <div className="store-container">
        <aside className="filters-sidebar">
          <h4>Categorias</h4>
          <ul>
            {categorias.map(cat => (
              <li key={cat.id} className={selectedCategory === cat.nome ? 'active' : ''} onClick={() => setSelectedCategory(cat.nome)}>
                {cat.nome}
              </li>
            ))}
          </ul>
        </aside>
        <main className="product-area">
          <div className="search-bar">
            <input type="text" placeholder="Buscar por nome..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            {(searchTerm || selectedCategory !== 'Todos') && <button onClick={() => { setSearchTerm(''); setSelectedCategory('Todos'); }} className="clear-button">Limpar Filtros</button>}
          </div>
          {isLoading ? <p>Carregando produtos...</p> : (
            <div className="product-grid">
              {produtosComFavoritos.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}

export default HomePage;