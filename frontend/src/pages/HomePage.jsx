// Arquivo: frontend/src/pages/HomePage.jsx

import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard'; // << Importa o novo componente
import './HomePage.css';

const API_BASE_URL = 'https://hortifruti-backend.onrender.com/api';

function HomePage() {
  const [products, setProducts] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [productsRes, categoriasRes] = await Promise.all([
          fetch(`${API_BASE_URL}/produtos`),
          fetch(`${API_BASE_URL}/categorias`)
        ]);
        const productsData = await productsRes.json();
        const categoriasData = await categoriasRes.json();
        setProducts(productsData);
        setCategorias([{ id: 0, nome: 'Todos' }, ...categoriasData]);
      } catch (error) {
        console.error("Falha ao buscar dados:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'Todos' || product.categorias.includes(selectedCategory);
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