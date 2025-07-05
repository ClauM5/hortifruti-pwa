// Arquivo: frontend/src/pages/HomePage.jsx (Ouvindo os favoritos)

import React, { useState, useEffect, useCallback } from 'react';
import ProductCard from '../components/ProductCard';
import './HomePage.css';

const API_BASE_URL = 'https://hortifruti-backend.onrender.com/api';

function HomePage() {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // A HomePage não precisa mais da lógica de autenticação aqui,
  // isso será responsabilidade do ProductCard

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [productsRes, categoriasRes] = await Promise.all([
          fetch(`${API_BASE_URL}/produtos`), // Busca pública inicial
          fetch(`${API_BASE_URL}/categorias`)
        ]);
        const productsData = await productsRes.json();
        const categoriasData = await categoriasRes.json();
        setProdutos(productsData);
        setCategorias([{ id: 0, nome: 'Todos' }, ...categoriasData]);
      } catch (error) {
        console.error("Falha ao buscar dados:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredProducts = produtos.filter(product => {
    const productCategories = product.categorias || [];
    const matchesCategory = selectedCategory === 'Todos' || productCategories.includes(selectedCategory);
    const matchesSearch = product.nome.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
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
          {searchTerm && <button onClick={() => setSearchTerm('')} className="clear-button">Limpar</button>}
        </div>

        {isLoading ? (
          <p>Carregando produtos...</p>
        ) : (
          <div className="product-grid">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default HomePage;