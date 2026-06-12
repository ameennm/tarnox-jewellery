import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('tarnox_cart');
    if (saved) {
      try {
        setCartItems(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse cart', e);
      }
    }
  }, []);

  // Save to local storage when cart changes
  useEffect(() => {
    localStorage.setItem('tarnox_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const getStockLimit = (product) => {
    if (product.stock_quantity === undefined || product.stock_quantity === null || product.stock_quantity === '') {
      return Infinity;
    }
    const stock = Number(product.stock_quantity);
    return Number.isFinite(stock) ? Math.max(0, stock) : Infinity;
  };

  const addToCart = (product, quantity = 1) => {
    const quantityToAdd = Math.max(1, parseInt(quantity, 10) || 1);
    const stockLimit = getStockLimit(product);

    setCartItems(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        return prev.map(item => {
          if (item.id !== product.id) return item;
          const nextQuantity = Math.min(item.quantity + quantityToAdd, getStockLimit(item));
          return { ...item, quantity: nextQuantity };
        });
      }
      if (stockLimit <= 0) return prev;
      return [...prev, { ...product, quantity: Math.min(quantityToAdd, stockLimit) }];
    });
  };

  const removeFromCart = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id, quantity) => {
    if (quantity < 1) return removeFromCart(id);
    setCartItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      return { ...item, quantity: Math.min(quantity, getStockLimit(item)) };
    }));
  };

  const clearCart = () => {
    localStorage.setItem('tarnox_cart', JSON.stringify([]));
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
