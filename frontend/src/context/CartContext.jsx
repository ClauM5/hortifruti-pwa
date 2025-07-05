// Arquivo: frontend/src/context/CartContext.jsx (Com import de CSS removido)

import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const localData = localStorage.getItem('hortifruti_cart');
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      console.error("Erro ao ler o carrinho do localStorage", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('hortifruti_cart', JSON.stringify(cartItems));
    } catch (error) {
      console.error("Erro ao salvar o carrinho no localStorage", error);
    }
  }, [cartItems]);

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

  const removeFromCart = useCallback((productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  }, []);
  
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

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);
  
  const value = useMemo(() => ({
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  }), [cartItems, addToCart, removeFromCart, updateQuantity, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}