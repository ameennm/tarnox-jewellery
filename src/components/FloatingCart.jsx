import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import './FloatingCart.css';

const FloatingCart = () => {
  const { cartCount } = useCart();

  if (cartCount === 0) return null;

  return (
    <Link to="/cart" className="floating-cart glass-morphism">
      <div className="floating-cart-inner">
        <ShoppingBag size={24} />
        <span className="floating-count">{cartCount}</span>
      </div>
    </Link>
  );
};

export default FloatingCart;
