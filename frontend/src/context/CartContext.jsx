// Arquivo: frontend/src/context/CartContext.jsx (Versão Otimizada)

import React, { createContext, useState, useContext, useCallback, useMemo } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  // A função addToCart só será recriada se suas dependências mudarem.
  // Como não tem dependências, ela é criada uma única vez.
  const addToCart = useCallback((product) => {
    setCartItems(prevItems => {
      const itemExists = prevItems.find(item => item.id === product.id);
      if (itemExists) {
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevItems, { ...product, quantity: 1 }];
      }
    });
  }, []);

  // A função removeFromCart também é criada uma única vez.
  const removeFromCart = useCallback((productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  }, []);
  
  // A função updateQuantity só será recriada se a função removeFromCart mudar (o que nunca acontece).
  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === productId ? { ...item, quantity } : item
        )
      );
    }
  }, [removeFromCart]);
  
  // O objeto 'value' só será recriado se uma das suas dependências mudar.
  // Isso estabiliza o contexto e previne re-renderizações desnecessárias nos componentes consumidores.
  const value = useMemo(() => ({
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
  }), [cartItems, addToCart, removeFromCart, updateQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}