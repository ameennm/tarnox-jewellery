import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingCart } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import './CartPage.css';

const CartPage = () => {
  const { cartItems, updateQuantity, removeFromCart, cartTotal } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="cart-page empty-cart container">
        <ShoppingCart size={80} strokeWidth={1} />
        <h1>Your Cart is Empty</h1>
        <p>Looks like you haven't added anything to your cart yet.</p>
        <Link to="/shop" className="btn btn-primary">Start Shopping</Link>
      </div>
    );
  }

  const handleCheckout = () => {
    const whatsappNumber = "918136926624";
    const itemDetails = cartItems.map(item => `- ${item.title} (${item.quantity}x ${item.price.toFixed(2)}) = ₹${(item.price * item.quantity).toFixed(2)}`).join('%0A');
    const message = `Hello Tarnox Jewellery! I'd like to place an order:%0A%0A${itemDetails}%0A%0A*Total: ₹${cartTotal.toFixed(2)}*%0A%0AThank you!`;
    
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="cart-page container">
      <h1 className="page-title">Shopping Cart</h1>
      
      <div className="cart-grid">
        <div className="cart-items">
          {cartItems.map(item => (
            <div key={item.id} className="cart-item glass-morphism">
              <div className="item-image">
                <img src={item.image_url} alt={item.title} />
              </div>
              <div className="item-details">
                <h3>{item.title}</h3>
                <p className="item-cat">{item.category}</p>
                <p className="item-price">₹{item.price.toFixed(2)}</p>
              </div>
              <div className="item-quantity">
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus size={16} /></button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus size={16} /></button>
              </div>
              <div className="item-subtotal">
                <p>₹{((item.price || 0) * item.quantity).toFixed(2)}</p>
              </div>
              <button className="remove-btn" onClick={() => removeFromCart(item.id)}>
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>

        <div className="cart-summary glass-morphism">
          <h3>Order Summary</h3>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>₹{cartTotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>FREE</span>
          </div>
          <div className="summary-row total">
            <span>Order Total</span>
            <span>₹{cartTotal.toFixed(2)}</span>
          </div>
          <button 
            className="btn btn-primary btn-full checkout-btn"
            onClick={handleCheckout}
          >
            Checkout on WhatsApp <ArrowRight size={18} />
          </button>
          <div className="payment-icons">
             <p>Fast and direct ordering via WhatsApp</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
