// Arquivo: frontend/src/context/CartContext.jsx (Com addMultipleItemsToCart)

import React, { createContext, useState, useContext, useCallback, useMemo } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = useCallback((product) => {
    setCartItems(prevItems => {
      const itemExists = prevItems.find(item => item.id === product.id);
      if (itemExists) {
        return prevItems.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevItems, { ...product, quantity: 1 }];
      }
    });
  }, []);

  // >>>>> NOVA FUNÇÃO <<<<<
  const addMultipleItemsToCart = useCallback((productsToAdd) => {
    setCartItems(prevItems => {
      let newItems = [...prevItems];
      productsToAdd.forEach(productToAdd => {
        const itemExists = newItems.find(item => item.id === productToAdd.produto_id);
        if (itemExists) {
          // Se o item já existe, apenas aumenta a quantidade
          newItems = newItems.map(item =>
            item.id === productToAdd.produto_id
              ? { ...item, quantity: item.quantity + productToAdd.quantidade }
              : item
          );
        } else {
          // Se não existe, precisamos dos detalhes completos do produto.
          // Esta função assume que o objeto 'productToAdd' tem as infos necessárias.
          // Para o nosso caso (vindo do histórico de pedidos), ele não tem o nome, etc.
          // Vamos simplificar por agora, mas o ideal seria buscar os detalhes do produto.
          // Por enquanto, esta função não é usada, mas a deixamos como base.
          // A lógica de recompra será feita diretamente na página da conta.
        }
      });
      return newItems;
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
    addMultipleItemsToCart, // <-- Exporta a nova função
  }), [cartItems, addToCart, removeFromCart, updateQuantity, clearCart, addMultipleItemsToCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}