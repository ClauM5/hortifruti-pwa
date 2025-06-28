// Arquivo: frontend/src/context/CartContext.jsx

import React, { createContext, useState, useContext } from 'react';

// 1. Criamos o Contexto
const CartContext = createContext();

// 2. Criamos o "Provedor" do Contexto
//    É um componente que vai abraçar nosso app e fornecer o estado do carrinho
export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (product) => {
    setCartItems(prevItems => {
      const itemExists = prevItems.find(item => item.id === product.id);
      if (itemExists) {
        // Se o item já existe, aumenta a quantidade
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Se é um item novo, adiciona ao carrinho com quantidade 1
        return [...prevItems, { ...product, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  // O valor que será compartilhado com todos os componentes
  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// 3. Criamos um "Hook" customizado para facilitar o uso do contexto
export function useCart() {
  return useContext(CartContext);
}